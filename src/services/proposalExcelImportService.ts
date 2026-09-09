/**
 * Excel bulk-import for پیشنهاد مصوبات (proposed resolutions).
 *
 * This is only an additional *entry method* for the existing Proposal
 * workflow: every valid row is turned into a normal Proposal through
 * proposalService.createProposal, so it lands in the CEO's cartable exactly
 * like a manually-submitted proposal. No parallel workflow, entity, or
 * cartable is introduced here.
 */
import * as XLSX from 'xlsx';
import { Department, Proposal, User } from '../types';
import { proposalService, CreateProposalDto } from './proposalService';

export const PROPOSAL_EXCEL_SHEET_NAME = 'پیشنهادها';

export const PROPOSAL_EXCEL_HEADERS = [
  'عنوان پیشنهاد',
  'شرح پیشنهاد',
  'سازمان پیشنهاددهنده',
  'ارائه‌دهنده',
  'شماره نامه',
  'تاریخ نامه',
  'موضوع نامه',
  'توضیحات',
] as const;

const REQUIRED_HEADERS: string[] = [
  'عنوان پیشنهاد',
  'شرح پیشنهاد',
  'سازمان پیشنهاددهنده',
  'ارائه‌دهنده',
  'شماره نامه',
  'تاریخ نامه',
];

export interface ProposalImportRow {
  rowNumber: number; // matches the row number as it appears in Excel (header = row 1)
  title: string;
  description: string;
  proposerDepartmentNameRaw: string;
  presenterNameRaw: string;
  letterNumber: string;
  letterDateJalali: string;
  letterSubject?: string;
  notes?: string;
  errors: string[];
  isValid: boolean;
  isDuplicate: boolean;
  matchedDepartment?: Department;
  matchedPresenter?: User;
}

export interface ProposalImportParseResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: ProposalImportRow[];
}

export interface ProposalImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  createdProposals: Proposal[];
}

const normalizeText = (value: unknown): string =>
  String(value ?? '').replace(/[‌‎‏]/g, '').trim();

const normalizeForMatch = (value: string): string =>
  normalizeText(value)
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const normalizeDigits = (value: string): string =>
  value.replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)));

const isValidJalaliDate = (value: string): boolean => {
  const western = normalizeDigits(value.trim());
  const match = western.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (!match) return false;
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};

const matchDepartment = (raw: string, departments: Department[]): Department | undefined => {
  const normalized = normalizeForMatch(raw);
  return departments.find((dept) => normalizeForMatch(dept.name) === normalized);
};

// Exact match only (username or full display name) — deliberately no
// partial/fuzzy matching, since a wrong presenter must never be guessed.
const matchPresenter = (raw: string, users: User[]): User | undefined => {
  const trimmed = raw.trim();
  const byUsername = users.find((user) => user.username && user.username.toLowerCase() === trimmed.toLowerCase());
  if (byUsername) return byUsername;
  const normalized = normalizeForMatch(raw);
  const byName = users.filter((user) => normalizeForMatch(user.fullName) === normalized);
  return byName.length === 1 ? byName[0] : undefined;
};

export interface ParseProposalExcelContext {
  departments: Department[];
  users: User[];
  existingProposals: Proposal[];
}

export async function parseProposalExcelFile(
  file: File,
  context: ParseProposalExcelContext
): Promise<ProposalImportParseResult> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new Error('فقط فایل با فرمت xlsx. پذیرفته می‌شود.');
  }

  const buffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch {
    throw new Error('فایل اکسل قابل خواندن نیست؛ فایل ممکن است خراب یا نامعتبر باشد.');
  }

  const sheetName = workbook.SheetNames.includes(PROPOSAL_EXCEL_SHEET_NAME)
    ? PROPOSAL_EXCEL_SHEET_NAME
    : workbook.SheetNames.find((name) => !/راهنما/i.test(name));
  if (!sheetName) {
    throw new Error(`Sheet مورد انتظار («${PROPOSAL_EXCEL_SHEET_NAME}») در فایل یافت نشد.`);
  }

  const sheet = workbook.Sheets[sheetName];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: '' });
  if (raw.length === 0) {
    throw new Error('فایل اکسل خالی است.');
  }

  // normalizeText strips ZWNJ/direction marks, so the same normalization is
  // applied to the expected header strings before comparing — otherwise a
  // header like "ارائه‌دهنده" (which contains a ZWNJ) would never match.
  const headerRow = raw[0].map((cell) => normalizeText(cell));
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headerRow.includes(normalizeText(header)));
  if (missingHeaders.length > 0) {
    throw new Error(`ستون(های) اجباری در فایل یافت نشد: ${missingHeaders.join('، ')}`);
  }

  const columnIndex = (header: string) => headerRow.indexOf(normalizeText(header));
  const idx = {
    title: columnIndex('عنوان پیشنهاد'),
    description: columnIndex('شرح پیشنهاد'),
    department: columnIndex('سازمان پیشنهاددهنده'),
    presenter: columnIndex('ارائه‌دهنده'),
    letterNumber: columnIndex('شماره نامه'),
    letterDate: columnIndex('تاریخ نامه'),
    letterSubject: columnIndex('موضوع نامه'),
    notes: columnIndex('توضیحات'),
  };

  const rows: ProposalImportRow[] = [];
  const seenInFile = new Set<string>();

  raw.slice(1).forEach((cells, offset) => {
    const rowNumber = offset + 2; // header occupies row 1
    const isBlankRow = cells.every((cell) => normalizeText(cell) === '');
    if (isBlankRow) return;

    const title = normalizeText(cells[idx.title]);
    const description = normalizeText(cells[idx.description]);
    const proposerDepartmentNameRaw = normalizeText(cells[idx.department]);
    const presenterNameRaw = normalizeText(cells[idx.presenter]);
    const letterNumber = normalizeText(cells[idx.letterNumber]);
    const letterDateJalali = normalizeText(cells[idx.letterDate]);
    const letterSubject = idx.letterSubject >= 0 ? normalizeText(cells[idx.letterSubject]) : undefined;
    const notes = idx.notes >= 0 ? normalizeText(cells[idx.notes]) : undefined;

    const errors: string[] = [];
    if (!title) errors.push('عنوان پیشنهاد وارد نشده است.');
    if (!description) errors.push('شرح پیشنهاد وارد نشده است.');
    if (!letterNumber) errors.push('شماره نامه وارد نشده است.');
    if (!letterDateJalali) errors.push('تاریخ نامه وارد نشده است.');
    else if (!isValidJalaliDate(letterDateJalali)) errors.push('تاریخ نامه معتبر نیست.');

    let matchedDepartment: Department | undefined;
    if (!proposerDepartmentNameRaw) {
      errors.push('سازمان پیشنهاددهنده وارد نشده است.');
    } else {
      matchedDepartment = matchDepartment(proposerDepartmentNameRaw, context.departments);
      if (!matchedDepartment) errors.push(`سازمان «${proposerDepartmentNameRaw}» با هیچ سازمان ثبت‌شده‌ای مطابقت ندارد.`);
    }

    let matchedPresenter: User | undefined;
    if (!presenterNameRaw) {
      errors.push('ارائه‌دهنده وارد نشده است.');
    } else {
      matchedPresenter = matchPresenter(presenterNameRaw, context.users);
      if (!matchedPresenter) errors.push(`ارائه‌دهنده «${presenterNameRaw}» با هیچ کاربر ثبت‌شده‌ای مطابقت ندارد.`);
    }

    let isDuplicate = false;
    if (letterNumber && matchedDepartment) {
      const dupKey = `${normalizeForMatch(letterNumber)}::${matchedDepartment.id}`;
      const existsInSystem = context.existingProposals.some(
        (proposal) =>
          proposal.source === 'EXCEL_IMPORT' &&
          proposal.sourceLetterNumber &&
          normalizeForMatch(proposal.sourceLetterNumber) === normalizeForMatch(letterNumber) &&
          proposal.proposerDepartmentId === matchedDepartment!.id
      );
      const existsInFile = seenInFile.has(dupKey);
      if (existsInSystem || existsInFile) {
        isDuplicate = true;
        errors.push('این نامه قبلاً وارد سامانه شده است.');
      }
      seenInFile.add(dupKey);
    }

    rows.push({
      rowNumber,
      title,
      description,
      proposerDepartmentNameRaw,
      presenterNameRaw,
      letterNumber,
      letterDateJalali,
      letterSubject,
      notes,
      errors,
      isValid: errors.length === 0,
      isDuplicate,
      matchedDepartment,
      matchedPresenter,
    });
  });

  return {
    fileName: file.name,
    totalRows: rows.length,
    validCount: rows.filter((row) => row.isValid).length,
    invalidCount: rows.filter((row) => !row.isValid).length,
    rows,
  };
}

// Sequential by design: each row goes through the same createProposal call
// a manual submission uses, one at a time, so a row can never be created
// twice even if this is re-invoked (callers must also disable the confirm
// button for the duration of the call — see CreateProposalModal's pattern).
export async function importValidProposalRows(rows: ProposalImportRow[], actor: User): Promise<ProposalImportSummary> {
  const validRows = rows.filter((row) => row.isValid && row.matchedDepartment && row.matchedPresenter);
  const createdProposals: Proposal[] = [];

  for (const row of validRows) {
    const dto: CreateProposalDto = {
      title: row.title,
      description: row.description,
      notes: row.notes || undefined,
      proposerName: actor.fullName,
      proposerUserId: actor.id,
      proposerDepartmentId: row.matchedDepartment!.id,
      proposerDepartmentName: row.matchedDepartment!.name,
      presenterUserId: row.matchedPresenter!.id,
      presenterName: row.matchedPresenter!.fullName,
      source: 'EXCEL_IMPORT',
      sourceLetterNumber: row.letterNumber,
      sourceLetterDateJalali: row.letterDateJalali,
      sourceLetterSubject: row.letterSubject || undefined,
    };
    // eslint-disable-next-line no-await-in-loop
    const res = await proposalService.createProposal(dto);
    createdProposals.push(res.data);
  }

  return {
    totalRows: rows.length,
    importedCount: createdProposals.length,
    skippedCount: rows.length - createdProposals.length,
    createdProposals,
  };
}

export function buildProposalExcelTemplate(): Blob {
  const sampleRow = [
    'مثال: برگزاری دوره آموزشی امنیت سایبری',
    'این موضوع چرا باید در جلسه مطرح و درباره آن تصمیم‌گیری شود؟',
    'اداره کل فناوری اطلاعات و ارتباطات',
    'مهندس پوریا حسینی',
    '۱۲۴۵',
    '۱۴۰۵/۰۶/۱۰',
    'درخواست تأمین زیرساخت شبکه',
    'توضیحات تکمیلی در صورت نیاز',
  ];

  const dataSheet = XLSX.utils.aoa_to_sheet([[...PROPOSAL_EXCEL_HEADERS], sampleRow]);
  dataSheet['!cols'] = PROPOSAL_EXCEL_HEADERS.map(() => ({ wch: 30 }));

  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['راهنمای تکمیل فایل ورود پیشنهاد مصوبات'],
    ['هر ردیف در Sheet «پیشنهادها» برابر با یک پیشنهاد مصوبه است.'],
    ['ستون‌های اجباری: عنوان پیشنهاد، شرح پیشنهاد، سازمان پیشنهاددهنده، ارائه‌دهنده، شماره نامه، تاریخ نامه'],
    ['فرمت تاریخ نامه: سال/ماه/روز شمسی — مثال: ۱۴۰۵/۰۶/۱۰'],
    ['نام سازمان پیشنهاددهنده باید دقیقاً با نام یکی از سازمان‌های ثبت‌شده در سامانه یکسان باشد.'],
    ['ارائه‌دهنده باید دقیقاً با نام کامل یا نام کاربری یکی از کاربران ثبت‌شده در سامانه یکسان باشد.'],
    ['ردیف اول (سرستون‌ها) نباید تغییر کند، جابه‌جا شود یا حذف شود.'],
    ['ردیف‌های کاملاً خالی پردازش نخواهند شد.'],
    ['ردیف نمونه (ردیف دوم Sheet «پیشنهادها») پیش از تکمیل باید حذف یا با اطلاعات واقعی جایگزین شود.'],
  ]);
  guideSheet['!cols'] = [{ wch: 95 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, PROPOSAL_EXCEL_SHEET_NAME);
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'راهنما');

  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadProposalExcelTemplate(): void {
  const blob = buildProposalExcelTemplate();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'قالب-ورود-پیشنهاد-مصوبات.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
