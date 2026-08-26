import { Task, ApiResponse, ApiFilterParams, PagedResult } from '../types';
import { mockTasks } from '../mock/data';
import { apiClient } from './api/apiClient';
import { resolutionService } from './resolutionService';

export interface ITaskService {
  getMyTasks(userId?: string, params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Task>>>;
  getTaskById(id: string): Promise<ApiResponse<Task | null>>;
  submitTaskCompletion(taskId: string, completionNotes: string, attachments?: Task['attachments']): Promise<ApiResponse<Task>>;
  updateTaskStatus(taskId: string, status: Task['status']): Promise<ApiResponse<Task>>;
}

class MockTaskService implements ITaskService {
  private tasks: Task[] = [...mockTasks];

  public async getMyTasks(userId?: string, params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Task>>> {
    let filtered = [...this.tasks];

    // A personal cartable always contains only tasks assigned to the active user.
    if (userId) {
      filtered = filtered.filter((t) => t.assignedToUserId === userId);
    }

    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.resolutionTitle.toLowerCase().includes(term) ||
          t.resolutionNumber.toLowerCase().includes(term) ||
          t.meetingTitle.toLowerCase().includes(term) ||
          t.assignedToName.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((t) => t.status === params.status);
    }

    if (params?.priority && params.priority !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === params.priority);
    }

    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return apiClient.simulateNetwork<PagedResult<Task>>({
      items,
      totalCount,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }, 120);
  }

  public async getTaskById(id: string): Promise<ApiResponse<Task | null>> {
    const task = this.tasks.find((t) => t.id === id) || null;
    return apiClient.simulateNetwork(task, 100);
  }

  public async submitTaskCompletion(taskId: string, completionNotes: string, attachments?: Task['attachments']): Promise<ApiResponse<Task>> {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('وظیفه یافت نشد');

    const task = this.tasks[taskIndex];
    task.completionNotes = completionNotes;
    task.completionDateJalali = '۱۴۰۳/۰۶/۲۸';
    if (attachments) {
      task.attachments = [...task.attachments, ...attachments];
    }

    // Call resolution service to advance workflow and determine whether it enters verification or closes directly
    await resolutionService.completeResolutionTask(task.resolutionId, completionNotes, attachments);

    // Refresh task status based on whether verification was required
    task.status = task.requiresVerification ? 'PENDING_APPROVAL' : 'CLOSED';

    return apiClient.simulateNetwork(task, 200);
  }

  public async updateTaskStatus(taskId: string, status: Task['status']): Promise<ApiResponse<Task>> {
    const taskIndex = this.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('وظیفه یافت نشد');

    this.tasks[taskIndex].status = status;
    return apiClient.simulateNetwork(this.tasks[taskIndex], 120);
  }
}

export const taskService: ITaskService = new MockTaskService();
