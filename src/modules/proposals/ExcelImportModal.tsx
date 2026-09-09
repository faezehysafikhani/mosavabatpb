import React, { useRef, useState } from 'react';
import { FileSpreadsheet, X, UploadCloud, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockDepartments } from '../../mock/data';
import { proposalService } from '../../services/proposalService';
import {
  ProposalImportParseResult,
  parseProposalExcelFile,
  importValidProposalRows,
} from '../../services/proposalExcelImportService';
import { toPersianDigits } from '../../utils/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
}

type ModalStep = 'UPLOAD' | 'PREVIEW' | 'RESULT';

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImported }) => {
  const { currentUser, availableUsers, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ModalStep>('UPLOAD');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parseResult, setParseResult] = useState<ProposalImportParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep('UPLOAD');
    setParseResult(null);
    setParseError(null);
    setImportSummary(null);
    setIsParsing(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelected = async (file: File) => {
    setParseError(null);
    setIsParsing(true);
    try {
      const existingProposalsRes = await proposalService.getProposals({ pageSize: 1000 });
      const result = await parseProposalExcelFile(file, {
        departments: mockDepartments,
        users: availableUsers,
        existingProposals: existingProposalsRes.isSuccess ? existingProposalsRes.data.items : [],
      });
      setParseResult(result);
      setStep('PREVIEW');
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'فایل قابل پردازش نیست.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleConfirmImport = async () => {
    if (!parseResult) return;
    const validRows = parseResult.rows.filter((row) => row.isValid);
    if (validRows.length === 0) return;
    const confirmed = window.confirm(
      `${toPersianDigits(validRows.length)} پیشنهاد معتبر از این فایل وارد سامانه و برای بررسی مدیرعامل ارسال خواهند شد. آیا ادامه می‌دهید؟`
    );
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const summary = await importValidProposalRows(parseResult.rows, currentUser);
      setImportSummary({ imported: summary.importedCount, skipped: parseResult.rows.length - summary.importedCount });
      setStep('RESULT');
      onImported();
      showToast('ورود از Excel', `${toPersianDigits(summary.importedCount)} پیشنهاد با موفقیت ثبت و به کارتابل مدیرعامل ارسال شد.`, 'success');
    } catch (error) {
      showToast('خطا', error instanceof Error ? error.message : 'ثبت پیشنهادها انجام نشد.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="app-modal-header text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ورود پیشنهاد مصوبات از Excel</h3>
              <p className="text-[11px] text-teal-200">آپلود، بررسی و پیش‌نمایش پیش از ثبت نهایی</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {step === 'UPLOAD' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-10 text-center bg-slate-50/50 transition-colors"
            >
              {isParsing ? (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
                  <p className="text-xs font-bold">در حال خواندن و بررسی فایل...</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-9 h-9 text-teal-700 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700 mb-1">فایل Excel تکمیل‌شده را انتخاب یا رها کنید</p>
                  <p className="text-[10px] text-slate-400 mb-4">فقط فرمت xlsx. پذیرفته می‌شود</p>
                  <label className="bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                    <span>انتخاب فایل</span>
                    <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileInputChange} />
                  </label>
                </>
              )}
              {parseError && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-start gap-2 text-right">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {step === 'PREVIEW' && parseResult && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                <span className="font-bold text-slate-700">فایل: {parseResult.fileName}</span>
                <span className="text-slate-500">تعداد ردیف‌ها: {toPersianDigits(parseResult.totalRows)}</span>
                <span className="text-emerald-700 font-bold">معتبر: {toPersianDigits(parseResult.validCount)}</span>
                <span className="text-rose-700 font-bold">دارای خطا: {toPersianDigits(parseResult.invalidCount)}</span>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full min-w-[760px] text-right text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-2 px-2.5 font-semibold">ردیف</th>
                      <th className="py-2 px-2.5 font-semibold">عنوان</th>
                      <th className="py-2 px-2.5 font-semibold">سازمان</th>
                      <th className="py-2 px-2.5 font-semibold">ارائه‌دهنده</th>
                      <th className="py-2 px-2.5 font-semibold">شماره نامه</th>
                      <th className="py-2 px-2.5 font-semibold">تاریخ نامه</th>
                      <th className="py-2 px-2.5 font-semibold">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.rows.map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? '' : 'bg-rose-50/40'}>
                        <td className="py-2 px-2.5 text-slate-500">{toPersianDigits(row.rowNumber)}</td>
                        <td className="py-2 px-2.5 text-slate-700 font-bold max-w-[160px] truncate" title={row.title}>{row.title || '—'}</td>
                        <td className="py-2 px-2.5 text-slate-600">{row.matchedDepartment?.name || row.proposerDepartmentNameRaw || '—'}</td>
                        <td className="py-2 px-2.5 text-slate-600">{row.matchedPresenter?.fullName || row.presenterNameRaw || '—'}</td>
                        <td className="py-2 px-2.5 text-slate-600">{toPersianDigits(row.letterNumber) || '—'}</td>
                        <td className="py-2 px-2.5 text-slate-600">{toPersianDigits(row.letterDateJalali) || '—'}</td>
                        <td className="py-2 px-2.5">
                          {row.isValid ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">معتبر</span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200">خطا</span>
                              <ul className="text-[10px] text-rose-600 list-disc pr-3">
                                {row.errors.map((err, i) => <li key={i}>{err}</li>)}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'RESULT' && importSummary && parseResult && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-slate-800">ورود اطلاعات با موفقیت انجام شد.</p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>{toPersianDigits(parseResult.rows.length)} ردیف بررسی شد.</p>
                <p className="text-emerald-700 font-bold">{toPersianDigits(importSummary.imported)} پیشنهاد ثبت و به کارتابل مدیرعامل ارسال شد.</p>
                {importSummary.skipped > 0 && (
                  <p className="text-rose-700 font-bold">{toPersianDigits(importSummary.skipped)} ردیف به دلیل خطا یا تکراری بودن ثبت نشد.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          {step === 'UPLOAD' && (
            <button onClick={handleClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer">
              انصراف
            </button>
          )}
          {step === 'PREVIEW' && (
            <>
              <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer">
                انتخاب فایل دیگر
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || parseResult.validCount === 0}
                className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isImporting ? 'در حال ثبت...' : 'ثبت و ارسال پیشنهادهای معتبر'}</span>
              </button>
            </>
          )}
          {step === 'RESULT' && (
            <button onClick={handleClose} className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md cursor-pointer">
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
