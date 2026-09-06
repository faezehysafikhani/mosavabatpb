import { ApiResponse, BoardMinutes, Meeting, ResolutionNotice, User, WorkflowHistoryEntry } from '../types';
import { apiClient } from './api/apiClient';
import { loadLocalCollection, saveLocalCollection } from './localStore';
import { resolutionService } from './resolutionService';

const clock = () => { const now = new Date(); return { iso: now.toISOString(), date: new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).replace(/[\u200e\u200f]/g, ''), time: now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) }; };

class BoardSecretariatService {
  private minutes = () => loadLocalCollection<BoardMinutes[]>('boardMinutes', []);
  private notices = () => loadLocalCollection<ResolutionNotice[]>('resolutionNotices', []);
  private requireSecretary(actor: User) { if (!['SECRETARY', 'ADMIN'].includes(actor.role)) throw new Error('فقط دبیرخانه مجاز به انجام این عملیات است'); }
  private entry(actor: User, action: string, toStatus: string, fromStatus?: string, notes?: string): WorkflowHistoryEntry { const now = clock(); return { id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, action, actorUserId: actor.id, actorName: actor.fullName, actorRole: actor.title, fromStatus, toStatus, dateJalali: now.date, timeString: now.time, notes }; }
  private audit(entry: WorkflowHistoryEntry) { const items = loadLocalCollection<WorkflowHistoryEntry[]>('governanceAudit', []); items.unshift(entry); saveLocalCollection('governanceAudit', items); }

  async getMinutes(meetingId: string): Promise<ApiResponse<BoardMinutes | null>> { return apiClient.simulateNetwork(this.minutes().find((item) => item.meetingId === meetingId) || null, 60); }

  async createMinutes(meeting: Meeting, content: string, actor: User): Promise<ApiResponse<BoardMinutes>> {
    this.requireSecretary(actor); const all = this.minutes(); const existing = all.find((item) => item.meetingId === meeting.id); if (existing) return apiClient.simulateNetwork(existing, 50);
    const now = clock(); const entry = this.entry(actor, 'ایجاد پیش‌نویس صورت‌جلسه تجمیعی', 'DRAFT');
    const item: BoardMinutes = { id: `minutes-${Date.now()}`, meetingId: meeting.id, meetingNumber: meeting.meetingNumber, status: 'DRAFT', content: content.trim(), copiesCount: 3, signatures: meeting.members.filter((member) => member.attendanceType !== 'GUEST' && member.presenceStatus !== 'ABSENT').map((member) => ({ memberUserId: member.userId, memberName: member.fullName, memberTitle: member.roleTitle, status: 'PENDING' })), createdByUserId: actor.id, createdByName: actor.fullName, createdAt: now.iso, updatedByUserId: actor.id, updatedByName: actor.fullName, updatedAt: now.iso, history: [entry] };
    all.unshift(item); saveLocalCollection('boardMinutes', all); this.audit(entry); return apiClient.simulateNetwork(item, 100);
  }

  async updateMinutes(meetingId: string, content: string, actor: User): Promise<ApiResponse<BoardMinutes>> {
    this.requireSecretary(actor); const all = this.minutes(); const item = all.find((value) => value.meetingId === meetingId); if (!item || item.status !== 'DRAFT') throw new Error('فقط پیش‌نویس قابل ویرایش است');
    const now = clock(); const entry = this.entry(actor, 'ویرایش پیش‌نویس صورت‌جلسه', 'DRAFT', item.status); item.content = content.trim(); item.updatedAt = now.iso; item.updatedByUserId = actor.id; item.updatedByName = actor.fullName; item.history.push(entry); saveLocalCollection('boardMinutes', all); this.audit(entry); return apiClient.simulateNetwork(item, 80);
  }

  async startSignatures(meetingId: string, actor: User): Promise<ApiResponse<BoardMinutes>> {
    this.requireSecretary(actor); const all = this.minutes(); const item = all.find((value) => value.meetingId === meetingId); if (!item || item.status !== 'DRAFT' || !item.content.trim()) throw new Error('پیش‌نویس معتبر یافت نشد');
    const entry = this.entry(actor, 'ارسال صورت‌جلسه برای امضای اعضای حاضر', 'WAITING_SIGNATURES', item.status); item.status = 'WAITING_SIGNATURES'; item.history.push(entry); saveLocalCollection('boardMinutes', all); this.audit(entry); return apiClient.simulateNetwork(item, 80);
  }

  async signMinutes(meetingId: string, actor: User, comments?: string): Promise<ApiResponse<BoardMinutes>> {
    const all = this.minutes(); const item = all.find((value) => value.meetingId === meetingId); if (!item || !['WAITING_SIGNATURES', 'PARTIALLY_SIGNED'].includes(item.status)) throw new Error('صورت‌جلسه در مرحله امضا نیست');
    const signature = item.signatures.find((value) => value.memberUserId === actor.id); if (!signature || signature.status === 'SIGNED') throw new Error('شما امضاکننده نیستید یا قبلاً امضا کرده‌اید');
    signature.status = 'SIGNED'; signature.signedAt = new Date().toISOString(); signature.comments = comments?.trim(); const previous = item.status; item.status = item.signatures.every((value) => value.status === 'SIGNED') ? 'SIGNED' : 'PARTIALLY_SIGNED'; const entry = this.entry(actor, 'امضای صورت‌جلسه تجمیعی', item.status, previous, comments); item.history.push(entry); saveLocalCollection('boardMinutes', all); this.audit(entry); return apiClient.simulateNetwork(item, 90);
  }

  async finalizeMinutes(meetingId: string, actor: User): Promise<ApiResponse<BoardMinutes>> {
    this.requireSecretary(actor); const all = this.minutes(); const item = all.find((value) => value.meetingId === meetingId); if (!item || item.status !== 'SIGNED') throw new Error('همه اعضای حاضر باید صورت‌جلسه را امضا کنند');
    const entry = this.entry(actor, 'نهایی‌سازی صورت‌جلسه در سه نسخه', 'FINALIZED', item.status); item.status = 'FINALIZED'; item.finalizedAt = new Date().toISOString(); item.history.push(entry); saveLocalCollection('boardMinutes', all); this.audit(entry); await resolutionService.markMeetingMinutesFinalized(meetingId); return apiClient.simulateNetwork(item, 100);
  }

  async getNotices(meetingId?: string, resolutionId?: string): Promise<ApiResponse<ResolutionNotice[]>> { return apiClient.simulateNetwork(this.notices().filter((item) => (!meetingId || item.meetingId === meetingId) && (!resolutionId || item.resolutionId === resolutionId)), 60); }

  async issueNotices(meetingId: string, actor: User): Promise<ApiResponse<ResolutionNotice[]>> {
    this.requireSecretary(actor); const minutes = (await this.getMinutes(meetingId)).data; if (!minutes || minutes.status !== 'FINALIZED') throw new Error('ابتدا صورت‌جلسه را نهایی کنید');
    const result = await resolutionService.getResolutions({ meetingId, pageSize: 200 }); const resolutions = result.data.items.filter((item) => item.executionStatus === 'WAITING_NOTIFICATION'); const all = this.notices(); const created: ResolutionNotice[] = []; const now = clock();
    resolutions.forEach((resolution) => { const recipients = new Map<string, { name: string; department: string }>(); if (resolution.mainResponsibleName) recipients.set(`main-${resolution.mainResponsibleUserId}`, { name: resolution.mainResponsibleName, department: resolution.responsibleDepartmentName || '' }); recipients.set(`proposer-${resolution.proposerDepartment}`, { name: resolution.proposerName, department: resolution.proposerDepartment }); resolution.referrals.forEach((referral) => recipients.set(`${referral.targetType}-${referral.targetId}`, { name: referral.targetName, department: referral.targetName })); recipients.forEach((recipient) => { if (all.some((notice) => notice.resolutionId === resolution.id && notice.recipientName === recipient.name)) return; created.push({ id: `notice-${Date.now()}-${created.length}`, noticeNumber: `ابلاغ-${new Date().getFullYear()}-${all.length + created.length + 1}`, resolutionId: resolution.id, resolutionNumber: resolution.resolutionNumber, meetingId, dateJalali: now.date, recipientName: recipient.name, recipientDepartment: recipient.department, text: `مصوبه «${resolution.topicTitle}» جهت اقدام و رعایت مهلت مقرر ابلاغ می‌شود.`, deadlineJalali: resolution.deadlineJalali, attachmentIds: resolution.attachments.map((attachment) => attachment.id), status: 'SENT', sentAt: now.iso, createdByUserId: actor.id }); }); });
    all.unshift(...created); saveLocalCollection('resolutionNotices', all); const entry = this.entry(actor, `صدور و ارسال ${created.length} ابلاغیه`, 'NOTIFIED', 'WAITING_NOTIFICATION'); this.audit(entry); await resolutionService.releaseMeetingResolutionsForExecution(meetingId); return apiClient.simulateNetwork(created, 120);
  }

  async markNoticeReceived(noticeId: string, actor: User): Promise<ApiResponse<ResolutionNotice>> { const all = this.notices(); const notice = all.find((item) => item.id === noticeId); if (!notice) throw new Error('ابلاغیه یافت نشد'); if (actor.role !== 'ADMIN' && notice.recipientName !== actor.fullName && notice.recipientDepartment !== actor.departmentName) throw new Error('فقط گیرنده ابلاغیه یا مدیر سیستم مجاز به ثبت دریافت است'); if (notice.status === 'RECEIVED') return apiClient.simulateNetwork(notice, 30); notice.status = 'RECEIVED'; notice.receivedAt = new Date().toISOString(); saveLocalCollection('resolutionNotices', all); this.audit(this.entry(actor, `ثبت دریافت ${notice.noticeNumber}`, 'RECEIVED', 'SENT')); return apiClient.simulateNetwork(notice, 60); }
}

export const boardSecretariatService = new BoardSecretariatService();
