import React, { useEffect, useState } from 'react';
import {
  Lightbulb, Plus, Calendar, CheckCircle2, XCircle, Inbox, RotateCcw, FileCheck2, X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { proposalService } from '../../services/proposalService';
import { Proposal, ProposalStatus } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { CreateProposalModal } from './CreateProposalModal';

type ProposalTab = 'OFFICE' | 'CEO' | 'MINE';
type OfficeStatusFilter = 'PENDING_OFFICE_REVIEW' | 'APPROVED' | 'CONFIRMED_FOR_MEETING' | 'CONVERTED_TO_AGENDA' | 'REJECTED' | 'ALL';

const STATUS_META: Record<ProposalStatus, { label: string; bg: string }> = {
  PENDING_OFFICE_REVIEW: { label: 'در انتظار بررسی مسئول دفتر', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  PENDING_CEO_REVIEW: { label: 'در انتظار بررسی مدیرعامل', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  REJECTED: { label: 'رد شده', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  APPROVED: { label: 'تایید جلسات تایید نشده', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONFIRMED_FOR_MEETING: { label: 'تایید جلسه شده', bg: 'bg-violet-50 text-violet-700 border-violet-200' },
  CONVERTED_TO_AGENDA: { label: 'تبدیل شده به بند دستور جلسه', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const DEFAULT_STATUS_META = { label: 'نامشخص', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
const getStatusMeta = (status: ProposalStatus) => STATUS_META[status] || DEFAULT_STATUS_META;

const OFFICE_FILTERS: { id: OfficeStatusFilter; label: string }[] = [
  { id: 'PENDING_OFFICE_REVIEW', label: 'در انتظار بررسی من' },
  { id: 'APPROVED', label: 'تایید جلسات تایید نشده' },
  { id: 'CONFIRMED_FOR_MEETING', label: 'تایید جلسه شده' },
  { id: 'CONVERTED_TO_AGENDA', label: 'تبدیل شده به جلسه' },
  { id: 'REJECTED', label: 'رد شده' },
  { id: 'ALL', label: 'همه موارد' },
];

export const ProposalsView: React.FC = () => {
  const { currentUser, availableUsers, showToast, refreshTrigger, triggerRefresh } = useApp();

  const isOfficeManager = currentUser.role === 'ADMIN' || currentUser.role === 'SECRETARY';
  const isCeo = currentUser.role === 'ADMIN' || currentUser.role === 'CEO';
  const isRegularUser = !isOfficeManager && !isCeo;

  const [tab, setTab] = useState<ProposalTab>(isOfficeManager ? 'OFFICE' : isCeo ? 'CEO' : 'MINE');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [officeFilter, setOfficeFilter] = useState<OfficeStatusFilter>('PENDING_OFFICE_REVIEW');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [confirmingProposal, setConfirmingProposal] = useState<Proposal | null>(null);
  const [presenterId, setPresenterId] = useState('');

  useEffect(() => {
    fetchAll();
  }, [refreshTrigger]);

  const fetchAll = async () => {
    const res = await proposalService.getProposals({ pageSize: 200 });
    if (res.isSuccess) setProposals(res.data.items);
  };

  const handleReview = async (proposal: Proposal, decision: 'APPROVED' | 'REJECTED') => {
    await proposalService.reviewProposal(proposal.id, decision, decisionNotes[proposal.id]);
    showToast(
      decision === 'APPROVED' ? 'تایید مصوبه پیشنهادی' : 'رد مصوبه پیشنهادی',
      decision === 'APPROVED'
        ? `«${proposal.title}» تایید شد و به کارتابل مسئول دفتر بازگشت.`
        : `«${proposal.title}» رد شد.`,
      decision === 'APPROVED' ? 'success' : 'warning'
    );
    setDecisionNotes((prev) => ({ ...prev, [proposal.id]: '' }));
    triggerRefresh();
  };

  const handleForwardToCeo = async (proposal: Proposal) => {
    await proposalService.forwardToCeo(proposal.id);
    showToast('ارسال برای مدیرعامل', `«${proposal.title}» برای بررسی مدیرعامل ارسال شد.`, 'success');
    triggerRefresh();
  };

  const handleRecover = async (proposal: Proposal) => {
    await proposalService.recoverProposal(proposal.id);
    showToast('بازیافت', `«${proposal.title}» دوباره برای بررسی مدیرعامل ارسال شد.`, 'info');
    triggerRefresh();
  };

  const handleOpenConfirm = (proposal: Proposal) => {
    setConfirmingProposal(proposal);
    setPresenterId('');
  };

  const handleConfirmForMeeting = async () => {
    if (!confirmingProposal) return;
    const presenter = availableUsers.find((u) => u.id === presenterId);
    if (!presenter) {
      showToast('خطا', 'انتخاب ارائه‌دهنده الزامی است.', 'error');
      return;
    }
    await proposalService.confirmForMeeting(confirmingProposal.id, presenter.id, presenter.fullName);
    showToast('تایید جلسه', `«${confirmingProposal.title}» به تایید جلسه تبدیل شد.`, 'success');
    setConfirmingProposal(null);
    triggerRefresh();
  };

  const ceoQueue = proposals.filter((p) => p.status === 'PENDING_CEO_REVIEW');
  const officeItems = proposals.filter((p) => officeFilter === 'ALL' || p.status === officeFilter);
  const myProposals = proposals.filter((p) => p.proposerUserId === currentUser.id);

  const visibleTabs: { id: ProposalTab; label: string; count: number; icon: React.ElementType }[] = [
    ...(isOfficeManager ? [{ id: 'OFFICE' as ProposalTab, label: 'مسئول دفتر', count: proposals.filter((p) => p.status === 'PENDING_OFFICE_REVIEW' || p.status === 'APPROVED').length, icon: Lightbulb }] : []),
    ...(isCeo ? [{ id: 'CEO' as ProposalTab, label: 'کارتابل مدیرعامل', count: ceoQueue.length, icon: Inbox }] : []),
    ...(isRegularUser ? [{ id: 'MINE' as ProposalTab, label: 'مصوبات پیشنهادی من', count: myProposals.length, icon: Lightbulb }] : []),
  ];

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <span>مصوبات پیشنهادی</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          ثبت مصوبه پیشنهادی توسط کارکنان و مسئول دفتر، بررسی مسئول دفتر و مدیرعامل، و تبدیل موارد تأییدشده به تایید جلسه
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
        <div className="bg-white rounded-2xl shadow-xs border border-slate-100">
          <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
            <select
              value={officeFilter}
              onChange={(e) => setOfficeFilter(e.target.value as OfficeStatusFilter)}
              className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-slate-700"
            >
              {OFFICE_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت مصوبه پیشنهادی جدید</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">عنوان</th>
                  <th className="py-2.5 px-3 font-semibold">ارائه‌دهنده</th>
                  <th className="py-2.5 px-3 font-semibold">تاریخ و ساعت تبدیل</th>
                  <th className="py-2.5 px-3 font-semibold">وضعیت</th>
                  <th className="py-2.5 px-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officeItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">موردی یافت نشد</td></tr>
                ) : officeItems.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{p.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</div>
                      {p.assignedMeetingTitle && <div className="text-[10px] text-emerald-700 mt-0.5">جلسه: {p.assignedMeetingTitle}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{p.confirmedPresenterName || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.confirmedDateJalali ? `${toPersianDigits(p.confirmedDateJalali)} - ${toPersianDigits(p.confirmedTimeString || '')}` : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusMeta(p.status).bg}`}>{getStatusMeta(p.status).label}</span>
                    </td>
                    <td className="py-3 px-3">
                      {p.status === 'PENDING_OFFICE_REVIEW' && (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleForwardToCeo(p)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ارسال برای مدیرعامل</span>
                          </button>
                          <button onClick={() => handleReview(p, 'REJECTED')} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>رد</span>
                          </button>
                        </div>
                      )}
                      {p.status === 'APPROVED' && (
                        <button onClick={() => handleOpenConfirm(p)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>تبدیل به تایید جلسه</span>
                        </button>
                      )}
                      {p.status === 'REJECTED' && (
                        <button onClick={() => handleRecover(p)} className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[11px] font-bold py-1.5 px-3 rounded-xl cursor-pointer">
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>بازیافت</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'CEO' && isCeo && (
        <div className="space-y-3">
          {ceoQueue.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
              مصوبه پیشنهادی در انتظار بررسی نیست.
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

      {tab === 'MINE' && isRegularUser && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت مصوبه پیشنهادی جدید</span>
            </button>
          </div>

          {myProposals.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xs text-xs text-slate-400">
              هنوز مصوبه پیشنهادی ثبت نکرده‌اید.
            </div>
          ) : myProposals.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-slate-800">{p.title}</h4>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${getStatusMeta(p.status).bg}`}>{getStatusMeta(p.status).label}</span>
              </div>
              <p className="text-xs text-slate-600">{p.description}</p>
              {p.managementDecisionNotes && (
                <p className="text-[11px] text-slate-500">یادداشت تصمیم: {p.managementDecisionNotes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateProposalModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Confirm-for-meeting modal: pick the presenter */}
      {confirmingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                تبدیل به تایید جلسه
              </h3>
              <button onClick={() => setConfirmingProposal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-slate-600">{confirmingProposal.title}</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ارائه‌دهنده *</label>
              <select value={presenterId} onChange={(e) => setPresenterId(e.target.value)} className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">انتخاب ارائه‌دهنده...</option>
                {availableUsers.map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.title})</option>)}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button onClick={() => setConfirmingProposal(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer">انصراف</button>
              <button onClick={handleConfirmForMeeting} className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs cursor-pointer">تایید</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
