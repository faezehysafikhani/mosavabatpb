import { DashboardKPIs, DepartmentPerformance, ApiResponse } from '../types';
import { mockMeetings, mockResolutions, mockTasks, mockApprovals, mockDepartments, mockUsers } from '../mock/data';
import { apiClient } from './api/apiClient';
import { isMeetingRelatedToUser, isResolutionRelatedToUser } from './userScope';
import { loadLocalCollection } from './localStore';

export interface MonthlyMeetingTrend {
  month: string;
  meetingsCount: number;
  resolutionsCount: number;
  completedResolutionsCount: number;
}

export interface ResolutionStatusDistribution {
  statusKey: string;
  statusLabel: string;
  count: number;
  percentage: number;
  color: string;
}

export interface IReportService {
  getDashboardKPIs(currentUserId?: string): Promise<ApiResponse<DashboardKPIs>>;
  getDepartmentPerformances(): Promise<ApiResponse<DepartmentPerformance[]>>;
  getResolutionStatusDistribution(): Promise<ApiResponse<ResolutionStatusDistribution[]>>;
  getMonthlyTrends(): Promise<ApiResponse<MonthlyMeetingTrend[]>>;
}

class MockReportService implements IReportService {
  public async getDashboardKPIs(currentUserId?: string): Promise<ApiResponse<DashboardKPIs>> {
    const users = loadLocalCollection('users', mockUsers);
    const meetings = loadLocalCollection('meetings', mockMeetings);
    const resolutions = loadLocalCollection('resolutions', mockResolutions);
    const tasks = loadLocalCollection('tasks', mockTasks);
    const approvals = loadLocalCollection('approvals', mockApprovals);
    const currentUser = users.find((user) => user.id === currentUserId);
    const scopedMeetings = currentUserId
      ? meetings.filter((meeting) => isMeetingRelatedToUser(meeting, currentUserId))
      : meetings;
    const scopedResolutions = currentUser
      ? resolutions.filter((resolution) => isResolutionRelatedToUser(resolution, currentUser))
      : currentUserId ? [] : resolutions;

    const totalMeetings = scopedMeetings.length;
    const totalResolutions = scopedResolutions.length;
    const inProgressResolutions = scopedResolutions.filter((r) => r.executionStatus === 'IN_PROGRESS').length;
    const completedClosedResolutions = scopedResolutions.filter((r) => r.executionStatus === 'APPROVED_CLOSED').length;
    const pendingApprovalResolutions = scopedResolutions.filter((r) => r.executionStatus === 'PENDING_APPROVAL').length;
    const overdueResolutions = scopedResolutions.filter((r) => r.executionStatus === 'OVERDUE').length;

    const myPendingTasksCount = tasks.filter(
      (t) => (t.assignedToUserId === currentUserId || !currentUserId) && (t.status === 'IN_PROGRESS' || t.status === 'NEW' || t.status === 'OVERDUE')
    ).length;

    const myPendingApprovalsCount = approvals.filter(
      (a) => (a.assignedApproverId === currentUserId || !currentUserId) && a.status === 'PENDING'
    ).length;

    const kpis: DashboardKPIs = {
      totalMeetings,
      totalResolutions,
      inProgressResolutions,
      completedClosedResolutions,
      pendingApprovalResolutions,
      overdueResolutions,
      myPendingTasksCount,
      myPendingApprovalsCount,
    };

    return apiClient.simulateNetwork(kpis, 100);
  }

  public async getDepartmentPerformances(): Promise<ApiResponse<DepartmentPerformance[]>> {
    const resolutions = loadLocalCollection('resolutions', mockResolutions);
    const list: DepartmentPerformance[] = mockDepartments.map((dept) => {
      const deptResolutions = resolutions.filter((r) => r.responsibleDepartmentId === dept.id);
      const totalAssigned = deptResolutions.length;
      const completed = deptResolutions.filter((r) => r.executionStatus === 'APPROVED_CLOSED').length;
      const inProgress = deptResolutions.filter((r) => r.executionStatus === 'IN_PROGRESS').length;
      const pendingApproval = deptResolutions.filter((r) => r.executionStatus === 'PENDING_APPROVAL').length;
      const overdue = deptResolutions.filter((r) => r.executionStatus === 'OVERDUE').length;
      const completionRatePercent = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      return {
        departmentName: dept.name,
        totalAssigned,
        completed,
        inProgress,
        pendingApproval,
        overdue,
        completionRatePercent,
      };
    });

    return apiClient.simulateNetwork(list, 150);
  }

  public async getResolutionStatusDistribution(): Promise<ApiResponse<ResolutionStatusDistribution[]>> {
    const resolutions = loadLocalCollection('resolutions', mockResolutions);
    const total = resolutions.length || 1;
    const inProgress = resolutions.filter((r) => r.executionStatus === 'IN_PROGRESS').length;
    const closed = resolutions.filter((r) => r.executionStatus === 'APPROVED_CLOSED').length;
    const pendingVerif = resolutions.filter((r) => r.executionStatus === 'PENDING_APPROVAL').length;
    const overdue = resolutions.filter((r) => r.executionStatus === 'OVERDUE').length;
    const notStarted = resolutions.filter((r) => r.executionStatus === 'NOT_STARTED').length;

    const data: ResolutionStatusDistribution[] = [
      { statusKey: 'IN_PROGRESS', statusLabel: 'در حال انجام', count: inProgress, percentage: Math.round((inProgress / total) * 100), color: '#3b82f6' },
      { statusKey: 'APPROVED_CLOSED', statusLabel: 'خاتمه یافته و تایید شده', count: closed, percentage: Math.round((closed / total) * 100), color: '#10b981' },
      { statusKey: 'PENDING_APPROVAL', statusLabel: 'در انتظار صحه‌گذاری', count: pendingVerif, percentage: Math.round((pendingVerif / total) * 100), color: '#a855f7' },
      { statusKey: 'OVERDUE', statusLabel: 'عقب‌افتاده از موعد', count: overdue, percentage: Math.round((overdue / total) * 100), color: '#ef4444' },
      { statusKey: 'NOT_STARTED', statusLabel: 'برنامه‌ریزی / شروع نشده', count: notStarted, percentage: Math.round((notStarted / total) * 100), color: '#f59e0b' },
    ];

    return apiClient.simulateNetwork(data, 100);
  }

  public async getMonthlyTrends(): Promise<ApiResponse<MonthlyMeetingTrend[]>> {
    const trends: MonthlyMeetingTrend[] = [
      { month: 'فروردین', meetingsCount: 4, resolutionsCount: 10, completedResolutionsCount: 9 },
      { month: 'اردیبهشت', meetingsCount: 6, resolutionsCount: 15, completedResolutionsCount: 13 },
      { month: 'خرداد', meetingsCount: 5, resolutionsCount: 12, completedResolutionsCount: 11 },
      { month: 'تیر', meetingsCount: 7, resolutionsCount: 18, completedResolutionsCount: 15 },
      { month: 'مرداد', meetingsCount: 6, resolutionsCount: 16, completedResolutionsCount: 12 },
      { month: 'شهریور', meetingsCount: 8, resolutionsCount: 22, completedResolutionsCount: 14 },
    ];

    return apiClient.simulateNetwork(trends, 120);
  }
}

export const reportService: IReportService = new MockReportService();
