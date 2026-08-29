import React, { useEffect, useState } from 'react';
import {
  Lightbulb, Plus, Send, Calendar, CheckCircle2, XCircle, Inbox, RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { proposalService } from '../../services/proposalService';
import { Proposal, ProposalStatus } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

type ProposalTab = 'OFFICE' | 'CEO';

const STATUS_META: Record<ProposalStatus, { label: string; bg: string }> = {
  PENDING_CEO_REVIEW: { label: 'در انتظار بررسی مدیرعامل', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED: { label: 'رد شده', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  APPROVED: { label: 'تأیید شده - آماده افزودن به جلسه', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONVERTED_TO_AGENDA: { label: 'تبدیل شده به بند دستور جلسه', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const DEFAULT_STATUS_META = { label: 'نامشخص', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
const getStatusMeta = (status: ProposalStatus) => STATUS_META[status] || DEFAULT_STATUS_META;

export const ProposalsView: React.FC = () => {
  const { currentUser, showToast, refreshTrigger, triggerRefresh } = useApp();

  const isOfficeManager = currentUser.role === 'ADMIN' || currentUser.role === 'SECRETARY';
  const isCeo = currentUser.role === 'ADMIN' || currentUser.role === 'CEO';

  const [tab, setTab] = useState<ProposalTab>(isOfficeManager ? 'OFFICE' : 'CEO');
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  const fetchAll = async () => {
    const res = await proposalService.getProposals({ pageSize: 200 });
    if (res.isSuccess) setProposals(res.data.items);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('خطا', 'عنوان و شرح درخواست راهبردی الزامی است.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await proposalService.createProposal({
        title: title.trim(),
        description: description.trim(),
        proposerName: currentUser.fullName,
        proposerDepartmentId: currentUser.departmentId,
        proposerDepartmentName: currentUser.departmentName,
        dateJalali: '۱۴۰۳/۰۶/۲۸',
      });
      showToast('ثبت درخواست راهبردی', 'درخواست راهبردی برای بررسی به کارتابل مدیرعامل ارسال شد.', 'success');
      setTitle('');
      setDescription('');
      triggerRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (proposal: Proposal, decision: 'APPROVED' | 'REJECTED') => {
    await proposalService.reviewProposal(proposal.id, decision, decisionNotes[proposal.id]);
    showToast(
      decision === 'APPROVED' ? 'تایید درخواست' : 'رد درخواست',
      decision === 'APPROVED'
        ? `درخواست «${proposal.title}» تایید شد و به کارتابل مسئول دفتر بازگشت.`
        : `درخواست «${proposal.title}» رد شد.`,
      decision === 'APPROVED' ? 'success' : 'warning'
    );
    setDecisionNotes((prev) => ({ ...prev, [proposal.id]: '' }));
    triggerRefresh();
  };

  const handleRecover = async (proposal: Proposal) => {
    await proposalService.recoverProposal(proposal.id);
    showToast('بازیافت درخواست', `درخواست «${proposal.title}» دوباره برای بررسی مدیرعامل ارسال شد.`, 'info');
    triggerRefresh();
  };

  const officeProposals = proposals.filter((p) => p.proposerName === currentUser.fullName || isOfficeManager);
  const ceoQueue = proposals.filter((p) => p.status === 'PENDING_CEO_REVIEW');

  const visibleTabs: { id: ProposalTab; label: string; count: number; icon: React.ElementType }[] = [
    ...(isOfficeManager ? [{ id: 'OFFICE' as ProposalTab, label: 'ثبت و پیگیری درخواست‌ها', count: officeProposals.length, icon: Lightbulb }] : []),
    ...(isCeo ? [{ id: 'CEO' as ProposalTab, label: 'کارتابل مدیرعامل', count: ceoQueue.length, icon: Inbox }] : []),
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <span>درخواست‌های راهبردی</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          ثبت درخواست راهبردی توسط مسئول دفتر، بررسی و تصمیم مدیرعامل، و افزودن موارد تأییدشده به دستور جلسات
        </p>

        {visibleTabs.length > 1 && (
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
        )}
      </div>

      {tab === 'OFFICE' && isOfficeManager && (
        <div className="space-y-4">
          <form onSubmit={handleCreateProposal} className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-3.5">
            <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Plus className="w-4 h-4 text-teal-700" />
              ثبت درخواست راهبردی جدید
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="مثال: برگزاری دوره آموزشی امنیت سایبری" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات *</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none" placeholder="این موضوع چرا باید در جلسه مطرح و درباره آن تصمیم‌گیری شود؟" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer">
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'در حال ارسال...' : 'ارسال به کارتابل مدیرعامل'}</span>
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {officeProposals.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
                هنوز درخواست راهبردی ثبت نشده است.
              </div>
            ) : officeProposals.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusMeta(p.status).bg}`}>{getStatusMeta(p.status).label}</span>
                </div>
                <p className="text-xs text-slate-600">{p.description}</p>
                {p.assignedMeetingTitle && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>افزوده شده به جلسه: {p.assignedMeetingTitle}</span>
                  </div>
                )}
                {p.managementDecisionNotes && <p className="text-[11px] text-slate-500">یادداشت مدیرعامل: {p.managementDecisionNotes}</p>}
                {p.status === 'REJECTED' && (
                  <div className="flex justify-end pt-1">
                    <button onClick={() => handleRecover(p)} className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بازیافت و ارسال مجدد</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'CEO' && isCeo && (
        <div className="space-y-3">
          {ceoQueue.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
              درخواست راهبردی در انتظار بررسی نیست.
            </div>
          ) : ceoQueue.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2.5">
              <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
              <p className="text-xs text-slate-600">{p.description}</p>
              <p className="text-[11px] text-slate-500">پیشنهاددهنده: {p.proposerName}</p>
              <input
                type="text"
                value={decisionNotes[p.id] || ''}
                onChange={(e) => setDecisionNotes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                placeholder="یادداشت تصمیم (اختیاری)"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => handleReview(p, 'APPROVED')} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تایید</span>
                </button>
                <button onClick={() => handleReview(p, 'REJECTED')} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold py-2 px-3.5 rounded-xl cursor-pointer">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>رد</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
