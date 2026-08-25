import { 
  Resolution, 
  ResolutionApprovalStatus, 
  ResolutionExecutionStatus, 
  PriorityLevel, 
  VerificationConfig, 
  ResolutionReferral, 
  ActivityLog, 
  ApiResponse, 
  ApiFilterParams, 
  PagedResult 
} from '../types';
import { mockResolutions, mockActivityLogs, mockTasks, mockApprovals } from '../mock/data';
import { apiClient } from './api/apiClient';

export interface CreateResolutionDto {
  meetingId: string;
  meetingTitle: string;
  meetingNumber: string;
  agendaItemId?: string;
  agendaItemTitle?: string;
  topicTitle: string;
  proposerName: string;
  proposerDepartment: string;
  requestDescription: string;
  reviewResultNotes?: string;
  approvalStatus: ResolutionApprovalStatus;
  
  // Execution details (if approved)
  executionDescription?: string;
  mainResponsibleUserId?: string;
  mainResponsibleName?: string;
  responsibleDepartmentId?: string;
  responsibleDepartmentName?: string;
  assignedDateJalali?: string;
  deadlineJalali?: string;
  priority?: PriorityLevel;
  referrals?: ResolutionReferral[];
  verificationConfig?: VerificationConfig;
  attachments?: Resolution['attachments'];
}

export interface IResolutionService {
  getResolutions(params?: ApiFilterParams & { approvalStatus?: string; executionStatus?: string; meetingId?: string }): Promise<ApiResponse<PagedResult<Resolution>>>;
  getResolutionById(id: string): Promise<ApiResponse<Resolution | null>>;
  createResolution(dto: CreateResolutionDto): Promise<ApiResponse<Resolution>>;
  updateResolution(id: string, dto: Partial<Resolution>): Promise<ApiResponse<Resolution>>;
  deleteResolution(id: string): Promise<ApiResponse<boolean>>;
  getResolutionActivityLogs(resolutionId: string): Promise<ApiResponse<ActivityLog[]>>;
  completeResolutionTask(resolutionId: string, completionNotes: string, attachments?: Resolution['attachments']): Promise<ApiResponse<Resolution>>;
  approveVerificationStep(resolutionId: string, stepNumber: number, comments: string, approverName: string): Promise<ApiResponse<Resolution>>;
  rejectVerificationStep(resolutionId: string, stepNumber: number, rejectionReason: string, approverName: string): Promise<ApiResponse<Resolution>>;
}

class MockResolutionService implements IResolutionService {
  private resolutions: Resolution[] = [...mockResolutions];
  private activityLogs: ActivityLog[] = [...mockActivityLogs];

  public async getResolutions(params?: ApiFilterParams & { approvalStatus?: string; executionStatus?: string; meetingId?: string; requiresVerification?: boolean }): Promise<ApiResponse<PagedResult<Resolution>>> {
    let filtered = [...this.resolutions];

    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.topicTitle.toLowerCase().includes(term) ||
          r.resolutionNumber.toLowerCase().includes(term) ||
          r.proposerName.toLowerCase().includes(term) ||
          (r.mainResponsibleName && r.mainResponsibleName.toLowerCase().includes(term)) ||
          (r.responsibleDepartmentName && r.responsibleDepartmentName.toLowerCase().includes(term))
      );
    }

    if (params?.meetingId) {
      filtered = filtered.filter((r) => r.meetingId === params.meetingId);
    }

    if (params?.approvalStatus && params.approvalStatus !== 'ALL') {
      filtered = filtered.filter((r) => r.approvalStatus === params.approvalStatus);
    }

    if (params?.executionStatus && params.executionStatus !== 'ALL') {
      filtered = filtered.filter((r) => r.executionStatus === params.executionStatus);
    }

    if (params?.departmentId && params.departmentId !== 'ALL') {
      filtered = filtered.filter((r) => r.responsibleDepartmentId === params.departmentId);
    }

    if (params?.requiresVerification !== undefined) {
      filtered = filtered.filter((r) => r.verificationConfig.requiresVerification === params.requiresVerification);
    }

    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return apiClient.simulateNetwork<PagedResult<Resolution>>({
      items,
      totalCount,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }, 150);
  }

  public async getResolutionById(id: string): Promise<ApiResponse<Resolution | null>> {
    const item = this.resolutions.find((r) => r.id === id) || null;
    return apiClient.simulateNetwork(item, 100);
  }

  public async createResolution(dto: CreateResolutionDto): Promise<ApiResponse<Resolution>> {
    const nextNum = this.resolutions.length + 98;
    const isApproved = dto.approvalStatus === 'APPROVED';

    const newResolution: Resolution = {
      id: `res-${Date.now()}`,
      resolutionNumber: `مصوبه-۱۴۰۳-${nextNum}`,
      meetingId: dto.meetingId,
      meetingTitle: dto.meetingTitle,
      meetingNumber: dto.meetingNumber,
      agendaItemId: dto.agendaItemId,
      agendaItemTitle: dto.agendaItemTitle,
      topicTitle: dto.topicTitle,
      proposerName: dto.proposerName,
      proposerDepartment: dto.proposerDepartment,
      requestDescription: dto.requestDescription,
      reviewResultNotes: dto.reviewResultNotes,
      approvalStatus: dto.approvalStatus,
      
      executionDescription: isApproved ? dto.executionDescription : '',
      mainResponsibleUserId: isApproved ? dto.mainResponsibleUserId : undefined,
      mainResponsibleName: isApproved ? dto.mainResponsibleName : undefined,
      responsibleDepartmentId: isApproved ? dto.responsibleDepartmentId : undefined,
      responsibleDepartmentName: isApproved ? dto.responsibleDepartmentName : undefined,
      assignedDateJalali: isApproved ? (dto.assignedDateJalali || '۱۴۰۳/۰۶/۲۸') : undefined,
      deadlineJalali: isApproved ? dto.deadlineJalali : undefined,
      priority: dto.priority || 'MEDIUM',
      executionStatus: isApproved ? 'IN_PROGRESS' : 'NOT_STARTED',
      referrals: dto.referrals || [],
      verificationConfig: dto.verificationConfig || {
        requiresVerification: false,
        mode: 'SEQUENTIAL',
        currentStepIndex: 0,
        steps: [],
      },
      attachments: dto.attachments || [],
      createdAt: new Date().toISOString(),
    };

    this.resolutions.unshift(newResolution);

    // If approved and assigned to a user, create corresponding Task in cartable
    if (isApproved && newResolution.mainResponsibleUserId) {
      mockTasks.unshift({
        id: `task-${Date.now()}`,
        resolutionId: newResolution.id,
        resolutionNumber: newResolution.resolutionNumber,
        resolutionTitle: newResolution.topicTitle,
        meetingId: newResolution.meetingId,
        meetingTitle: newResolution.meetingTitle,
        assignedToUserId: newResolution.mainResponsibleUserId,
        assignedToName: newResolution.mainResponsibleName || 'مسئول اجرا',
        departmentId: newResolution.responsibleDepartmentId || 'dept-1',
        departmentName: newResolution.responsibleDepartmentName || 'واحد مسئول',
        referralDateJalali: newResolution.assignedDateJalali || '۱۴۰۳/۰۶/۲۸',
        deadlineJalali: newResolution.deadlineJalali || '۱۴۰۳/۰۷/۱۵',
        priority: newResolution.priority,
        status: 'IN_PROGRESS',
        requiresVerification: newResolution.verificationConfig.requiresVerification,
        instructions: newResolution.executionDescription || newResolution.requestDescription,
        attachments: newResolution.attachments,
      });
    }

    // Add activity log
    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      targetType: 'RESOLUTION',
      targetId: newResolution.id,
      action: isApproved ? 'تصویب و ابلاغ مصوبه' : 'ثبت نتیجه بررسی جلسه',
      actorName: 'دبیر شورای راهبری',
      actorRole: 'دبیرخانه جلسات',
      timestampJalali: '۱۴۰۳/۰۶/۲۸',
      timeString: '۱۱:۳۰',
      details: isApproved
        ? `مصوبه تصویب شد و به واحد ${newResolution.responsibleDepartmentName || ''} ارجاع گردید.`
        : `وضعیت بررسی: ${dto.approvalStatus}`,
      badgeColor: isApproved ? 'teal' : 'amber',
    });

    return apiClient.simulateNetwork(newResolution, 200);
  }

  public async updateResolution(id: string, dto: Partial<Resolution>): Promise<ApiResponse<Resolution>> {
    const index = this.resolutions.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('مصوبه یافت نشد');
    }
    this.resolutions[index] = { ...this.resolutions[index], ...dto };
    return apiClient.simulateNetwork(this.resolutions[index], 150);
  }

  public async deleteResolution(id: string): Promise<ApiResponse<boolean>> {
    const initialLen = this.resolutions.length;
    this.resolutions = this.resolutions.filter((r) => r.id !== id);
    return apiClient.simulateNetwork(this.resolutions.length < initialLen, 150);
  }

  public async getResolutionActivityLogs(resolutionId: string): Promise<ApiResponse<ActivityLog[]>> {
    const logs = this.activityLogs.filter((l) => l.targetId === resolutionId || l.targetType === 'RESOLUTION');
    return apiClient.simulateNetwork(logs, 100);
  }

  /**
   * Complete Task by Assignee
   * If verification is required -> state moves to PENDING_APPROVAL and enters Approver's cartable.
   * If NOT required -> state moves directly to APPROVED_CLOSED!
   */
  public async completeResolutionTask(resolutionId: string, completionNotes: string, attachments?: Resolution['attachments']): Promise<ApiResponse<Resolution>> {
    const resIndex = this.resolutions.findIndex((r) => r.id === resolutionId);
    if (resIndex === -1) throw new Error('مصوبه یافت نشد');

    const res = this.resolutions[resIndex];
    const requiresVerif = res.verificationConfig?.requiresVerification && res.verificationConfig.steps.length > 0;

    res.completionNotes = completionNotes;
    res.completionDateJalali = '۱۴۰۳/۰۶/۲۸';
    if (attachments && attachments.length > 0) {
      res.attachments = [...res.attachments, ...attachments];
    }

    if (requiresVerif) {
      res.executionStatus = 'PENDING_APPROVAL';
      res.verificationConfig.currentStepIndex = 0;
      
      // Update/add to mockApprovals
      const firstStep = res.verificationConfig.steps[0];
      mockApprovals.unshift({
        id: `appr-${Date.now()}`,
        resolutionId: res.id,
        resolutionNumber: res.resolutionNumber,
        resolutionTitle: res.topicTitle,
        meetingTitle: res.meetingTitle,
        responsibleName: res.mainResponsibleName || 'مسئول اجرا',
        responsibleDepartment: res.responsibleDepartmentName || 'واحد اجرایی',
        completedDateJalali: '۱۴۰۳/۰۶/۲۸',
        submittedForApprovalDateJalali: '۱۴۰۳/۰۶/۲۸',
        stepNumber: 1,
        totalSteps: res.verificationConfig.steps.length,
        stepTitle: `مرحله ۱ از ${res.verificationConfig.steps.length}: صحه‌گذاری توسط ${firstStep.approverName}`,
        assignedApproverId: firstStep.approverId,
        status: 'PENDING',
        completionReport: completionNotes,
        attachments: res.attachments,
      });

      this.activityLogs.unshift({
        id: `log-${Date.now()}`,
        targetType: 'RESOLUTION',
        targetId: res.id,
        action: 'اعلام اتمام وظیفه و ارسال جهت صحه‌گذاری',
        actorName: res.mainResponsibleName || 'مسئول اجرا',
        actorRole: 'مجری مصوبه',
        timestampJalali: '۱۴۰۳/۰۶/۲۸',
        timeString: '۱۵:۴۰',
        details: `گزارش تکمیل ثبت و به کارتابل ${firstStep.approverName} جهت صحه‌گذاری ارسال شد.`,
        badgeColor: 'purple',
      });
    } else {
      res.executionStatus = 'APPROVED_CLOSED';
      this.activityLogs.unshift({
        id: `log-${Date.now()}`,
        targetType: 'RESOLUTION',
        targetId: res.id,
        action: 'اتمام وظیفه و خاتمه مستقیم مصوبه',
        actorName: res.mainResponsibleName || 'مسئول اجرا',
        actorRole: 'مجری مصوبه',
        timestampJalali: '۱۴۰۳/۰۶/۲۸',
        timeString: '۱۵:۴۰',
        details: 'به دلیل عدم نیاز به صحه‌گذاری، مصوبه مستقیماً به وضعیت خاتمه یافته تغییر یافت.',
        badgeColor: 'teal',
      });
    }

    // Also update corresponding task status
    const task = mockTasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = requiresVerif ? 'PENDING_APPROVAL' : 'CLOSED';
      task.completionNotes = completionNotes;
      task.completionDateJalali = '۱۴۰۳/۰۶/۲۸';
    }

    return apiClient.simulateNetwork(res, 200);
  }

  /**
   * Approver approves the verification step
   */
  public async approveVerificationStep(resolutionId: string, stepNumber: number, comments: string, approverName: string): Promise<ApiResponse<Resolution>> {
    const res = this.resolutions.find((r) => r.id === resolutionId);
    if (!res) throw new Error('مصوبه یافت نشد');

    const stepIndex = res.verificationConfig.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex !== -1) {
      res.verificationConfig.steps[stepIndex].status = 'APPROVED';
      res.verificationConfig.steps[stepIndex].comments = comments;
      res.verificationConfig.steps[stepIndex].actionDateJalali = '۱۴۰۳/۰۶/۲۸';
      res.verificationConfig.steps[stepIndex].actionTime = '۱۶:۲۰';
    }

    const nextStepIndex = stepIndex + 1;
    const isAllApproved = nextStepIndex >= res.verificationConfig.steps.length;

    if (isAllApproved) {
      res.executionStatus = 'APPROVED_CLOSED';
      this.activityLogs.unshift({
        id: `log-${Date.now()}`,
        targetType: 'RESOLUTION',
        targetId: res.id,
        action: 'تایید نهایی صحه‌گذاری و مختومه شدن مصوبه',
        actorName: approverName,
        actorRole: 'تاییدکننده نهایی',
        timestampJalali: '۱۴۰۳/۰۶/۲۸',
        timeString: '۱۶:۲۰',
        details: `مرحله ${stepNumber} با نظر: "${comments}" تایید شد و مصوبه رسماً خاتمه یافت.`,
        badgeColor: 'teal',
      });
    } else {
      res.verificationConfig.currentStepIndex = nextStepIndex;
      const nextStep = res.verificationConfig.steps[nextStepIndex];
      this.activityLogs.unshift({
        id: `log-${Date.now()}`,
        targetType: 'RESOLUTION',
        targetId: res.id,
        action: `تایید مرحله ${stepNumber} صحه‌گذاری`,
        actorName: approverName,
        actorRole: 'تاییدکننده',
        timestampJalali: '۱۴۰۳/۰۶/۲۸',
        timeString: '۱۶:۲۰',
        details: `تایید شد و جهت مرحله بعدی به کارتابل ${nextStep.approverName} ارجاع شد.`,
        badgeColor: 'blue',
      });
    }

    // Update task
    const task = mockTasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = isAllApproved ? 'CLOSED' : 'PENDING_APPROVAL';
    }

    return apiClient.simulateNetwork(res, 200);
  }

  /**
   * Approver rejects the verification step -> status returns to responsible user for rework
   */
  public async rejectVerificationStep(resolutionId: string, stepNumber: number, rejectionReason: string, approverName: string): Promise<ApiResponse<Resolution>> {
    const res = this.resolutions.find((r) => r.id === resolutionId);
    if (!res) throw new Error('مصوبه یافت نشد');

    const stepIndex = res.verificationConfig.steps.findIndex((s) => s.stepNumber === stepNumber);
    if (stepIndex !== -1) {
      res.verificationConfig.steps[stepIndex].status = 'REJECTED';
      res.verificationConfig.steps[stepIndex].comments = rejectionReason;
      res.verificationConfig.steps[stepIndex].actionDateJalali = '۱۴۰۳/۰۶/۲۸';
    }

    res.executionStatus = 'REJECTED_RETURNED';

    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      targetType: 'RESOLUTION',
      targetId: res.id,
      action: 'عدم تایید در صحه‌گذاری و برگشت به مجری',
      actorName: approverName,
      actorRole: 'تاییدکننده',
      timestampJalali: '۱۴۰۳/۰۶/۲۸',
      timeString: '۱۶:۳۰',
      details: `علت بازگشت: ${rejectionReason}`,
      badgeColor: 'red',
    });

    const task = mockTasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = 'RETURNED';
      task.rejectionReason = rejectionReason;
    }

    return apiClient.simulateNetwork(res, 200);
  }
}

export const resolutionService: IResolutionService = new MockResolutionService();
