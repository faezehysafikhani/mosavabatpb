import { Meeting, Resolution, User } from '../types';

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
    resolution.verificationConfig.steps.some((step) => step.approverId === user.id);
};
