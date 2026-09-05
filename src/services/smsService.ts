import { ApiResponse, Meeting, Proposal, User } from '../types';
import { mockDepartments, mockOrganizations, mockUsers } from '../mock/data';
import { apiClient } from './api/apiClient';
import { loadLocalCollection, loadLocalValue, saveLocalValue } from './localStore';

export interface SmsSettings {
  provider: 'KAVENEGAR';
  baseUrl: string;
  hasApiKey: boolean;
  senderNumber: string;
  isEnabled: boolean;
  letterTemplate: string;
  referralTemplate: string;
  meetingTemplate: string;
  proposalRejectionTemplate: string;
}

export const DEFAULT_SMS_SETTINGS: SmsSettings = {
  provider: 'KAVENEGAR',
  baseUrl: 'https://api.kavenegar.com/v1',
  hasApiKey: false,
  senderNumber: '',
  isEnabled: false,
  letterTemplate: 'نامه شماره {{شماره}} برای شما ثبت شد.',
  referralTemplate: 'مصوبه {{شماره}} به شما ارجاع شد. مهلت اقدام: {{مهلت}}',
  meetingTemplate: 'جلسه {meetingTitle} در تاریخ {meetingDate} ساعت {meetingTime} از طرف {departmentName} برگزار خواهد شد.',
  proposalRejectionTemplate: 'پیشنهاد {proposalTitle} ثبت‌شده توسط {organizationName} پس از بررسی مدیریت تأیید نشد.',
};

export interface SmsSendResult {
  sentCount: number;
  skipped: boolean;
}

interface SmsMockLog {
  id: string;
  scenario: 'MEETING_NOTIFICATION' | 'PROPOSAL_REJECTION' | 'TEST';
  phone: string;
  message: string;
  createdAt: string;
}

const renderTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);

class MockSmsService {
  public getSettings(): SmsSettings {
    const saved = loadLocalValue<Partial<SmsSettings>>('smsSettings', {});
    return { ...DEFAULT_SMS_SETTINGS, ...saved, provider: 'KAVENEGAR' };
  }

  public async updateSettings(settings: SmsSettings, newApiKey?: string): Promise<ApiResponse<SmsSettings>> {
    const safeSettings = { ...settings, hasApiKey: settings.hasApiKey || Boolean(newApiKey) };
    saveLocalValue('smsSettings', safeSettings);
    return apiClient.simulateNetwork(safeSettings, 80);
  }

  private saveMessages(messages: SmsMockLog[]) {
    const logs = loadLocalValue<SmsMockLog[]>('smsMockLog', []);
    saveLocalValue('smsMockLog', [...messages, ...logs]);
  }

  public async sendTest(phone: string, message: string): Promise<ApiResponse<SmsSendResult>> {
    this.saveMessages([{ id: `sms-${Date.now()}`, scenario: 'TEST', phone, message, createdAt: new Date().toISOString() }]);
    return apiClient.simulateNetwork({ sentCount: 1, skipped: false }, 120);
  }

  public async sendMeetingNotification(meeting: Meeting): Promise<ApiResponse<SmsSendResult>> {
    const settings = this.getSettings();
    if (!settings.isEnabled) return apiClient.simulateNetwork({ sentCount: 0, skipped: true }, 40);

    const users = loadLocalCollection<User[]>('users', mockUsers);
    const recipientIds = new Set([
      ...meeting.members.map((member) => member.userId),
      ...meeting.agendaItems.flatMap((agenda) => (agenda.relatedUsers || []).map((user) => user.userId)),
    ]);
    const recipients = users.filter((user) => recipientIds.has(user.id) && Boolean(user.phone));
    const uniqueByPhone = [...new Map(recipients.map((user) => [user.phone, user])).values()];
    const message = renderTemplate(settings.meetingTemplate, {
      meetingTitle: meeting.title,
      meetingDate: meeting.dateJalali,
      meetingTime: meeting.startTime,
      departmentName: meeting.departmentName,
    });
    this.saveMessages(uniqueByPhone.map((user, index) => ({
      id: `sms-${Date.now()}-${index}`,
      scenario: 'MEETING_NOTIFICATION',
      phone: user.phone,
      message,
      createdAt: new Date().toISOString(),
    })));
    return apiClient.simulateNetwork({ sentCount: uniqueByPhone.length, skipped: false }, 120);
  }

  public async sendProposalRejection(proposal: Proposal): Promise<ApiResponse<SmsSendResult>> {
    const settings = this.getSettings();
    if (!settings.isEnabled) return apiClient.simulateNetwork({ sentCount: 0, skipped: true }, 40);

    const users = loadLocalCollection<User[]>('users', mockUsers);
    const proposer = users.find((user) => user.id === proposal.proposerUserId);
    const department = mockDepartments.find((item) => item.id === proposal.proposerDepartmentId);
    const departmentManager = users.find((user) => user.id === department?.managerId);
    const organization = mockOrganizations.find((item) => item.id === department?.organizationId);
    const phone = proposer?.phone || departmentManager?.phone || organization?.phone;
    if (!phone) return apiClient.simulateNetwork({ sentCount: 0, skipped: true }, 40);

    const message = renderTemplate(settings.proposalRejectionTemplate, {
      proposalTitle: proposal.title,
      organizationName: proposal.proposerDepartmentName,
    });
    this.saveMessages([{ id: `sms-${Date.now()}`, scenario: 'PROPOSAL_REJECTION', phone, message, createdAt: new Date().toISOString() }]);
    return apiClient.simulateNetwork({ sentCount: 1, skipped: false }, 120);
  }
}

// Mock implementation of future server endpoints: /api/sms/send, /api/sms/test,
// /api/settings/sms. No provider request or API key is exposed by the frontend.
export const smsService = new MockSmsService();
