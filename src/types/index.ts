/**
 * Domain Models & DTO Interfaces
 * Designed for 1-to-1 mapping with ASP.NET Core (.NET 8) Web API DTOs
 */

export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  message?: string;
  statusCode: number;
  errors?: string[];
}

export interface ApiFilterParams {
  pageNumber?: number;
  pageIndex?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
  fromDateJalali?: string;
  toDateJalali?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber?: number;
  pageIndex?: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

export type UserRole = 
  | 'ADMIN'              // مدیر ارشد سیستم
  | 'CEO'                // مدیرعامل / ریاست سازمان
  | 'SECRETARY'          // دبیر جلسات
  | 'DEPT_MANAGER'       // مدیر واحد سازمانی / تأییدکننده
  | 'EXPERT_ASSIGNEE'    // کارشناس مسئول اجرا
  | 'AUDITOR';           // بازرس و ناظر سازمانی

export type PermissionKey =
  | 'VIEW_DASHBOARD'
  | 'VIEW_MEETINGS'
  | 'CREATE_MEETING'
  | 'EDIT_MEETING'
  | 'DELETE_MEETING'
  | 'CREATE_RESOLUTION'
  | 'VIEW_RESOLUTIONS'
  | 'EDIT_RESOLUTION'
  | 'VIEW_TASKS'
  | 'VIEW_APPROVALS'
  | 'APPROVE_RESOLUTION'
  | 'REJECT_RESOLUTION'
  | 'VIEW_REPORTS'
  | 'MANAGE_USERS'
  | 'CREATE_USER';

export interface User {
  id: string;
  nationalCode: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  title: string;          // سمت سازمانی
  email: string;
  phone: string;
  internalPhone?: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  isActive: boolean;
  permissions: string[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string;
  managerName: string;
  parentDepartmentId?: string;
  organizationId: string;
  memberCount: number;
}

export interface Organization {
  id: string;
  name: string;
  type: 'INTERNAL' | 'SUBSIDIARY' | 'EXTERNAL_CONTRACTOR' | 'MINISTRY';
  contactPerson?: string;
  phone?: string;
}

// Pre-meeting strategic-request workflow: the office manager (secretary)
// registers a topic -> CEO approves or rejects it -> a rejected item can be
// recovered back for reconsideration -> an approved item returns to the
// office manager's cartable, where it becomes pickable as a ready-made
// agenda item while creating a new meeting (see CreateMeetingModal), after
// which the existing Meeting -> Resolution workflow takes over unchanged.
export type ProposalStatus =
  | 'PENDING_CEO_REVIEW'   // در انتظار بررسی مدیرعامل
  | 'REJECTED'             // رد شده (قابل بازیافت)
  | 'APPROVED'             // تایید شده توسط مدیرعامل، آماده افزودن به دستور یک جلسه
  | 'CONVERTED_TO_AGENDA'; // تبدیل شده به بند دستور یک جلسه

export interface Proposal {
  id: string;
  title: string;
  proposerName: string;
  proposerDepartmentId: string;
  proposerDepartmentName: string;
  description: string;
  notes?: string;
  dateJalali: string;
  attachments: Attachment[];
  status: ProposalStatus;
  managementDecisionNotes?: string;
  assignedMeetingId?: string;
  assignedMeetingTitle?: string;
  createdAt: string;
}

export type MeetingStatus =
  | 'DRAFT'           // پیش‌نویس
  | 'SCHEDULED'       // برنامه‌ریزی شده
  | 'IN_PROGRESS'     // در حال برگزاری
  | 'HELD'            // برگزار شده و نهایی
  | 'CANCELLED';      // لغو شده

export type MeetingType = 
  | 'BOARD_OF_DIRECTORS'    // هیئت مدیره
  | 'MANAGEMENT_COUNCIL'    // شورای مدیران
  | 'TECHNICAL_COMMITTEE'   // کمیته تخصصی و فنی
  | 'PROJECT_STEERING'      // کارگروه راهبری پروژه
  | 'CRISIS_MANAGEMENT'     // کمیته بحران و حوادث
  | 'EXTRAORDINARY';        // جلسه فوق‌العاده

export interface MeetingMember {
  userId: string;
  fullName: string;
  roleTitle: string;
  departmentName: string;
  attendanceType: 'ORGANIZER' | 'SECRETARY' | 'MEMBER' | 'GUEST';
  presenceStatus?: 'PRESENT' | 'ABSENT' | 'DELEGATED';
}

export interface AgendaItem {
  id: string;
  order: number;
  rowNumber?: number;
  title: string;
  presenter: string;
  presenterName?: string;
  estimatedMinutes?: number;
  allocatedMinutes?: number;
  status?: string;
  description?: string;
  proposedResolutionDraft?: string;
  isDiscussed: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  fileExtension: string;
  uploadDate: string; // Persian or ISO
  uploadedBy: string;
  downloadUrl: string;
}

export interface Meeting {
  id: string;
  meetingNumber: string;        // e.g. "جلسه-۱۴۰۳-۱۴۲"
  title: string;
  type: MeetingType;
  dateJalali: string;          // e.g. "۱۴۰۳/۰۶/۱۵"
  startTime: string;           // e.g. "۰۹:۳۰"
  endTime: string;             // e.g. "۱۱:۳۰"
  location: string;            // e.g. "سالن جلسات طبقه پنجم"
  organizerId: string;
  organizerName: string;
  secretaryId: string;
  secretaryName: string;
  departmentId: string;
  departmentName: string;
  status: MeetingStatus;
  description?: string;
  minutesSummary?: string;     // صورتجلسه خلاصه
  members: MeetingMember[];
  agendaItems: AgendaItem[];
  resolutionsCount: number;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

// Resolution Approval Status at the meeting table
export type ResolutionApprovalStatus = 
  | 'NOT_APPROVED'      // تصویب نشده
  | 'APPROVED'          // مصوب
  | 'REJECTED'          // رد شده
  | 'NEEDS_REVIEW'      // نیازمند بررسی تکمیلی
  | 'CONDITIONAL_APPROVED'
  | 'REFERRED_FOR_REVIEW';

// Resolution Overall Workflow/Execution Status
export type ResolutionExecutionStatus = 
  | 'NOT_STARTED'       // شروع نشده
  | 'IN_PROGRESS'       // در حال انجام
  | 'DONE_BY_ASSIGNEE'  // انجام شده توسط مسئول
  | 'PENDING_APPROVAL'  // در انتظار صحه‌گذاری
  | 'APPROVED_CLOSED'   // تایید نهایی و خاتمه‌یافته
  | 'REJECTED_RETURNED' // رد شده در صحه‌گذاری و بازگشت داده شده
  | 'OVERDUE';          // عقب‌افتاده از موعد مقرر

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';

export interface ResolutionReferral {
  id: string;
  targetType: 'USER' | 'DEPARTMENT' | 'EXTERNAL_ORG';
  targetId: string;
  targetName: string;
  assignedRole: 'MAIN_RESPONSIBLE' | 'COOPERATOR' | 'INFORMATIONAL';
  assignedDateJalali: string;
  deadlineJalali: string;
  instructions?: string;
}

export interface VerificationStep {
  stepNumber: number;
  approverType?: 'USER' | 'DEPARTMENT' | 'ORGANIZATION';
  approverId: string;
  approverName: string;
  approverRole?: string;
  approverRoleTitle?: string;
  status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  actionDateJalali?: string;
  actionTime?: string;
  comments?: string;
}

export interface VerificationConfig {
  requiresVerification: boolean; // آیا نیاز به صحه‌گذاری پس از انجام دارد؟
  mode: 'SEQUENTIAL' | 'PARALLEL'; // ترتیبی یا موازی
  currentStepIndex: number;
  steps: VerificationStep[];
}

export interface Resolution {
  id: string;
  resolutionNumber: string;    // e.g. "مصوبه-۱۴۰۳-۹۸"
  meetingId: string;
  meetingTitle: string;
  meetingNumber: string;
  agendaItemId?: string;       // شناسه بند دستور جلسه مرجع
  agendaItemTitle?: string;    // عنوان موضوع دستور جلسه مرجع
  topicTitle: string;          // عنوان موضوع
  proposerName: string;        // پیشنهاددهنده
  proposerDepartment: string;  // سازمان / واحد پیشنهاددهنده
  requestDescription: string;  // شرح درخواست
  reviewResultNotes?: string;  // نتیجه بررسی در جلسه
  approvalStatus: ResolutionApprovalStatus;
  
  // Execution details (active when approved)
  executionDescription?: string;
  mainResponsibleUserId?: string;
  mainResponsibleName?: string;
  responsibleDepartmentId?: string;
  responsibleDepartmentName?: string;
  assignedDateJalali?: string;
  deadlineJalali?: string;
  priority: PriorityLevel;
  executionStatus: ResolutionExecutionStatus;
  
  // Multiple referrals
  referrals: ResolutionReferral[];
  
  // Verification configuration
  verificationConfig: VerificationConfig;
  
  // Attachments & Logs
  attachments: Attachment[];
  completionNotes?: string;
  completionDateJalali?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  resolutionId: string;
  resolutionNumber: string;
  resolutionTitle: string;
  meetingId: string;
  meetingTitle: string;
  assignedToUserId: string;
  assignedToName: string;
  departmentId: string;
  departmentName: string;
  referralDateJalali: string;
  deadlineJalali: string;
  priority: PriorityLevel;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'PENDING_APPROVAL' | 'CLOSED' | 'RETURNED' | 'OVERDUE';
  requiresVerification: boolean;
  verificationCurrentStepTitle?: string;
  instructions: string;
  completionNotes?: string;
  completionDateJalali?: string;
  rejectionReason?: string;
  attachments: Attachment[];
}

export interface ApprovalCartableItem {
  id: string;
  resolutionId: string;
  resolutionNumber: string;
  resolutionTitle: string;
  meetingTitle: string;
  responsibleName: string;
  responsibleDepartment: string;
  completedDateJalali: string;
  submittedForApprovalDateJalali: string;
  stepNumber: number;
  totalSteps: number;
  stepTitle: string;
  assignedApproverId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  completionReport: string;
  attachments: Attachment[];
}

export interface ActivityLog {
  id: string;
  targetType: 'MEETING' | 'RESOLUTION' | 'TASK' | 'APPROVAL';
  targetId: string;
  action: string;
  actorName: string;
  actorRole: string;
  timestampJalali: string;
  timeString: string;
  details?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  dateJalali: string;
  timeString: string;
  isRead: boolean;
  type: 'ASSIGNMENT' | 'DEADLINE' | 'APPROVAL_REQUEST' | 'APPROVED' | 'REJECTED' | 'MEETING';
  targetRoute?: string;
  targetResolutionId?: string;
}

export interface DashboardKPIs {
  totalMeetings: number;
  totalResolutions: number;
  inProgressResolutions: number;
  completedClosedResolutions: number;
  pendingApprovalResolutions: number;
  overdueResolutions: number;
  myPendingTasksCount: number;
  myPendingApprovalsCount: number;
}

export interface DepartmentPerformance {
  departmentName: string;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  pendingApproval: number;
  overdue: number;
  completionRatePercent: number;
}
