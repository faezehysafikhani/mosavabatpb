import { Proposal, ApiResponse, ApiFilterParams, PagedResult } from '../types';
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
  reviewProposal(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string): Promise<ApiResponse<Proposal>>;
  forwardToCeo(id: string): Promise<ApiResponse<Proposal>>;
  recoverProposal(id: string): Promise<ApiResponse<Proposal>>;
  confirmForMeeting(id: string): Promise<ApiResponse<Proposal>>;
  markConvertedToAgenda(id: string, meetingId: string, meetingTitle: string, relatedUsers?: Proposal['relatedUsers']): Promise<ApiResponse<Proposal>>;
}

class MockProposalService implements IProposalService {
  private getData = (): Proposal[] => loadLocalValue<Proposal[]>(STORAGE_KEY, mockProposals).map((proposal) => ({
    ...proposal,
    status: proposal.status === 'PENDING_OFFICE_REVIEW' ? 'PENDING_CEO_REVIEW' : proposal.status,
    presenterUserId: proposal.presenterUserId || proposal.confirmedPresenterId || proposal.proposerUserId,
    presenterName: proposal.presenterName || proposal.confirmedPresenterName || proposal.proposerName,
    dateJalali: proposal.dateJalali || getJalaliDate(new Date(proposal.createdAt)),
  }));
  private saveData = (proposals: Proposal[]) => saveLocalValue(STORAGE_KEY, proposals);

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
    const newProposal: Proposal = {
      id: `prop-${Date.now()}`,
      ...dto,
      dateJalali: getJalaliDate(),
      attachments: [],
      status: 'PENDING_CEO_REVIEW',
      createdAt: new Date().toISOString(),
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

  public async reviewProposal(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('مصوبه پیشنهادی یافت نشد');
    if (proposal.status !== 'PENDING_CEO_REVIEW') throw new Error('فقط پیشنهادهای در انتظار مدیرعامل قابل بررسی هستند');
    proposal.status = decision;
    proposal.managementDecisionNotes = notes;
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
