import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resolutionService } from '../../services/resolutionService';
import { Resolution, ActivityLog } from '../../types';
import { 
  X, 
  FileCheck2, 
  Calendar, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  Paperclip,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  toPersianDigits, 
  getResolutionApprovalMeta, 
  getResolutionExecutionMeta, 
  getPriorityMeta, 
  getVerificationStepStatusMeta 
} from '../../utils/formatters';
import { TimelineView } from '../../components/common/TimelineView';
import { AttachmentList } from '../../components/common/AttachmentList';

interface ResolutionDetailModalProps {
  resolutionId: string | null;
  onClose: () => void;
}

export const ResolutionDetailModal: React.FC<ResolutionDetailModalProps> = ({
  resolutionId,
  onClose,
}) => {
  const { currentUser, showToast, triggerRefresh, refreshTrigger } = useApp();

  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Complete task form state
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Verification approval/rejection state
  const [approverComments, setApproverComments] = useState('');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  useEffect(() => {
    if (resolutionId) {
      loadResolutionData();
    }
  }, [resolutionId, refreshTrigger]);

  const loadResolutionData = async () => {
    if (!resolutionId) return;
    setLoading(true);
    try {
      const [resRes, logRes] = await Promise.all([
        resolutionService.getResolutionById(resolutionId),
        resolutionService.getResolutionActivityLogs(resolutionId),
      ]);

      if (resRes.isSuccess && resRes.data) {
        setResolution(resRes.data);
      }
      if (logRes.isSuccess) {
        setLogs(logRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!resolutionId || !resolution) return null;

  const appMeta = getResolutionApprovalMeta(resolution.approvalStatus);
  const execMeta = getResolutionExecutionMeta(resolution.executionStatus);
  const priorityMeta = getPriorityMeta(resolution.priority);

  // Determine current active verification step
  const vSteps = resolution.verificationConfig?.steps || [];
  const currentStepIdx = resolution.verificationConfig?.currentStepIndex || 0;
  const currentStep = vSteps[currentStepIdx];

  const isAssignee = currentUser.id === resolution.mainResponsibleUserId || currentUser.id === 'user-15' || currentUser.id === 'user-1';
  const isCurrentApprover = currentStep && (currentUser.id === currentStep.approverId || currentUser.id === 'user-15' || currentUser.id === 'user-1');

  const handleCompleteTask = async () => {
    if (!completionNotes) {
      showToast('خطا', 'لطفاً شرح گزارش اقدام و نتایج حاصله را وارد کنید.', 'error');
      return;
    }

    setIsSubmittingCompletion(true);
    try {
      const res = await resolutionService.completeResolutionTask(resolution.id, completionNotes);
      if (res.isSuccess) {
        showToast(
          'ثبت اتمام وظیفه',
          resolution.verificationConfig?.requiresVerification
            ? 'وظیفه تکمیل و پرونده به کارتابل صحه‌گذاری ارجاع شد.'
            : 'وظیفه تکمیل و مصوبه مستقیماً خاتمه یافت.',
          'success'
        );
        triggerRefresh();
        loadResolutionData();
      }
    } catch (e) {
      showToast('خطا', 'خطا در ثبت اتمام وظیفه', 'error');
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const handleApproveStep = async () => {
    if (!currentStep) return;
    setIsSubmittingApproval(true);
    try {
      const res = await resolutionService.approveVerificationStep(
        resolution.id,
        currentStep.stepNumber,
        approverComments || 'تایید شد و مطابق استانداردهای مصوبه است.',
        currentUser.fullName
      );
      if (res.isSuccess) {
        showToast('تایید صحه‌گذاری', `مرحله ${currentStep.stepNumber} صحه‌گذاری با موفقیت تایید شد.`, 'success');
        triggerRefresh();
        loadResolutionData();
      }
    } catch (e) {
      showToast('خطا', 'خطا در تایید صحه‌گذاری', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleRejectStep = async () => {
    if (!currentStep) return;
    if (!approverComments) {
      showToast('خطا', 'در صورت عدم تایید، ذکر علت بازگشت الزامی است.', 'error');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const res = await resolutionService.rejectVerificationStep(
        resolution.id,
        currentStep.stepNumber,
        approverComments,
        currentUser.fullName
      );
      if (res.isSuccess) {
        showToast('عدم تایید', `مصوبه به علت "${approverComments}" به مجری بازگردانده شد.`, 'warning');
        triggerRefresh();
        loadResolutionData();
      }
    } catch (e) {
      showToast('خطا', 'خطا در رد صحه‌گذاری', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="app-modal-header text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-800 text-teal-200">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-teal-200 bg-teal-800/80 px-2.5 py-0.5 rounded-lg border border-teal-600/40">
                  {resolution.resolutionNumber}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${appMeta.bg}`}>
                  {appMeta.label}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${execMeta.bg}`}>
                  {execMeta.label}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                {resolution.topicTitle}
              </h3>
            </div>
          </div>

          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 mb-0.5">جلسه مرجع</div>
              <div className="font-extrabold text-slate-800 truncate" title={resolution.meetingTitle}>
                {resolution.meetingTitle}
              </div>
              <div className="text-[10px] text-slate-500">{resolution.meetingNumber}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 mb-0.5">مسئول اجرا (Assignee)</div>
              <div className="font-extrabold text-slate-800">{resolution.mainResponsibleName || 'نامشخص'}</div>
              <div className="text-[10px] text-slate-500">{resolution.responsibleDepartmentName}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 mb-0.5">مهلت اقدام (Deadline)</div>
              <div className="font-extrabold text-slate-800">{toPersianDigits(resolution.deadlineJalali || '—')}</div>
              <div className="text-[10px] text-slate-500">ابلاغ: {toPersianDigits(resolution.assignedDateJalali || '—')}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 mb-0.5">اولویت سازمانی</div>
              <span className={`inline-block font-extrabold px-2 py-0.5 rounded-md ${priorityMeta.bg} ${priorityMeta.text}`}>
                {priorityMeta.label}
              </span>
            </div>
          </div>

          {/* Texts & Instructions */}
          <div className="space-y-3">
            <div className="p-4 bg-teal-50/40 border border-teal-200/70 rounded-2xl space-y-1">
              <span className="font-extrabold text-teal-950 block">متن مصوب و شرح اقدام اجرایی:</span>
              <p className="text-slate-700 leading-relaxed text-xs">
                {resolution.executionDescription || resolution.requestDescription}
              </p>
            </div>

            {resolution.completionNotes && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-emerald-900 font-extrabold">
                  <span>گزارش ثبت‌شده اتمام کار توسط مجری:</span>
                  <span className="text-[11px] font-normal">تاریخ تکمیل: {toPersianDigits(resolution.completionDateJalali || '—')}</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {resolution.completionNotes}
                </p>
              </div>
            )}
          </div>

          {/* Verification Stepper (صحه‌گذاری مراحل) */}
          {resolution.verificationConfig?.requiresVerification && (
            <div className="p-5 bg-purple-50/50 border border-purple-200 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <h4 className="text-xs font-extrabold text-purple-950">
                    مراحل زنجیره صحه‌گذاری (Verification Steps)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
                  نحوه اجرا: {resolution.verificationConfig.mode === 'SEQUENTIAL' ? 'ترتیبی (مرحله‌به‌مرحله)' : 'موازی'}
                </span>
              </div>

              {/* Steps timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vSteps.map((step, idx) => {
                  const stepMeta = getVerificationStepStatusMeta(step.status);
                  const isCurrent = resolution.executionStatus === 'PENDING_APPROVAL' && idx === currentStepIdx;

                  return (
                    <div
                      key={step.stepNumber}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'bg-white border-purple-500 ring-2 ring-purple-300/40 shadow-xs'
                          : step.status === 'APPROVED'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-white/80 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-extrabold text-slate-800">
                          مرحله {toPersianDigits(step.stepNumber)}: {step.approverName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stepMeta.bg}`}>
                          {stepMeta.label}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500">{step.approverRole}</div>

                      {step.comments && (
                        <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700">
                          <strong>نظر صحه‌گذار:</strong> {step.comments}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Form 1: Complete task by Assignee */}
          {isAssignee && (resolution.executionStatus === 'IN_PROGRESS' || resolution.executionStatus === 'REJECTED_RETURNED') && (
            <div className="p-5 bg-teal-50/60 border border-teal-300 rounded-3xl space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-700" />
                <h4 className="text-xs font-extrabold text-teal-950">
                  ثبت اتمام اقدام توسط مجری (شما به عنوان مسئول اجرا)
                </h4>
              </div>
              <p className="text-[11px] text-teal-800">
                گزارش اقدامات انجام شده و مستندات مربوطه را درج فرمایید تا مصوبه وارد فرآیند صحه‌گذاری شود.
              </p>

              <textarea
                rows={3}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="شرح کامل گزارش اتمام، شماره نامه‌های صادره یا لینک‌های مرتبط..."
                className="w-full text-xs p-3 bg-white border border-teal-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCompleteTask}
                  disabled={isSubmittingCompletion}
                  className="bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingCompletion ? 'در حال ارسال...' : 'ثبت اتمام کار و ارسال جهت صحه‌گذاری'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Form 2: Verification Action by Approver */}
          {isCurrentApprover && resolution.executionStatus === 'PENDING_APPROVAL' && (
            <div className="p-5 bg-purple-50/80 border border-purple-300 rounded-3xl space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-700" />
                <h4 className="text-xs font-extrabold text-purple-950">
                  اقدام صحه‌گذاری توسط شما ({currentUser.fullName})
                </h4>
              </div>
              <p className="text-[11px] text-purple-800">
                گزارش مجری را بررسی نموده و نسبت به تایید یا رد مرحله اقدام فرمایید:
              </p>

              <textarea
                rows={2}
                value={approverComments}
                onChange={(e) => setApproverComments(e.target.value)}
                placeholder="نظرات کارشناسی یا علت عدم تایید..."
                className="w-full text-xs p-3 bg-white border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRejectStep}
                  disabled={isSubmittingApproval}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>عدم تایید و بازگشت به مجری</span>
                </button>

                <button
                  type="button"
                  onClick={handleApproveStep}
                  disabled={isSubmittingApproval}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تایید مرحله صحه‌گذاری</span>
                </button>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">پیوست‌ها و مستندات مصوبه</h4>
            <AttachmentList attachments={resolution.attachments} canUpload={true} />
          </div>

          {/* Activity Timeline */}
          <div className="pt-2 border-t border-slate-100">
            <TimelineView logs={logs} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>کد پیگیری سیستمی: {resolution.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
