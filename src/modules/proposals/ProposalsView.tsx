import React, { useEffect, useState } from 'react';
import {
  Lightbulb, Plus, Send, CheckSquare, Square, Calendar,
  CheckCircle2, XCircle, Inbox, FileCheck2, ClipboardList
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { proposalService } from '../../services/proposalService';
import { meetingService } from '../../services/meetingService';
import { Proposal, ProposalStatus, Meeting } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

type ProposalTab = 'MINE' | 'MANAGEMENT' | 'OFFICE';

const STATUS_META: Record<ProposalStatus, { label: string; bg: string }> = {
  PENDING_MANAGEMENT_REVIEW: { label: 'در انتظار بررسی مدیریت', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED: { label: 'رد شده', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  ASSIGNED_TO_MEETING: { label: 'در انتظار اقدام مسئول دفتر', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONVERTED_TO_AGENDA: { label: 'تبدیل شده به تأیید جلسه', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const ProposalsView: React.FC = () => {
  const { currentUser, showToast, refreshTrigger, triggerRefresh } = useApp();

  const isManagement = currentUser.role === 'ADMIN' || currentUser.role === 'CEO' || currentUser.role === 'DEPT_MANAGER';
  const isOfficeManager = currentUser.role === 'ADMIN' || currentUser.role === 'SECRETARY';

  const [tab, setTab] = useState<ProposalTab>('MINE');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposerName, setProposerName] = useState(currentUser.fullName);
  const [proposerDept, setProposerDept] = useState(currentUser.departmentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Management review state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignMeetingId, setAssignMeetingId] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [propRes, meetRes] = await Promise.all([
        proposalService.getProposals({ pageSize: 200 }),
        meetingService.getMeetings({ pageSize: 200 }),
      ]);
      if (propRes.isSuccess) setProposals(propRes.data.items);
      if (meetRes.isSuccess) setMeetings(meetRes.data.items);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('خطا', 'عنوان و شرح پیشنهاد الزامی است.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await proposalService.createProposal({
        title: title.trim(),
        description: description.trim(),
        proposerName,
        proposerDepartmentId: currentUser.departmentId,
        proposerDepartmentName: proposerDept,
        dateJalali: '۱۴۰۳/۰۶/۲۸',
      });
      showToast('ثبت پیشنهاد', 'پیشنهاد شما برای بررسی به کارتابل مدیریت ارسال شد.', 'success');
      setTitle('');
      setDescription('');
      triggerRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleAssignToMeeting = async () => {
    if (selectedIds.length === 0) {
      showToast('خطا', 'حداقل یک پیشنهاد را انتخاب کنید.', 'error');
      return;
    }
    if (!assignMeetingId) {
      showToast('خطا', 'انتخاب جلسه مقصد الزامی است.', 'error');
      return;
    }
    const meeting = meetings.find((m) => m.id === assignMeetingId);
    await proposalService.reviewProposals(selectedIds, 'ASSIGNED_TO_MEETING', meeting?.id, meeting?.title, decisionNotes);
    showToast('بررسی پیشنهادها', `${toPersianDigits(selectedIds.length)} پیشنهاد به جلسه «${meeting?.title}» تخصیص یافت.`, 'success');
    setSelectedIds([]);
    setAssignMeetingId('');
    setDecisionNotes('');
    triggerRefresh();
  };

  const handleReject = async () => {
    if (selectedIds.length === 0) {
      showToast('خطا', 'حداقل یک پیشنهاد را انتخاب کنید.', 'error');
      return;
    }
    await proposalService.reviewProposals(selectedIds, 'REJECTED', undefined, undefined, decisionNotes);
    showToast('بررسی پیشنهادها', `${toPersianDigits(selectedIds.length)} پیشنهاد رد شد.`, 'warning');
    setSelectedIds([]);
    setDecisionNotes('');
    triggerRefresh();
  };

  const handleConvertToAgenda = async (proposal: Proposal) => {
    try {
      await proposalService.convertToAgendaItem(proposal.id);
      showToast('تأیید جلسه', `پیشنهاد «${proposal.title}» به دستور جلسه «${proposal.assignedMeetingTitle}» اضافه شد.`, 'success');
      triggerRefresh();
    } catch (err) {
      showToast('خطا', err instanceof Error ? err.message : 'خطا در تبدیل به تأیید جلسه', 'error');
    }
  };

  const myProposals = proposals.filter((p) => p.proposerName === currentUser.fullName);
  const managementQueue = proposals.filter((p) => p.status === 'PENDING_MANAGEMENT_REVIEW');
  const officeQueue = proposals.filter((p) => p.status === 'ASSIGNED_TO_MEETING');

  const visibleTabs: { id: ProposalTab; label: string; count: number; icon: React.ElementType }[] = [
    { id: 'MINE', label: 'ثبت و پیشنهادهای من', count: myProposals.length, icon: Lightbulb },
    ...(isManagement ? [{ id: 'MANAGEMENT' as ProposalTab, label: 'کارتابل مدیریت', count: managementQueue.length, icon: Inbox }] : []),
    ...(isOfficeManager ? [{ id: 'OFFICE' as ProposalTab, label: 'کارتابل مسئول دفتر', count: officeQueue.length, icon: ClipboardList }] : []),
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <span>پیشنهادهای جلسه</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          ثبت پیشنهاد موضوع برای طرح در جلسات، بررسی مدیریت و تخصیص به جلسه توسط مسئول دفتر
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          {visibleTabs.map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                tab === id ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-[9px] font-bold px-1.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {toPersianDigits(count)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === 'MINE' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateProposal} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-700" />
              ثبت پیشنهاد جدید
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان پیشنهاد *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="مثال: برگزاری دوره آموزشی امنیت سایبری" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">پیشنهاددهنده</label>
                <input type="text" value={proposerName} onChange={(e) => setProposerName(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سازمان / واحد</label>
                <input type="text" value={proposerDept} onChange={(e) => setProposerDept(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">شرح پیشنهاد و توضیحات *</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="این موضوع چرا باید در جلسه مطرح و درباره آن تصمیم‌گیری شود؟" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'در حال ارسال...' : 'ارسال پیشنهاد به کارتابل مدیریت'}</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {myProposals.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
                هنوز پیشنهادی ثبت نکرده‌اید.
              </div>
            ) : myProposals.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_META[p.status].bg}`}>{STATUS_META[p.status].label}</span>
                </div>
                <p className="text-xs text-slate-600">{p.description}</p>
                {p.assignedMeetingTitle && <p className="text-[11px] text-blue-700">جلسه مقصد: {p.assignedMeetingTitle}</p>}
                {p.managementDecisionNotes && <p className="text-[11px] text-slate-500">یادداشت مدیریت: {p.managementDecisionNotes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'MANAGEMENT' && isManagement && (
        <div className="space-y-4">
          {selectedIds.length > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-teal-900">{toPersianDigits(selectedIds.length)} پیشنهاد انتخاب شده</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select value={assignMeetingId} onChange={(e) => setAssignMeetingId(e.target.value)} className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none">
                  <option value="">انتخاب جلسه مقصد...</option>
                  {meetings.map((m) => <option key={m.id} value={m.id}>{m.meetingNumber} - {m.title}</option>)}
                </select>
                <input type="text" value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)} placeholder="یادداشت مدیریت (اختیاری)" className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAssignToMeeting} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تایید و انتخاب جلسه</span>
                </button>
                <button onClick={handleReject} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>رد پیشنهادها</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {managementQueue.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
                پیشنهادی در انتظار بررسی نیست.
              </div>
            ) : managementQueue.map((p) => (
              <div key={p.id} onClick={() => toggleSelect(p.id)} className={`bg-white rounded-2xl p-4 shadow-xs border transition-all cursor-pointer flex items-start gap-3 ${selectedIds.includes(p.id) ? 'border-teal-500 ring-1 ring-teal-200' : 'border-slate-100 hover:border-slate-200'}`}>
                {selectedIds.includes(p.id) ? <CheckSquare className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">پیشنهاددهنده: {p.proposerName} — {p.proposerDepartmentName}</p>
                  <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'OFFICE' && isOfficeManager && (
        <div className="space-y-3">
          {officeQueue.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
              پیشنهاد تأییدشده‌ای در انتظار اقدام نیست.
            </div>
          ) : officeQueue.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_META[p.status].bg}`}>{STATUS_META[p.status].label}</span>
              </div>
              <p className="text-xs text-slate-600">{p.description}</p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>جلسه مقصد: <strong className="text-slate-700">{p.assignedMeetingTitle}</strong></span>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={() => handleConvertToAgenda(p)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>تبدیل به تأیید جلسه</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
