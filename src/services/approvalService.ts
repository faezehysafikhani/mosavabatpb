import { ApprovalCartableItem, ApiResponse, ApiFilterParams, PagedResult } from '../types';
import { mockApprovals } from '../mock/data';
import { apiClient } from './api/apiClient';
import { resolutionService } from './resolutionService';

export interface IApprovalService {
  getMyApprovals(userId?: string, params?: ApiFilterParams): Promise<ApiResponse<PagedResult<ApprovalCartableItem>>>;
  getApprovalById(id: string): Promise<ApiResponse<ApprovalCartableItem | null>>;
  approveItem(approvalId: string, comments: string, approverName: string): Promise<ApiResponse<ApprovalCartableItem>>;
  rejectItem(approvalId: string, rejectionReason: string, approverName: string): Promise<ApiResponse<ApprovalCartableItem>>;
}

class MockApprovalService implements IApprovalService {
  private approvals: ApprovalCartableItem[] = [...mockApprovals];

  public async getMyApprovals(userId?: string, params?: ApiFilterParams): Promise<ApiResponse<PagedResult<ApprovalCartableItem>>> {
    let filtered = [...this.approvals];

    if (userId) {
      filtered = filtered.filter((a) => a.assignedApproverId === userId);
    }

    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.resolutionTitle.toLowerCase().includes(term) ||
          a.resolutionNumber.toLowerCase().includes(term) ||
          a.responsibleName.toLowerCase().includes(term) ||
          a.meetingTitle.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === params.status);
    }

    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return apiClient.simulateNetwork<PagedResult<ApprovalCartableItem>>({
      items,
      totalCount,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }, 120);
  }

  public async getApprovalById(id: string): Promise<ApiResponse<ApprovalCartableItem | null>> {
    const item = this.approvals.find((a) => a.id === id) || null;
    return apiClient.simulateNetwork(item, 100);
  }

  public async approveItem(approvalId: string, comments: string, approverName: string): Promise<ApiResponse<ApprovalCartableItem>> {
    const index = this.approvals.findIndex((a) => a.id === approvalId);
    if (index === -1) throw new Error('مورد تأیید یافت نشد');

    const item = this.approvals[index];
    item.status = 'APPROVED';

    // Propagate approval to resolution service
    await resolutionService.approveVerificationStep(item.resolutionId, item.stepNumber, comments, approverName);

    return apiClient.simulateNetwork(item, 180);
  }

  public async rejectItem(approvalId: string, rejectionReason: string, approverName: string): Promise<ApiResponse<ApprovalCartableItem>> {
    const index = this.approvals.findIndex((a) => a.id === approvalId);
    if (index === -1) throw new Error('مورد تأیید یافت نشد');

    const item = this.approvals[index];
    item.status = 'REJECTED';

    // Propagate rejection to resolution service
    await resolutionService.rejectVerificationStep(item.resolutionId, item.stepNumber, rejectionReason, approverName);

    return apiClient.simulateNetwork(item, 180);
  }
}

export const approvalService: IApprovalService = new MockApprovalService();
