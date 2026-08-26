import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { resolutionService } from '../../services/resolutionService';
import { mockDepartments, mockMeetings } from '../../mock/data';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
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
  Layers,
  Lock,
  Building2
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
  defaultAgendaItemId?: string;
  defaultTopicTitle?: string;
}

export const CreateResolutionModal: React.FC<CreateResolutionModalProps> = ({
  isOpen,
  onClose,
  defaultMeetingId,
  defaultAgendaItemId,
  defaultTopicTitle,
}) => {
  const { availableUsers, showToast, triggerRefresh } = useApp();

  const [selectedMeetingId, setSelectedMeetingId] = useState(defaultMeetingId || mockMeetings[0].id);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState(defaultAgendaItemId || '');
  const [topicTitle, setTopicTitle] = useState(defaultTopicTitle || '');
  const [proposerName, setProposerName] = useState('مهندس پوریا حسینی');
  const [proposerDepartment, setProposerDepartment] = useState('اداره کل فناوری اطلاعات و ارتباطات');
  const [requestDescription, setRequestDescription] = useState('');
  const [reviewResultNotes, setReviewResultNotes] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ResolutionApprovalStatus>('APPROVED');

  // Execution Details
  const [executionDescription, setExecutionDescription] = useState('');
  const [mainResponsibleUserId, setMainResponsibleUserId] = useState(availableUsers[1]?.id || 'user-2');
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
      approverName: 'دکتر مسعود احمدی',
      approverRole: 'معاون برنامه‌ریزی و نظارت راهبردی',
      status: 'NOT_STARTED',
    },
    {
      stepNumber: 2,
      approverId: 'user-1',
      approverName: 'دکتر علیرضا رستمی',
      approverRole: 'رئیس سازمان و رئیس شورا',
      status: 'NOT_STARTED',
    },
  ]);

  const [newStepApproverId, setNewStepApproverId] = useState(availableUsers[3]?.id || 'user-4');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultMeetingId) setSelectedMeetingId(defaultMeetingId);
      if (defaultAgendaItemId) setSelectedAgendaItemId(defaultAgendaItemId);
      if (defaultTopicTitle) setTopicTitle(defaultTopicTitle);
    }
  }, [isOpen, defaultMeetingId, defaultAgendaItemId, defaultTopicTitle]);

  // Auto-fill responsible department when mainResponsibleUserId changes (Requirement 8)
  useEffect(() => {
    const user = availableUsers.find((u) => u.id === mainResponsibleUserId);
    if (user && user.departmentId) {
      setResponsibleDepartmentId(user.departmentId);
    }
  }, [mainResponsibleUserId, availableUsers]);

  if (!isOpen) return null;

  const currentResponsibleUser = availableUsers.find((u) => u.id === mainResponsibleUserId);
  const currentResponsibleDept = mockDepartments.find((d) => d.id === responsibleDepartmentId) || 
    { id: 'dept-1', name: currentResponsibleUser?.departmentName || 'اداره کل فناوری اطلاعات و ارتباطات' };

  const handleAddVerificationStep = () => {
    const user = availableUsers.find((u) => u.id === newStepApproverId);
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

  const isLockedMeeting = Boolean(defaultMeetingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) {
      showToast('خطا', 'عنوان مصوبه الزامی است.', 'error');
      return;
    }

    const meeting = mockMeetings.find((m) => m.id === selectedMeetingId) || mockMeetings[0];
    const responsibleUser = availableUsers.find((u) => u.id === mainResponsibleUserId);

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
        agendaItemId: selectedAgendaItemId || undefined,
        agendaItemTitle: defaultTopicTitle || undefined,
        topicTitle: topicTitle.trim(),
        proposerName,
        proposerDepartment,
        requestDescription,
        reviewResultNotes,
        approvalStatus,
        executionDescription: executionDescription || requestDescription || topicTitle,
        mainResponsibleUserId: responsibleUser?.id,
        mainResponsibleName: responsibleUser?.fullName,
        responsibleDepartmentId: currentResponsibleDept.id,
        responsibleDepartmentName: currentResponsibleDept.name,
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="app-modal-header text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ثبت و صدور مصوبه جدید سازمانی</h3>
              <p className="text-[11px] text-teal-200">
                {isLockedMeeting ? 'ثبت مستقیم مصوبه از دستور جلسه انتخاب‌شده' : 'تنظیم اطلاعات ارجاع، مسئول اجرا و زنجیره صحه‌گذاری'}
              </p>
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
              مشخصات جلسه و مصوبه
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>جلسه مرجع *</span>
                  {isLockedMeeting && (
                    <span className="text-[10px] text-teal-800 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      قفل شده بر اساس جلسه
                    </span>
                  )}
                </label>
                {isLockedMeeting ? (
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    <span>{mockMeetings.find((m) => m.id === selectedMeetingId)?.title || 'جلسه انتخاب‌شده'}</span>
                  </div>
                ) : (
                  <select
                    value={selectedMeetingId}
                    onChange={(e) => setSelectedMeetingId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {mockMeetings.map((m) => (
                      <option key={m.id} value={m.id}>{m.meetingNumber} - {m.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نتیجه بررسی / وضعیت تصویب *</label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as ResolutionApprovalStatus)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-teal-900"
                >
                  <option value="APPROVED">مصوب و ابلاغ جهت اجرا (Approved)</option>
                  <option value="CONDITIONAL_APPROVED">مصوب مشروط (Conditional)</option>
                  <option value="REFERRED_FOR_REVIEW">ارجاع مجدد جهت بازبینی و اصلاح</option>
                  <option value="REJECTED">رد شده / عدم تصویب (Rejected)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان موضوع مصوبه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="مثال: استقرار زیرساخت احراز هویت مرکزی (SSO) سازمانی"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
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

                {/* Responsible User Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مسئول اصلی پیگیری و اقدام (Assignee)</label>
                  <select
                    value={mainResponsibleUserId}
                    onChange={(e) => setMainResponsibleUserId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-teal-900"
                  >
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.title})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Responsible Department - Auto-filled & Locked (Requirement 8) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>واحد سازمانی مجری</span>
                    <span className="text-[10px] text-teal-800 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      تکمیل خودکار بر اساس مسئول
                    </span>
                  </label>
                  <div className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 flex items-center gap-2 cursor-not-allowed">
                    <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="truncate">{currentResponsibleDept.name}</span>
                  </div>
                </div>

                {/* Date Pickers for Assigned Date and Deadline (Requirement 5) */}
                <div>
                  <PersianDatePicker
                    label="تاریخ ابلاغ مصوبه"
                    value={assignedDateJalali}
                    onChange={setAssignedDateJalali}
                  />
                </div>

                <div>
                  <PersianDatePicker
                    label="مهلت اقدام (Deadline)"
                    value={deadlineJalali}
                    onChange={setDeadlineJalali}
                  />
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

          {/* Verification Workflow Config */}
          {approvalStatus === 'APPROVED' && (
            <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-700" />
                  <div>
                    <h4 className="text-xs font-extrabold text-teal-950">
                      پیکربندی صحه‌گذاری و تاییدات نهایی (Verification Workflow)
                    </h4>
                    <p className="text-[10px] text-teal-700">
                      پس از اتمام کار توسط مجری، مصوبه در کارتابل افراد زیر جهت صحه‌گذاری قرار می‌گیرد.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresVerification}
                    onChange={(e) => setRequiresVerification(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded-md focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-teal-900">نیاز به صحه‌گذاری دارد</span>
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

                  {/* Steps list */}
                  <div className="space-y-2">
                    {verificationSteps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-[10px]">
                            {step.stepNumber}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800">{step.approverName}</span>
                            <span className="text-[11px] text-slate-500 mr-2">({step.approverRole})</span>
                          </div>
                        </div>
                        {verificationSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVerificationStep(step.stepNumber)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add step control */}
                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={newStepApproverId}
                      onChange={(e) => setNewStepApproverId(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-200 rounded-xl flex-1 focus:ring-2 focus:ring-teal-500"
                    >
                      {availableUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} - {u.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddVerificationStep}
                      className="px-3 py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن صحه‌گذار</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'در حال ثبت مصوبه...' : 'تایید نهایی و ابلاغ مصوبه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
