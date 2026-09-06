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
import type { ResolutionProgressReport } from '../types';
import { mockResolutions, mockActivityLogs, mockTasks, mockApprovals } from '../mock/data';
import { apiClient } from './api/apiClient';
import { mockUsers } from '../mock/data';
import { isResolutionRelatedToUser } from './userScope';
import { loadLocalCollection, saveLocalCollection } from './localStore';

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
  letterNumber?: string;
}

export interface IResolutionService {
  getResolutions(params?: ApiFilterParams & { approvalStatus?: string; executionStatus?: string; meetingId?: string; relatedUserId?: string }): Promise<ApiResponse<PagedResult<Resolution>>>;
  getResolutionById(id: string): Promise<ApiResponse<Resolution | null>>;
  createResolution(dto: CreateResolutionDto): Promise<ApiResponse<Resolution>>;
  updateResolution(id: string, dto: Partial<Resolution>): Promise<ApiResponse<Resolution>>;
  deleteResolution(id: string): Promise<ApiResponse<boolean>>;
  getResolutionActivityLogs(resolutionId: string): Promise<ApiResponse<ActivityLog[]>>;
  completeResolutionTask(resolutionId: string, completionNotes: string, attachments?: Resolution['attachments']): Promise<ApiResponse<Resolution>>;
  approveVerificationStep(resolutionId: string, stepNumber: number, comments: string, approverName: string): Promise<ApiResponse<Resolution>>;
  rejectVerificationStep(resolutionId: string, stepNumber: number, rejectionReason: string, approverName: string): Promise<ApiResponse<Resolution>>;
  signResolution(resolutionId: string, signerUserId: string): Promise<ApiResponse<Resolution>>;
  updateExecutionProgress(resolutionId: string, report: ResolutionProgressReport): Promise<ApiResponse<Resolution>>;
}

class MockResolutionService implements IResolutionService {
  private resolutions: Resolution[] = loadLocalCollection('resolutions', mockResolutions);
  private activityLogs: ActivityLog[] = loadLocalCollection('activityLogs', mockActivityLogs);

  private persist() {
    saveLocalCollection('resolutions', this.resolutions);
    saveLocalCollection('activityLogs', this.activityLogs);
  }

  private createSignatureWorkflow() {
    const users = loadLocalCollection('users', mockUsers);
    const officeManager = users.find((user) => user.username === 'office-manager') || users.find((user) => user.role === 'SECRETARY');
    const ceo = users.find((user) => user.username === 'ceo') || users.find((user) => user.role === 'CEO');
    const admin = users.find((user) => user.id === 'user-admin') || users.find((user) => user.role === 'ADMIN');
    if (!officeManager || !ceo || !admin) throw new Error('امضاکنندگان موردنیاز در فهرست کاربران تعریف نشده‌اند');
    return {
      status: 'PENDING_OFFICE_SIGNATURE' as const,
      currentStepIndex: 0,
      steps: [
        { id: `sig-${Date.now()}-1`, signerUserId: officeManager.id, signerName: officeManager.fullName, signerTitle: officeManager.title, signerRole: 'OFFICE_MANAGER' as const, order: 1 as const, status: 'PENDING' as const },
        { id: `sig-${Date.now()}-2`, signerUserId: ceo.id, signerName: ceo.fullName, signerTitle: ceo.title, signerRole: 'CEO' as const, order: 2 as const, status: 'WAITING_TURN' as const },
        { id: `sig-${Date.now()}-3`, signerUserId: admin.id, signerName: admin.fullName, signerTitle: admin.title, signerRole: 'ADMIN' as const, order: 3 as const, status: 'WAITING_TURN' as const },
      ],
    };
  }

  private startExecution(resolution: Resolution) {
    resolution.executionStatus = 'IN_PROGRESS';
    if (!resolution.mainResponsibleUserId) return;
    const tasks = loadLocalCollection('tasks', mockTasks);
    if (tasks.some((task) => task.resolutionId === resolution.id)) return;
    tasks.unshift({
      id: `task-${Date.now()}`,
      resolutionId: resolution.id,
      resolutionNumber: resolution.resolutionNumber,
      resolutionTitle: resolution.topicTitle,
      meetingId: resolution.meetingId,
      meetingTitle: resolution.meetingTitle,
      assignedToUserId: resolution.mainResponsibleUserId,
      assignedToName: resolution.mainResponsibleName || 'مسئول اجرا',
      departmentId: resolution.responsibleDepartmentId || 'dept-1',
      departmentName: resolution.responsibleDepartmentName || 'واحد مسئول',
      referralDateJalali: resolution.assignedDateJalali || '—',
      deadlineJalali: resolution.deadlineJalali || '—',
      priority: resolution.priority,
      status: 'IN_PROGRESS',
      requiresVerification: resolution.verificationConfig.requiresVerification,
      instructions: resolution.executionDescription || resolution.requestDescription,
      attachments: resolution.attachments,
    });
    saveLocalCollection('tasks', tasks);
  }

  public async getResolutions(params?: ApiFilterParams & { approvalStatus?: string; executionStatus?: string; meetingId?: string; requiresVerification?: boolean; relatedUserId?: string }): Promise<ApiResponse<PagedResult<Resolution>>> {
    let filtered = [...this.resolutions];

    if (params?.relatedUserId) {
      const users = loadLocalCollection('users', mockUsers);
      const relatedUser = users.find((user) => user.id === params.relatedUserId);
      filtered = relatedUser ? filtered.filter((resolution) => isResolutionRelatedToUser(resolution, relatedUser)) : [];
    }

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
    const meetingResolutionNumber = this.resolutions.filter((resolution) => resolution.meetingId === dto.meetingId).length + 1;

    const newResolution: Resolution = {
      id: `res-${Date.now()}`,
      resolutionNumber: `مصوبه-۱۴۰۳-${nextNum}`,
      meetingResolutionNumber: String(meetingResolutionNumber),
      letterNumber: dto.letterNumber,
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
      executionStatus: isApproved ? 'PENDING_OFFICE_SIGNATURE' : 'NOT_STARTED',
      referrals: dto.referrals || [],
      verificationConfig: dto.verificationConfig || {
        requiresVerification: false,
        mode: 'SEQUENTIAL',
        currentStepIndex: 0,
        steps: [],
      },
      signatureWorkflow: isApproved ? this.createSignatureWorkflow() : undefined,
      attachments: dto.attachments || [],
      createdAt: new Date().toISOString(),
    };

    this.resolutions.unshift(newResolution);

    // Add activity logs to the existing resolution timeline.
    const createdAt = Date.now();
    this.activityLogs.unshift({
      id: `log-${createdAt}`,
      targetType: 'RESOLUTION',
      targetId: newResolution.id,
      action: isApproved ? 'مصوبه تصویب شد' : 'ثبت نتیجه بررسی جلسه',
      actorName: 'دبیر شورای راهبری',
      actorRole: 'دبیرخانه جلسات',
      timestampJalali: '۱۴۰۳/۰۶/۲۸',
      timeString: '۱۱:۳۰',
      details: isApproved ? 'نتیجه بررسی جلسه به‌عنوان مصوبه ثبت شد.' : `وضعیت بررسی: ${dto.approvalStatus}`,
      badgeColor: isApproved ? 'teal' : 'amber',
    });
    if (isApproved) {
      this.activityLogs.unshift({
        id: `log-${createdAt}-minutes`,
        targetType: 'RESOLUTION',
        targetId: newResolution.id,
        action: 'صورت‌جلسه مصوبه ایجاد شد',
        actorName: 'دبیر شورای راهبری',
        actorRole: 'دبیرخانه جلسات',
        timestampJalali: '۱۴۰۳/۰۶/۲۸',
        timeString: '۱۱:۳۰',
        details: 'صورت‌جلسه رسمی برای امضای ترتیبی مسئول دفتر، مدیرعامل و ادمین ایجاد گردید.',
        badgeColor: 'blue',
      });
    }

    this.persist();

    return apiClient.simulateNetwork(newResolution, 200);
  }

  public async signResolution(resolutionId: string, signerUserId: string): Promise<ApiResponse<Resolution>> {
    const resolution = this.resolutions.find((item) => item.id === resolutionId);
    if (!resolution?.signatureWorkflow) throw new Error('صورت‌جلسه امضای مصوبه یافت نشد');
    if (resolution.signatureWorkflow.status === 'COMPLETED') throw new Error('تمام امضاهای این مصوبه قبلاً تکمیل شده است');

    const currentIndex = resolution.signatureWorkflow.currentStepIndex;
    const currentStep = resolution.signatureWorkflow.steps[currentIndex];
    if (!currentStep || currentStep.status !== 'PENDING') throw new Error('مرحله فعالی برای امضا وجود ندارد');
    if (currentStep.signerUserId !== signerUserId) throw new Error('نوبت امضای این کاربر نیست');

    const now = new Date();
    currentStep.status = 'SIGNED';
    currentStep.signedAt = now.toISOString();
    currentStep.signedDateJalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/[\u200e\u200f]/g, '');
    currentStep.signedTimeString = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      targetType: 'RESOLUTION',
      targetId: resolution.id,
      action: `${currentStep.signerTitle} صورت‌جلسه مصوبه را امضا کرد`,
      actorName: currentStep.signerName,
      actorRole: currentStep.signerTitle,
      timestampJalali: currentStep.signedDateJalali,
      timeString: currentStep.signedTimeString,
      details: `امضای دیجیتال Mock مرحله ${currentStep.order} با شناسه کاربر ${currentStep.signerUserId} ثبت شد.`,
      badgeColor: 'teal',
    });

    const nextStep = resolution.signatureWorkflow.steps[currentIndex + 1];
    if (nextStep) {
      nextStep.status = 'PENDING';
      resolution.signatureWorkflow.currentStepIndex = currentIndex + 1;
      resolution.signatureWorkflow.status = nextStep.signerRole === 'CEO' ? 'PENDING_CEO_SIGNATURE' : 'PENDING_ADMIN_SIGNATURE';
      resolution.executionStatus = resolution.signatureWorkflow.status;
    } else {
      resolution.signatureWorkflow.status = 'COMPLETED';
      this.startExecution(resolution);
      this.activityLogs.unshift({
        id: `log-${Date.now()}-execution`,
        targetType: 'RESOLUTION',
        targetId: resolution.id,
        action: 'تکمیل امضاها و آغاز فرآیند اجرای مصوبه',
        actorName: currentStep.signerName,
        actorRole: currentStep.signerTitle,
        timestampJalali: currentStep.signedDateJalali,
        timeString: currentStep.signedTimeString,
        details: `هر سه امضا تکمیل شد و مصوبه به ${resolution.mainResponsibleName || 'مسئول اجرا'} ارجاع گردید.`,
        badgeColor: 'blue',
      });
    }

    this.persist();
    return apiClient.simulateNetwork(resolution, 160);
  }

  public async updateResolution(id: string, dto: Partial<Resolution>): Promise<ApiResponse<Resolution>> {
    const index = this.resolutions.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('مصوبه یافت نشد');
    }
    this.resolutions[index] = { ...this.resolutions[index], ...dto };
    this.persist();
    return apiClient.simulateNetwork(this.resolutions[index], 150);
  }

  public async updateExecutionProgress(resolutionId: string, report: ResolutionProgressReport): Promise<ApiResponse<Resolution>> {
    const resolution = this.resolutions.find((item) => item.id === resolutionId);
    if (!resolution) throw new Error('مصوبه یافت نشد');
    if (resolution.signatureWorkflow && resolution.signatureWorkflow.status !== 'COMPLETED') throw new Error('ثبت پیشرفت پیش از تکمیل امضاهای مصوبه مجاز نیست');
    if (['APPROVED_CLOSED', 'PENDING_APPROVAL'].includes(resolution.executionStatus)) throw new Error('برای مصوبه خاتمه‌یافته یا در حال صحه‌گذاری نمی‌توان گزارش پیشرفت ثبت کرد');
    resolution.executionStartDateJalali = resolution.executionStartDateJalali || report.reportDateJalali;
    resolution.progressPercent = report.progressPercent;
    resolution.lastAction = report.actionDescription;
    resolution.obstacles = report.obstacles;
    resolution.progressReports = [...(resolution.progressReports || []), report];
    resolution.executionStatus = report.status;
    if (report.attachments.length > 0) resolution.attachments = [...resolution.attachments, ...report.attachments];
    this.activityLogs.unshift({
      id: `log-progress-${Date.now()}`,
      targetType: 'RESOLUTION',
      targetId: resolution.id,
      action: `ثبت گزارش پیشرفت ${report.progressPercent} درصدی`,
      actorName: report.reporterName,
      actorRole: 'مسئول اجرای مصوبه',
      timestampJalali: report.reportDateJalali,
      timeString: report.reportTimeString,
      details: `${report.actionDescription}${report.obstacles ? ` | موانع: ${report.obstacles}` : ''}`,
      badgeColor: report.status === 'OVERDUE' ? 'red' : report.status === 'NEEDS_FOLLOW_UP' ? 'amber' : 'blue',
    });
    this.persist();
    return apiClient.simulateNetwork(resolution, 140);
  }

  public async deleteResolution(id: string): Promise<ApiResponse<boolean>> {
    const initialLen = this.resolutions.length;
    this.resolutions = this.resolutions.filter((r) => r.id !== id);
    this.persist();
    return apiClient.simulateNetwork(this.resolutions.length < initialLen, 150);
  }

  public async getResolutionActivityLogs(resolutionId: string): Promise<ApiResponse<ActivityLog[]>> {
    const logs = this.activityLogs.filter((l) => l.targetId === resolutionId);
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
    if (res.signatureWorkflow && res.signatureWorkflow.status !== 'COMPLETED') {
      throw new Error('تا پیش از تکمیل هر سه امضا، فرآیند اجرای مصوبه قابل شروع یا تکمیل نیست');
    }
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
      const approvals = loadLocalCollection('approvals', mockApprovals);
      approvals.unshift({
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
        stepTitle: `صحه‌گذاری توسط ${firstStep.approverName}`,
        assignedApproverId: firstStep.approverId,
        status: 'PENDING',
        completionReport: completionNotes,
        attachments: res.attachments,
      });
      saveLocalCollection('approvals', approvals);

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
    const tasks = loadLocalCollection('tasks', mockTasks);
    const task = tasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = requiresVerif ? 'PENDING_APPROVAL' : 'CLOSED';
      task.completionNotes = completionNotes;
      task.completionDateJalali = '۱۴۰۳/۰۶/۲۸';
      saveLocalCollection('tasks', tasks);
    }

    this.persist();

    return apiClient.simulateNetwork(res, 200);
  }

  /**
   * Single approver approves the resolution's one verification step -> resolution closes immediately.
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
      details: `با نظر: "${comments}" تایید شد و مصوبه رسماً خاتمه یافت.`,
      badgeColor: 'teal',
    });

    const approvals = loadLocalCollection('approvals', mockApprovals);
    const currentApproval = approvals.find((item) => item.resolutionId === resolutionId && item.stepNumber === stepNumber);
    if (currentApproval) currentApproval.status = 'APPROVED';
    saveLocalCollection('approvals', approvals);

    // Update task
    const tasks = loadLocalCollection('tasks', mockTasks);
    const task = tasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = 'CLOSED';
      saveLocalCollection('tasks', tasks);
    }

    this.persist();

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

    const tasks = loadLocalCollection('tasks', mockTasks);
    const task = tasks.find((t) => t.resolutionId === resolutionId);
    if (task) {
      task.status = 'RETURNED';
      task.rejectionReason = rejectionReason;
      saveLocalCollection('tasks', tasks);
    }

    const approvals = loadLocalCollection('approvals', mockApprovals);
    const currentApproval = approvals.find((item) => item.resolutionId === resolutionId && item.stepNumber === stepNumber);
    if (currentApproval) currentApproval.status = 'REJECTED';
    saveLocalCollection('approvals', approvals);
    this.persist();

    return apiClient.simulateNetwork(res, 200);
  }
}

export const resolutionService: IResolutionService = new MockResolutionService();
