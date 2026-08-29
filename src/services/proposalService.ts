import { Proposal, ApiResponse, ApiFilterParams, PagedResult, AgendaItem } from '../types';
import { mockProposals } from '../mock/data';
import { apiClient } from './api/apiClient';
import { loadLocalValue, saveLocalValue } from './localStore';
import { meetingService } from './meetingService';

const STORAGE_KEY = 'proposals';

export interface CreateProposalDto {
  title: string;
  proposerName: string;
  proposerDepartmentId: string;
  proposerDepartmentName: string;
  description: string;
  dateJalali: string;
}

export interface IProposalService {
  getProposals(params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Proposal>>>;
  createProposal(dto: CreateProposalDto): Promise<ApiResponse<Proposal>>;
  reviewProposals(ids: string[], decision: 'ASSIGNED_TO_MEETING' | 'REJECTED', meetingId?: string, meetingTitle?: string, notes?: string): Promise<ApiResponse<boolean>>;
  convertToAgendaItem(id: string): Promise<ApiResponse<Proposal>>;
}

class MockProposalService implements IProposalService {
  private getData = (): Proposal[] => loadLocalValue(STORAGE_KEY, mockProposals);
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
      attachments: [],
      status: 'PENDING_MANAGEMENT_REVIEW',
      createdAt: new Date().toISOString(),
    };
    proposals.unshift(newProposal);
    this.saveData(proposals);
    return apiClient.simulateNetwork(newProposal, 150);
  }

  public async reviewProposals(ids: string[], decision: 'ASSIGNED_TO_MEETING' | 'REJECTED', meetingId?: string, meetingTitle?: string, notes?: string): Promise<ApiResponse<boolean>> {
    const proposals = this.getData();
    proposals.forEach((p) => {
      if (!ids.includes(p.id)) return;
      p.status = decision;
      p.managementDecisionNotes = notes || p.managementDecisionNotes;
      if (decision === 'ASSIGNED_TO_MEETING') {
        p.assignedMeetingId = meetingId;
        p.assignedMeetingTitle = meetingTitle;
      }
    });
    this.saveData(proposals);
    return apiClient.simulateNetwork(true, 150);
  }

  public async convertToAgendaItem(id: string): Promise<ApiResponse<Proposal>> {
    const proposals = this.getData();
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) throw new Error('پیشنهاد یافت نشد');
    if (!proposal.assignedMeetingId) throw new Error('جلسه مقصد برای این پیشنهاد تعیین نشده است');

    const meetingRes = await meetingService.getMeetingById(proposal.assignedMeetingId);
    const meeting = meetingRes.data;
    if (!meeting) throw new Error('جلسه مقصد یافت نشد');

    const newAgendaItem: AgendaItem = {
      id: `ag-${Date.now()}`,
      order: meeting.agendaItems.length + 1,
      rowNumber: meeting.agendaItems.length + 1,
      title: proposal.title,
      presenter: proposal.proposerName,
      presenterName: proposal.proposerName,
      description: proposal.description,
      isDiscussed: false,
      status: 'PENDING',
    };

    await meetingService.updateMeeting(meeting.id, { agendaItems: [...meeting.agendaItems, newAgendaItem] });

    proposal.status = 'CONVERTED_TO_AGENDA';
    this.saveData(proposals);
    return apiClient.simulateNetwork(proposal, 150);
  }
}

export const proposalService: IProposalService = new MockProposalService();
