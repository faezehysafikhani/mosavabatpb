import { Meeting, MeetingStatus, ApiResponse, ApiFilterParams, PagedResult } from '../types';
import { mockMeetings, mockResolutions } from '../mock/data';
import { apiClient } from './api/apiClient';

export interface CreateMeetingDto {
  title: string;
  type: Meeting['type'];
  dateJalali: string;
  startTime: string;
  endTime: string;
  location: string;
  organizerId: string;
  secretaryId: string;
  departmentId: string;
  description?: string;
  members: Meeting['members'];
  agendaItems: Meeting['agendaItems'];
  attachments: Meeting['attachments'];
}

export interface IMeetingService {
  getMeetings(params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Meeting>>>;
  getMeetingById(id: string): Promise<ApiResponse<Meeting | null>>;
  createMeeting(dto: CreateMeetingDto): Promise<ApiResponse<Meeting>>;
  updateMeeting(id: string, dto: Partial<Meeting>): Promise<ApiResponse<Meeting>>;
  deleteMeeting(id: string): Promise<ApiResponse<boolean>>;
  updateMeetingStatus(id: string, status: MeetingStatus): Promise<ApiResponse<Meeting>>;
}

class MockMeetingService implements IMeetingService {
  private meetings: Meeting[] = [...mockMeetings];

  public async getMeetings(params?: ApiFilterParams): Promise<ApiResponse<PagedResult<Meeting>>> {
    let filtered = [...this.meetings];

    if (params?.searchTerm) {
      const term = params.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.meetingNumber.toLowerCase().includes(term) ||
          m.location.toLowerCase().includes(term) ||
          m.organizerName.toLowerCase().includes(term)
      );
    }

    if (params?.status && params.status !== 'ALL') {
      filtered = filtered.filter((m) => m.status === params.status);
    }

    if (params?.departmentId && params.departmentId !== 'ALL') {
      filtered = filtered.filter((m) => m.departmentId === params.departmentId);
    }

    // Refresh resolution count dynamically from mock resolutions
    filtered.forEach((m) => {
      m.resolutionsCount = mockResolutions.filter((r) => r.meetingId === m.id).length;
    });

    // Sort by date descending
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const pageIndex = params?.pageIndex || 1;
    const pageSize = params?.pageSize || 10;
    const totalCount = filtered.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const items = filtered.slice(startIndex, startIndex + pageSize);

    return apiClient.simulateNetwork<PagedResult<Meeting>>({
      items,
      totalCount,
      pageIndex,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }, 150);
  }

  public async getMeetingById(id: string): Promise<ApiResponse<Meeting | null>> {
    const meeting = this.meetings.find((m) => m.id === id) || null;
    if (meeting) {
      meeting.resolutionsCount = mockResolutions.filter((r) => r.meetingId === meeting.id).length;
    }
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async createMeeting(dto: CreateMeetingDto): Promise<ApiResponse<Meeting>> {
    const nextNumber = this.meetings.length + 142;
    const newMeeting: Meeting = {
      id: `meet-${Date.now()}`,
      meetingNumber: `جلسه-۱۴۰۳-${nextNumber}`,
      title: dto.title,
      type: dto.type,
      dateJalali: dto.dateJalali,
      startTime: dto.startTime,
      endTime: dto.endTime,
      location: dto.location,
      organizerId: dto.organizerId,
      organizerName: dto.members.find((m) => m.userId === dto.organizerId)?.fullName || 'برگزارکننده',
      secretaryId: dto.secretaryId,
      secretaryName: dto.members.find((m) => m.userId === dto.secretaryId)?.fullName || 'دبیر جلسه',
      departmentId: dto.departmentId,
      departmentName: 'معاونت برنامه‌ریزی و فناوری',
      status: 'SCHEDULED',
      description: dto.description || '',
      members: dto.members,
      agendaItems: dto.agendaItems || [],
      resolutionsCount: 0,
      attachments: dto.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.meetings.unshift(newMeeting);
    return apiClient.simulateNetwork(newMeeting, 200);
  }

  public async updateMeeting(id: string, dto: Partial<Meeting>): Promise<ApiResponse<Meeting>> {
    const index = this.meetings.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('جلسه یافت نشد');
    }
    this.meetings[index] = { ...this.meetings[index], ...dto, updatedAt: new Date().toISOString() };
    return apiClient.simulateNetwork(this.meetings[index], 150);
  }

  public async deleteMeeting(id: string): Promise<ApiResponse<boolean>> {
    const initialLen = this.meetings.length;
    this.meetings = this.meetings.filter((m) => m.id !== id);
    return apiClient.simulateNetwork(this.meetings.length < initialLen, 150);
  }

  public async updateMeetingStatus(id: string, status: MeetingStatus): Promise<ApiResponse<Meeting>> {
    return this.updateMeeting(id, { status });
  }
}

export const meetingService: IMeetingService = new MockMeetingService();
