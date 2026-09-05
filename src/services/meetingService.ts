import { Meeting, MeetingStatus, ApiResponse, ApiFilterParams, PagedResult, User, MeetingGuest, AgendaItem } from '../types';
import { mockDepartments, mockMeetings, mockResolutions } from '../mock/data';
import { apiClient } from './api/apiClient';
import { loadLocalCollection, saveLocalCollection } from './localStore';
import { smsService } from './smsService';

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
  getMeetings(params?: ApiFilterParams & { participantUserId?: string }): Promise<ApiResponse<PagedResult<Meeting>>>;
  getMeetingById(id: string): Promise<ApiResponse<Meeting | null>>;
  createMeeting(dto: CreateMeetingDto): Promise<ApiResponse<Meeting>>;
  updateMeeting(id: string, dto: Partial<Meeting>): Promise<ApiResponse<Meeting>>;
  deleteMeeting(id: string): Promise<ApiResponse<boolean>>;
  updateMeetingStatus(id: string, status: MeetingStatus): Promise<ApiResponse<Meeting>>;
  reorderAgenda(id: string, agendaItemIds: string[], actor: User): Promise<ApiResponse<Meeting>>;
  removeAgendaItem(id: string, agendaItemId: string, reason: string, actor: User): Promise<ApiResponse<Meeting>>;
  reviewAgenda(id: string, decision: 'APPROVE' | 'RETURN', notes: string, actor: User): Promise<ApiResponse<Meeting>>;
  submitAgenda(id: string, actor: User): Promise<ApiResponse<Meeting>>;
  addGuest(id: string, guest: Omit<MeetingGuest, 'id' | 'invitationStatus'>, actor: User): Promise<ApiResponse<Meeting>>;
  sendInvitations(id: string, actor: User): Promise<ApiResponse<Meeting>>;
  markInvitationViewed(id: string, recipientId: string, actor: User): Promise<ApiResponse<Meeting>>;
  recordAgendaOutcome(id: string, agendaItemId: string, outcomeStatus: NonNullable<AgendaItem['outcomeStatus']>, notes: string, actor: User): Promise<ApiResponse<Meeting>>;
}

class MockMeetingService implements IMeetingService {
  private getMeetingsData = () => loadLocalCollection('meetings', mockMeetings);
  private saveMeetingsData = (meetings: Meeting[]) => saveLocalCollection('meetings', meetings);

  private addHistory(meeting: Meeting, actor: User, action: string, fromStatus: string, notes?: string) {
    const now = new Date();
    meeting.history = [...(meeting.history || []), {
      id: `meeting-history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      actorUserId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.title,
      fromStatus,
      toStatus: meeting.status,
      dateJalali: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/[\u200e\u200f]/g, ''),
      timeString: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      notes,
    }];
    meeting.updatedAt = now.toISOString();
  }

  public async getMeetings(params?: ApiFilterParams & { participantUserId?: string }): Promise<ApiResponse<PagedResult<Meeting>>> {
    let filtered = this.getMeetingsData();
    const resolutions = loadLocalCollection('resolutions', mockResolutions);

    if (params?.participantUserId) {
      filtered = filtered.filter((meeting) =>
        meeting.organizerId === params.participantUserId ||
        meeting.secretaryId === params.participantUserId ||
        meeting.members.some((member) => member.userId === params.participantUserId)
      );
    }

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
      m.resolutionsCount = resolutions.filter((r) => r.meetingId === m.id).length;
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
    const meeting = this.getMeetingsData().find((m) => m.id === id) || null;
    if (meeting) {
      const resolutions = loadLocalCollection('resolutions', mockResolutions);
      meeting.resolutionsCount = resolutions.filter((r) => r.meetingId === meeting.id).length;
    }
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async createMeeting(dto: CreateMeetingDto): Promise<ApiResponse<Meeting>> {
    const meetings = this.getMeetingsData();
    const nextNumber = meetings.length + 142;
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
      departmentName: mockDepartments.find((department) => department.id === dto.departmentId)?.name || 'واحد برگزارکننده',
      status: 'WAITING_FOR_CEO_APPROVAL',
      description: dto.description || '',
      members: dto.members,
      agendaItems: dto.agendaItems || [],
      guests: [],
      invitations: [],
      resolutionsCount: 0,
      attachments: dto.attachments || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
    };

    newMeeting.history = [{
      id: `meeting-history-${Date.now()}`,
      action: 'تهیه دستورکار و ارسال برای تأیید مدیرعامل',
      actorUserId: dto.secretaryId,
      actorName: newMeeting.secretaryName,
      actorRole: 'دبیر جلسه',
      toStatus: 'WAITING_FOR_CEO_APPROVAL',
      dateJalali: newMeeting.dateJalali,
      timeString: newMeeting.startTime,
    }];

    meetings.unshift(newMeeting);
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(newMeeting, 200);
  }

  public async updateMeeting(id: string, dto: Partial<Meeting>): Promise<ApiResponse<Meeting>> {
    const meetings = this.getMeetingsData();
    const index = meetings.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('جلسه یافت نشد');
    }
    meetings[index] = { ...meetings[index], ...dto, updatedAt: new Date().toISOString() };
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meetings[index], 150);
  }

  public async deleteMeeting(id: string): Promise<ApiResponse<boolean>> {
    const meetings = this.getMeetingsData();
    const next = meetings.filter((m) => m.id !== id);
    this.saveMeetingsData(next);
    return apiClient.simulateNetwork(next.length < meetings.length, 150);
  }

  public async updateMeetingStatus(id: string, status: MeetingStatus): Promise<ApiResponse<Meeting>> {
    return this.updateMeeting(id, { status });
  }

  public async reorderAgenda(id: string, agendaItemIds: string[], actor: User): Promise<ApiResponse<Meeting>> {
    if (!['CEO', 'SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('دسترسی تغییر ترتیب دستورکار را ندارید');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) throw new Error('جلسه یافت نشد');
    if (!['WAITING_FOR_CEO_APPROVAL', 'AGENDA_RETURNED'].includes(meeting.status)) throw new Error('پس از تأیید دستورکار امکان تغییر ترتیب وجود ندارد');
    if (agendaItemIds.length !== meeting.agendaItems.length || new Set(agendaItemIds).size !== agendaItemIds.length) throw new Error('فهرست ترتیب دستورکار نامعتبر است');
    const byId = new Map(meeting.agendaItems.map((item) => [item.id, item]));
    meeting.agendaItems = agendaItemIds.map((itemId, index) => ({ ...byId.get(itemId)!, order: index + 1, rowNumber: index + 1 }));
    this.addHistory(meeting, actor, 'تغییر ترتیب بندهای دستورکار', meeting.status);
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async removeAgendaItem(id: string, agendaItemId: string, reason: string, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['CEO', 'ADMIN'].includes(actor.role)) throw new Error('فقط مدیرعامل می‌تواند موضوع را از دستورکار خارج کند');
    if (!reason.trim()) throw new Error('دلیل حذف موضوع از این جلسه الزامی است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    const agenda = meeting?.agendaItems.find((item) => item.id === agendaItemId);
    if (!meeting || !agenda) throw new Error('جلسه یا بند دستورکار یافت نشد');
    if (meeting.status !== 'WAITING_FOR_CEO_APPROVAL') throw new Error('حذف موضوع فقط هنگام بررسی مدیرعامل امکان‌پذیر است');
    agenda.isRemoved = true;
    agenda.removalReason = reason.trim();
    agenda.status = 'REMOVED_BY_CEO';
    this.addHistory(meeting, actor, `خروج موضوع از دستورکار این جلسه: ${agenda.title}`, meeting.status, reason.trim());
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async reviewAgenda(id: string, decision: 'APPROVE' | 'RETURN', notes: string, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['CEO', 'ADMIN'].includes(actor.role)) throw new Error('فقط مدیرعامل مجاز به بررسی دستورکار است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) throw new Error('جلسه یافت نشد');
    if (meeting.status !== 'WAITING_FOR_CEO_APPROVAL') throw new Error('دستورکار در انتظار تأیید مدیرعامل نیست');
    if (decision === 'RETURN' && !notes.trim()) throw new Error('دلیل بازگشت دستورکار الزامی است');
    if (decision === 'APPROVE' && !meeting.agendaItems.some((item) => !item.isRemoved)) throw new Error('دستورکار بدون موضوع فعال قابل تأیید نیست');
    const previousStatus = meeting.status;
    meeting.status = decision === 'APPROVE' ? 'READY_FOR_INVITATION' : 'AGENDA_RETURNED';
    meeting.agendaApprovalNotes = notes.trim();
    this.addHistory(meeting, actor, decision === 'APPROVE' ? 'تأیید نهایی دستورکار' : 'بازگشت دستورکار به دبیرخانه', previousStatus, notes.trim());
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 140);
  }

  public async submitAgenda(id: string, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('فقط دبیرخانه مجاز به ارسال مجدد دستورکار است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting || meeting.status !== 'AGENDA_RETURNED') throw new Error('فقط دستورکار برگشتی قابل ارسال مجدد است');
    meeting.status = 'WAITING_FOR_CEO_APPROVAL';
    this.addHistory(meeting, actor, 'اصلاح و ارسال مجدد دستورکار برای مدیرعامل', 'AGENDA_RETURNED');
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async addGuest(id: string, guest: Omit<MeetingGuest, 'id' | 'invitationStatus'>, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('فقط دبیرخانه مجاز به ثبت مدعو است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) throw new Error('جلسه یافت نشد');
    if (!guest.fullName.trim() || !guest.roleTitle.trim() || !guest.organizationName.trim() || !guest.phone.trim()) throw new Error('نام، سمت، سازمان و شماره تماس مدعو الزامی است');
    meeting.guests = [...(meeting.guests || []), { ...guest, id: `guest-${Date.now()}`, invitationStatus: 'NOT_SENT' }];
    this.addHistory(meeting, actor, `ثبت مدعو: ${guest.fullName}`, meeting.status, guest.agendaItemTitle);
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 120);
  }

  public async sendInvitations(id: string, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('فقط دبیرخانه مجاز به ارسال دعوتنامه است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    if (!meeting) throw new Error('جلسه یافت نشد');
    if (meeting.status !== 'READY_FOR_INVITATION') throw new Error('دعوتنامه فقط پس از تأیید نهایی دستورکار قابل ارسال است');
    const sentAt = new Date().toISOString();
    meeting.invitations = [
      ...meeting.members.map((member) => ({ id: `inv-member-${meeting.id}-${member.userId}`, recipientType: 'MEMBER' as const, recipientId: member.userId, recipientName: member.fullName, status: 'SENT' as const, sentAt, attachmentIds: meeting.attachments.map((item) => item.id) })),
      ...(meeting.guests || []).map((guest) => ({ id: `inv-guest-${meeting.id}-${guest.id}`, recipientType: 'GUEST' as const, recipientId: guest.id, recipientName: guest.fullName, recipientPhone: guest.phone, status: 'SENT' as const, sentAt, attachmentIds: meeting.attachments.map((item) => item.id) })),
    ];
    meeting.guests = (meeting.guests || []).map((guest) => ({ ...guest, invitationStatus: 'SENT', sentAt }));
    meeting.status = 'INVITATION_SENT';
    this.addHistory(meeting, actor, 'ارسال دعوتنامه اعضا و مدعوین', 'READY_FOR_INVITATION', `${meeting.invitations.length} دعوتنامه ارسال شد`);
    this.saveMeetingsData(meetings);
    await smsService.sendMeetingNotification(meeting);
    return apiClient.simulateNetwork(meeting, 180);
  }

  public async markInvitationViewed(id: string, recipientId: string, actor: User): Promise<ApiResponse<Meeting>> {
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    const invitation = meeting?.invitations?.find((item) => item.recipientId === recipientId);
    if (!meeting || !invitation) throw new Error('دعوتنامه یافت نشد');
    if (recipientId !== actor.id && actor.role !== 'ADMIN') throw new Error('فقط گیرنده دعوتنامه می‌تواند مشاهده آن را ثبت کند');
    invitation.status = 'VIEWED';
    invitation.viewedAt = new Date().toISOString();
    this.addHistory(meeting, actor, 'مشاهده دعوتنامه جلسه', meeting.status);
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 100);
  }

  public async recordAgendaOutcome(id: string, agendaItemId: string, outcomeStatus: NonNullable<AgendaItem['outcomeStatus']>, notes: string, actor: User): Promise<ApiResponse<Meeting>> {
    if (!['SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('فقط دبیرخانه مجاز به ثبت نتیجه جلسه است');
    if (!notes.trim()) throw new Error('شرح نتیجه بررسی الزامی است');
    const meetings = this.getMeetingsData();
    const meeting = meetings.find((item) => item.id === id);
    const agenda = meeting?.agendaItems.find((item) => item.id === agendaItemId);
    if (!meeting || !agenda) throw new Error('جلسه یا بند دستورکار یافت نشد');
    if (!['INVITATION_SENT', 'SCHEDULED', 'IN_PROGRESS', 'HELD'].includes(meeting.status)) throw new Error('ثبت نتیجه پیش از ارسال دعوتنامه و شروع جلسه مجاز نیست');
    if (agenda.isRemoved) throw new Error('برای موضوع خارج‌شده از دستورکار نمی‌توان نتیجه ثبت کرد');
    agenda.outcomeStatus = outcomeStatus;
    agenda.outcomeNotes = notes.trim();
    agenda.isDiscussed = true;
    const previousStatus = meeting.status;
    meeting.status = 'IN_PROGRESS';
    this.addHistory(meeting, actor, `ثبت نتیجه بند ${agenda.order}: ${agenda.title}`, previousStatus, notes.trim());
    this.saveMeetingsData(meetings);
    return apiClient.simulateNetwork(meeting, 120);
  }
}

export const meetingService: IMeetingService = new MockMeetingService();
