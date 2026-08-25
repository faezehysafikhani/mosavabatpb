import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { resolutionService } from '../../services/resolutionService';
import { mockUsers, mockDepartments, mockMeetings } from '../../mock/data';
import { 
  X, 
  Plus, 
  Trash2, 
  FileCheck2, 
  Calendar, 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  AlertTriangle,
  Send,
  Layers
} from 'lucide-react';
import { 
  ResolutionApprovalStatus, 
  PriorityLevel, 
  VerificationConfig, 
  VerificationStep, 
  ResolutionReferral 
} from '../../types';

interface CreateResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMeetingId?: string;
}

export const CreateResolutionModal: React.FC<CreateResolutionModalProps> = ({
  isOpen,
  onClose,
  defaultMeetingId,
}) => {
  const { showToast, triggerRefresh } = useApp();

  const [selectedMeetingId, setSelectedMeetingId] = useState(defaultMeetingId || mockMeetings[0].id);
  const [topicTitle, setTopicTitle] = useState('');
  const [proposerName, setProposerName] = useState('مهندس پوریا حسینی');
  const [proposerDepartment, setProposerDepartment] = useState('اداره کل فناوری اطلاعات و ارتباطات');
  const [requestDescription, setRequestDescription] = useState('');
  const [reviewResultNotes, setReviewResultNotes] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ResolutionApprovalStatus>('APPROVED');

  // Execution Details
  const [executionDescription, setExecutionDescription] = useState('');
  const [mainResponsibleUserId, setMainResponsibleUserId] = useState('user-2');
  const [responsibleDepartmentId, setResponsibleDepartmentId] = useState('dept-1');
  const [assignedDateJalali, setAssignedDateJalali] = useState('۱۴۰۳/۰۶/۲۸');
  const [deadlineJalali, setDeadlineJalali] = useState('۱۴۰۳/۰۷/۲۰');
  const [priority, setPriority] = useState<PriorityLevel>('HIGH');

  // Verification Settings
  const [requiresVerification, setRequiresVerification] = useState(true);
  const [verificationMode, setVerificationMode] = useState<'SEQUENTIAL' | 'PARALLEL'>('SEQUENTIAL');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      stepNumber: 1,
      approverId: 'user-3',
      approverName: 'دکتر محمدرضا تقوی',
      approverRole: 'رئیس مرکز امنیت و زیرساخت',
      status: 'NOT_STARTED',
    },
    {
      stepNumber: 2,
      approverId: 'user-1',
      approverName: 'دکتر علیرضا احمدی',
      approverRole: 'معاون برنامه‌ریزی و فناوری',
      status: 'NOT_STARTED',
    },
  ]);

  const [newStepApproverId, setNewStepApproverId] = useState('user-5');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddVerificationStep = () => {
    const user = mockUsers.find((u) => u.id === newStepApproverId);
    if (!user) return;

    const newStep: VerificationStep = {
      stepNumber: verificationSteps.length + 1,
      approverId: user.id,
      approverName: user.fullName,
      approverRole: user.title,
      status: 'NOT_STARTED',
    };

    setVerificationSteps([...verificationSteps, newStep]);
  };

  const handleRemoveVerificationStep = (stepNumber: number) => {
    setVerificationSteps(
      verificationSteps
        .filter((s) => s.stepNumber !== stepNumber)
        .map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle) {
      showToast('خطا', 'عنوان مصوبه الزامی است.', 'error');
      return;
    }

    const meeting = mockMeetings.find((m) => m.id === selectedMeetingId) || mockMeetings[0];
    const responsibleUser = mockUsers.find((u) => u.id === mainResponsibleUserId);
    const responsibleDept = mockDepartments.find((d) => d.id === responsibleDepartmentId);

    setIsSubmitting(true);
    try {
      const vConfig: VerificationConfig = {
        requiresVerification,
        mode: verificationMode,
        currentStepIndex: 0,
        steps: requiresVerification ? verificationSteps : [],
      };

      const res = await resolutionService.createResolution({
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        meetingNumber: meeting.meetingNumber,
        topicTitle,
        proposerName,
        proposerDepartment,
        requestDescription,
        reviewResultNotes,
        approvalStatus,
        executionDescription: executionDescription || requestDescription,
        mainResponsibleUserId: responsibleUser?.id,
        mainResponsibleName: responsibleUser?.fullName,
        responsibleDepartmentId: responsibleDept?.id,
        responsibleDepartmentName: responsibleDept?.name,
        assignedDateJalali,
        deadlineJalali,
        priority,
        verificationConfig: vConfig,
        attachments: [],
      });

      if (res.isSuccess) {
        showToast('ثبت موفق مصوبه', `مصوبه با شماره ${res.data.resolutionNumber} با موفقیت ثبت و ابلاغ شد.`, 'success');
        triggerRefresh();
        onClose();
      }
    } catch (err) {
      showToast('خطا', 'ثبت مصوبه با خطا مواجه شد.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-700 text-teal-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ثبت و تصویب مصوبه جدید سازمانی</h3>
              <p className="text-[11px] text-teal-200">تنظیم اطلاعات ارجاع، اولویت و تعریف زنجیره صحه‌گذاری (Verification)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Meeting Selection & Proposal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              مشخصات جلسه و پیشنهاد اولیه
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">جلسه مرجع *</label>
                <select
                  value={selectedMeetingId}
                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {mockMeetings.map((m) => (
                    <option key={m.id} value={m.id}>{m.meetingNumber} - {m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نتیجه بررسی / وضعیت تصویب *</label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as ResolutionApprovalStatus)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold"
                >
                  <option value="APPROVED">مصوب و ابلاغ جهت اجرا (Approved)</option>
                  <option value="CONDITIONAL_APPROVED">مصوب مشروط (Conditional)</option>
                  <option value="REFERRED_FOR_REVIEW">ارجاع مجدد جهت بازبینی و اصلاح</option>
                  <option value="REJECTED">رد شده / عدم تصویب (Rejected)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان موضوع مصوبه *</label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="مثال: استقرار زیرساخت احراز هویت مرکزی (SSO) سازمانی"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پیشنهاددهنده</label>
                <input
                  type="text"
                  value={proposerName}
                  onChange={(e) => setProposerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">واحد پیشنهاددهنده</label>
                <input
                  type="text"
                  value={proposerDepartment}
                  onChange={(e) => setProposerDepartment(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">شرح درخواست اولیه و ضرورت</label>
                <textarea
                  rows={2}
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="توضیحات و مستندات موضوع مطروحه در جلسه..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Execution & Assignment (Shown when approved) */}
          {approvalStatus === 'APPROVED' && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                دستور اجرا، ارجاع و مهلت اقدام
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">متن نهایی مصوبه و شرح اقدام اجرایی *</label>
                  <textarea
                    rows={2}
                    value={executionDescription}
                    onChange={(e) => setExecutionDescription(e.target.value)}
                    placeholder="شرح تکالیف محوله به واحد مجری..."
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مسئول اصلی پیگیری و اقدام (Assignee)</label>
                  <select
                    value={mainResponsibleUserId}
                    onChange={(e) => setMainResponsibleUserId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {mockUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName} ({u.title})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">واحد سازمانی مجری</label>
                  <select
                    value={responsibleDepartmentId}
                    onChange={(e) => setResponsibleDepartmentId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {mockDepartments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ ابلاغ</label>
                    <input
                      type="text"
                      value={assignedDateJalali}
                      onChange={(e) => setAssignedDateJalali(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">مهلت اقدام (Deadline)</label>
                    <input
                      type="text"
                      value={deadlineJalali}
                      onChange={(e) => setDeadlineJalali(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سطح اولویت</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="LOW">عادی (Low)</option>
                    <option value="MEDIUM">متوسط (Medium)</option>
                    <option value="HIGH">مهم و دارای اولویت (High)</option>
                    <option value="CRITICAL">بسیار فوری و حیاتی (Critical)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Verification Workflow Config (صحه‌گذاری مصوبه) */}
          {approvalStatus === 'APPROVED' && (
            <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  <div>
                    <h4 className="text-xs font-extrabold text-purple-950">
                      پیکربندی صحه‌گذاری و تاییدات نهایی (Verification Workflow)
                    </h4>
                    <p className="text-[10px] text-purple-700">
                      پس از اتمام کار توسط مجری، مصوبه در کارتابل افراد زیر جهت صحه‌گذاری قرار می‌گیرد.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresVerification}
                    onChange={(e) => setRequiresVerification(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-purple-900">نیاز به صحه‌گذاری دارد</span>
                </label>
              </div>

              {requiresVerification && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <span>نحوه اجرای مراحل صحه‌گذاری:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="verifMode"
                        checked={verificationMode === 'SEQUENTIAL'}
                        onChange={() => setVerificationMode('SEQUENTIAL')}
                      />
                      <span>ترتیبی (مرحله به مرحله)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="verifMode"
                        checked={verificationMode === 'PARALLEL'}
                        onChange={() => setVerificationMode('PARALLEL')}
                      />
                      <span>موازی (همزمان)</span>
                    </label>
                  </div>

                  {/* Verification steps list */}
                  <div className="space-y-2">
                    {verificationSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="flex items-center justify-between p-2.5 bg-white border border-purple-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-[10px]">
                            {step.stepNumber}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{step.approverName}</div>
                            <div className="text-[10px] text-slate-500">{step.approverRole}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVerificationStep(step.stepNumber)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add step */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={newStepApproverId}
                      onChange={(e) => setNewStepApproverId(e.target.value)}
                      className="flex-1 text-xs p-2 bg-white border border-purple-200 rounded-xl"
                    >
                      {mockUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          افزودن {u.fullName} ({u.title})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddVerificationStep}
                      className="py-2 px-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن مرحله تایید</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت و ابلاغ مصوبه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
