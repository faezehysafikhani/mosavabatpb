import { Meeting, Resolution, User, UserRole } from '../types';

// Roles with organization-wide meeting visibility: ADMIN (system-wide), CEO
// (chairs/approves every meeting's agenda) and SECRETARY (مسئول دفتر — runs
// the meeting/proposal secretariat on the CEO's behalf, so their view must
// cover every meeting, not just ones they're personally listed on). Every
// other role only sees meetings they organize, secretary, or are a member of
// (see the participantUserId filter in meetingService.getMeetings).
export const hasOrgWideMeetingAccess = (role: UserRole): boolean =>
  role === 'ADMIN' || role === 'CEO' || role === 'SECRETARY';

const normalizeName = (value?: string) => (value || '')
  .replace(/\b(جناب|سرکار|خانم|آقای|دکتر|مهندس)\b/g, '')
  .replace(/[()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

export const isMeetingRelatedToUser = (meeting: Meeting, userId: string): boolean =>
  meeting.organizerId === userId ||
  meeting.secretaryId === userId ||
  meeting.members.some((member) => member.userId === userId);

export const isResolutionRelatedToUser = (resolution: Resolution, user: User): boolean => {
  const userName = normalizeName(user.fullName);

  return resolution.mainResponsibleUserId === user.id ||
    normalizeName(resolution.mainResponsibleName) === userName ||
    normalizeName(resolution.proposerName) === userName ||
    resolution.referrals.some((referral) =>
      (referral.targetType === 'USER' && referral.targetId === user.id) ||
      (referral.targetType === 'DEPARTMENT' && referral.targetId === user.departmentId)
    ) ||
    resolution.verificationConfig.steps.some((step) => step.approverId === user.id) ||
    resolution.signatureWorkflow?.steps.some((step) => step.signerUserId === user.id) ||
    // Department-wide visibility: everyone in the owning department can see the resolution,
    // not just the person it was personally assigned/referred to.
    (Boolean(resolution.responsibleDepartmentId) && resolution.responsibleDepartmentId === user.departmentId);
};
