import { Proposal, ApiResponse, ApiFilterParams, PagedResult, User } from '../types';
import { mockProposals } from '../mock/data';
import { apiClient } from './api/apiClient';
import { loadLocalValue, saveLocalValue } from './localStore';
import { toPersianDigits } from '../utils/formatters';
import { smsService } from './smsService';

const STORAGE_KEY = 'proposals';

export interface CreateProposalDto {
  title: string;
  proposerName: string;
  proposerUserId?: string;
  proposerDepartmentId: string;
  proposerDepartmentName: string;
  presenterUserId: string;
  presenterName: string;
  description: string;
  rationale?: string;
  notes?: string;
  source?: Proposal['source'];
  sourceLetterNumber?: string;
  sourceLetterDateJalali?: string;
  sourceLetterSubject?: string;
}

const getCurrentTimeString = (): string => toPersianDigits(
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
);

const getJalaliDate = (date: Date = new Date()): string => new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date).replace(/[\u200e\u200f]/g, '');

export interface IProposalService {
  getProposals(params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Proposal>>>;
  createProposal(dto: CreateProposalDto): Promise<ApiResponse<Proposal>>;
  reviewProposal(id: string, decision: 'APPROVED' | 'REJECTED', notes: string | undefined, actor: User): Promise<ApiResponse<Proposal>>;
  forwardToCeo(id: string): Promise<ApiResponse<Proposal>>;
  recoverProposal(id: string): Promise<ApiResponse<Proposal>>;
  returnForRevision(id: string, reason: string, actor: User): Promise<ApiResponse<Proposal>>;
  resubmitProposal(id: string, updates: { title: string; description: string; rationale?: string }, actor: User): Promise<ApiResponse<Proposal>>;
  decideWithoutBoard(id: string, decision: 'NO_BOARD_REQUIRED' | 'CEO_ORDER_ISSUED' | 'CLOSED', notes: string, actor: User, order?: Proposal['ceoOrder']): Promise<ApiResponse<Proposal>>;
  updateCeoOrderStatus(id: string, status: 'IN_PROGRESS' | 'COMPLETED', actor: User): Promise<ApiResponse<Proposal>>;
  confirmForMeeting(id: string): Promise<ApiResponse<Proposal>>;
  markConvertedToAgenda(id: string, meetingId: string, meetingTitle: string, relatedUsers?: Proposal['relatedUsers']): Promise<ApiResponse<Proposal>>;
}

class MockProposalService implements IProposalService {
  private getData = (): Proposal[] => loadLocalValue<Proposal[]>(STORAGE_KEY, mockProposals).map((proposal, index) => ({
    ...proposal,
    proposalNumber: proposal.proposalNumber || `پیشنهاد-۱۴۰۳-${toPersianDigits(index + 1)}`,
    status: proposal.status === 'PENDING_OFFICE_REVIEW' ? 'PENDING_CEO_REVIEW' : proposal.status,
    presenterUserId: proposal.presenterUserId || proposal.confirmedPresenterId || proposal.proposerUserId,
    presenterName: proposal.presenterName || proposal.confirmedPresenterName || proposal.proposerName,
    dateJalali: proposal.dateJalali || getJalaliDate(new Date(proposal.createdAt)),
    history: proposal.history || [],
    updatedAt: proposal.updatedAt || proposal.createdAt,
  }));
  private saveData = (proposals: Proposal[]) => saveLocalValue(STORAGE_KEY, proposals);

  private addHistory(proposal: Proposal, actor: User, action: string, fromStatus: string, notes?: string) {
    proposal.history = [
      ...(proposal.history || []),
      {
        id: `proposal-history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        action,
        actorUserId: actor.id,
        actorName: actor.fullName,
        actorRole: actor.title,
        fromStatus,
        toStatus: proposal.status,
        dateJalali: getJalaliDate(),
        timeString: getCurrentTimeString(),
        notes,
      },
    ];
    proposal.updatedAt = new Date().toISOString();
  }

  public async getProposals(params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Proposal>>> {
    let filtered = this.getData();

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((p) => p.status === params.status);
    }
    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(term) || p.proposerName.toLowerCase().includes(term));
    }

    filtered = [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 50;
    const totalCount = filtered.length;
    const items = filtered.slice((pageIndex - 1) * pageSize, (pageIndex - 1) * pageSize + pageSize);

    return apiClient.simulateNetwork<PagedResult<Proposal>>({
      items, totalCount, pageIndex, pageSize, totalPages: Math.ceil(totalCount / pageSize),
    }, 120);
  }

  public async createProposal(dto: CreateProposalDto): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const source = dto.source || 'MANUAL';
    const newProposal: Proposal = {
      id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      proposalNumber: `پیشنهاد-۱۴۰۳-${toPersianDigits(proposals.length + 1)}`,
      ...dto,
      source,
      dateJalali: getJalaliDate(),
      attachments: [],
      status: 'PENDING_CEO_REVIEW',
      history: [{
        id: `proposal-history-${Date.now()}`,
        action: source === 'EXCEL_IMPORT' ? 'پیشنهاد از طریق فایل Excel ثبت و برای مدیرعامل ارسال شد' : 'ثبت و ارسال پیشنهاد برای مدیرعامل',
        actorUserId: dto.proposerUserId || 'unknown',
        actorName: dto.proposerName,
        actorRole: dto.proposerDepartmentName,
        toStatus: 'PENDING_CEO_REVIEW',
        dateJalali: getJalaliDate(),
        timeString: getCurrentTimeString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    proposals.unshift(newProposal);
    this.saveData(proposals);
    return apiClient.simulateNetwork(newProposal, 150);
  }

  public async forwardToCeo(id: string): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    if (proposal.status !== 'PENDING_OFFICE_REVIEW') throw new Error('فقط موارد در انتظار بررسی مسئول دفتر قابل ارسال برای مدیرعامل هستند');
    proposal.status = 'PENDING_CEO_REVIEW';
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async reviewProposal(id: string, decision: 'APPROVED' | 'REJECTED', notes: string | undefined, actor: User): Promise<ApiResponse<Proposal>> {
    if (!['CEO', 'ADMIN'].includes(actor.role)) throw new Error('فقط مدیرعامل مجاز به بررسی پیشنهاد است');
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    if (!['PENDING_CEO_REVIEW', 'RESUBMITTED'].includes(proposal.status)) throw new Error('فقط پیشنهادهای در انتظار مدیرعامل قابل بررسی هستند');
    const previousStatus = proposal.status;
    proposal.status = decision;
    proposal.managementDecisionNotes = notes;
    this.addHistory(proposal, actor, decision === 'APPROVED' ? 'تأیید جهت طرح در هیأت‌مدیره' : 'رد پیشنهاد', previousStatus, notes);
    this.saveData(proposals);
    if (decision === 'REJECTED') await smsService.sendProposalRejection(proposal);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async recoverProposal(id: string): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    if (proposal.status !== 'REJECTED') throw new Error('فقط موارد رد شده قابل بازیافت هستند');
    proposal.status = 'PENDING_CEO_REVIEW';
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async returnForRevision(id: string, reason: string, actor: User): Promise<ApiResponse<Proposal>> {
    if (!['CEO', 'ADMIN'].includes(actor.role)) throw new Error('فقط مدیرعامل مجاز به برگشت پیشنهاد است');
    if (!reason.trim()) throw new Error('ثبت دلیل برگشت پیشنهاد الزامی است');
    const proposals = this.getData();
    const proposal = proposals.find((item) => item.id === id);
    if (!proposal) throw new Error('پیشنهاد یافت نشد');
    if (!['PENDING_CEO_REVIEW', 'RESUBMITTED'].includes(proposal.status)) throw new Error('این پیشنهاد در کارتابل بررسی مدیرعامل نیست');
    const previousStatus = proposal.status;
    proposal.status = 'RETURNED_FOR_REVISION';
    proposal.managementDecisionNotes = reason.trim();
    this.addHistory(proposal, actor, 'برگشت پیشنهاد جهت اصلاح و تکمیل', previousStatus, reason.trim());
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async resubmitProposal(id: string, updates: { title: string; description: string; rationale?: string }, actor: User): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((item) => item.id === id);
    if (!proposal) throw new Error('پیشنهاد یافت نشد');
    if (proposal.status !== 'RETURNED_FOR_REVISION' || proposal.proposerUserId !== actor.id) throw new Error('فقط پیشنهاددهنده می‌تواند پیشنهاد برگشتی را ارسال مجدد کند');
    if (!updates.title.trim() || !updates.description.trim()) throw new Error('عنوان و شرح پیشنهاد الزامی است');
    proposal.title = updates.title.trim();
    proposal.description = updates.description.trim();
    proposal.rationale = updates.rationale?.trim();
    proposal.status = 'RESUBMITTED';
    this.addHistory(proposal, actor, 'اصلاح و ارسال مجدد پیشنهاد', 'RETURNED_FOR_REVISION');
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async decideWithoutBoard(id: string, decision: 'NO_BOARD_REQUIRED' | 'CEO_ORDER_ISSUED' | 'CLOSED', notes: string, actor: User, order?: Proposal['ceoOrder']): Promise<ApiResponse<Proposal>> {
    if (!['CEO', 'ADMIN'].includes(actor.role)) throw new Error('فقط مدیرعامل مجاز به ثبت این تصمیم است');
    if (!notes.trim()) throw new Error('ثبت توضیحات تصمیم مدیرعامل الزامی است');
    const proposals = this.getData();
    const proposal = proposals.find((item) => item.id === id);
    if (!proposal) throw new Error('پیشنهاد یافت نشد');
    if (!['PENDING_CEO_REVIEW', 'RESUBMITTED'].includes(proposal.status)) throw new Error('این پیشنهاد در کارتابل بررسی مدیرعامل نیست');
    if (decision === 'CEO_ORDER_ISSUED' && (!order?.text.trim() || !order.assigneeUserId || !order.deadlineJalali)) throw new Error('متن دستور، مسئول اقدام و مهلت انجام الزامی است');
    const previousStatus = proposal.status;
    proposal.status = decision;
    proposal.managementDecisionNotes = notes.trim();
    proposal.ceoOrder = decision === 'CEO_ORDER_ISSUED' ? order : undefined;
    const labels = { NO_BOARD_REQUIRED: 'عدم نیاز به طرح در هیأت‌مدیره', CEO_ORDER_ISSUED: 'صدور دستور مستقیم مدیرعامل', CLOSED: 'مختومه و بایگانی پیشنهاد' };
    this.addHistory(proposal, actor, labels[decision], previousStatus, notes.trim());
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async updateCeoOrderStatus(id: string, status: 'IN_PROGRESS' | 'COMPLETED', actor: User): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((item) => item.id === id);
    if (!proposal?.ceoOrder) throw new Error('دستور مدیرعامل یافت نشد');
    if (proposal.ceoOrder.assigneeUserId !== actor.id && actor.role !== 'ADMIN') throw new Error('فقط مسئول تعیین‌شده می‌تواند وضعیت دستور را تغییر دهد');
    const previousStatus = proposal.ceoOrder.status;
    proposal.ceoOrder.status = status;
    this.addHistory(proposal, actor, status === 'COMPLETED' ? 'اعلام انجام دستور مدیرعامل' : 'آغاز اجرای دستور مدیرعامل', previousStatus);
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async confirmForMeeting(id: string): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    if (proposal.status !== 'APPROVED') throw new Error('فقط موارد تایید شده توسط مدیرعامل قابل تبدیل به تایید جلسه هستند');
    proposal.status = 'CONFIRMED_FOR_MEETING';
    proposal.confirmedPresenterId = proposal.presenterUserId;
    proposal.confirmedPresenterName = proposal.presenterName;
    proposal.confirmedDateJalali = getJalaliDate();
    proposal.confirmedTimeString = getCurrentTimeString();
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 120);
  }

  public async markConvertedToAgenda(id: string, meetingId: string, meetingTitle: string, relatedUsers: Proposal['relatedUsers'] = []): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    proposal.status = 'CONVERTED_TO_AGENDA';
    proposal.assignedMeetingId = meetingId;
    proposal.assignedMeetingTitle = meetingTitle;
    proposal.relatedUsers = relatedUsers;
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 100);
  }
}

export const proposalService: IProposalService = new MockProposalService();
