import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Check, 
  Clock, 
  User, 
  FileText,
  Calendar,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { approvalService } from '../../services/approvalService';
import { ApprovalCartableItem } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { ResolutionDetailModal } from '../resolutions/ResolutionDetailModal';

export const ApprovalsView: React.FC = () => {
  const { currentUser, showToast, refreshTrigger } = useApp();

  const [approvals, setApprovals] = useState<ApprovalCartableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null);

  // Approval/Rejection action state
  const [activeItem, setActiveItem] = useState<ApprovalCartableItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [currentUser.id, searchTerm, statusFilter, refreshTrigger]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await approvalService.getMyApprovals(currentUser.id, {
        searchTerm,
        status: statusFilter,
        pageSize: 50,
      });
      if (res.isSuccess) {
        setApprovals(res.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (e: React.MouseEvent, item: ApprovalCartableItem, type: 'APPROVE' | 'REJECT') => {
    e.stopPropagation();
    setActiveItem(item);
    setActionType(type);
    setCommentText('');
  };

  const handleConfirmAction = async () => {
    if (!activeItem) return;
    if (actionType === 'REJECT' && !commentText) {
      showToast('خطا', 'جهت عدم تایید و بازگشت به مجری، ذکر علت الزامی است.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        const res = await approvalService.approveItem(activeItem.id, commentText || 'تایید شد.', currentUser.fullName);
        if (res.isSuccess) {
          showToast('تایید موفق', `مرحله صحه‌گذاری با موفقیت تایید شد.`, 'success');
        }
      } else {
        const res = await approvalService.rejectItem(activeItem.id, commentText, currentUser.fullName);
        if (res.isSuccess) {
          showToast('عدم تایید', `مصوبه به مجری بازگردانده شد.`, 'warning');
        }
      }
      setActiveItem(null);
      fetchApprovals();
    } catch (e) {
      showToast('خطا', 'خطا در ثبت اقدام صحه‌گذاری', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-700" />
            <span>کارتابل صحه‌گذاری و تأییدات مصوبات</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            بررسی گزارش‌های اتمام اقدام مجریان و اعلام نظر تایید یا بازگشت جهت اصلاح
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در عنوان، شماره مصوبه یا نام مجری..."
            className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
          >
            <option value="ALL">تمام موارد صحه‌گذاری</option>
            <option value="PENDING">در انتظار بررسی من (Pending)</option>
            <option value="APPROVED">تایید شده توسط من (Approved)</option>
            <option value="REJECTED">عدم تایید و بازگردانده شده (Rejected)</option>
          </select>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <ShieldCheck className="w-12 h-12 text-purple-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">هیچ موردی در انتظار صحه‌گذاری شما نیست</h3>
            <p className="text-xs text-slate-400 mt-1">کلیه گزارش‌های تکمیلی بررسی شده‌اند.</p>
          </div>
        ) : (
          approvals.map((appr) => {
            const isPending = appr.status === 'PENDING';

            return (
              <div
                key={appr.id}
                onClick={() => setSelectedResolutionId(appr.resolutionId)}
                className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 hover:border-purple-400 transition-all cursor-pointer space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-purple-900 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                      {appr.resolutionNumber}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      مرحله {toPersianDigits(appr.stepNumber)} از {toPersianDigits(appr.totalSteps)}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isPending
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : appr.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {isPending ? 'نیازمند بررسی و صحه‌گذاری' : appr.status === 'APPROVED' ? 'تایید شده' : 'عدم تایید'}
                    </span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleOpenActionModal(e, appr, 'REJECT')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>رد / بازگشت</span>
                      </button>

                      <button
                        onClick={(e) => handleOpenActionModal(e, appr, 'APPROVE')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید صحه‌گذاری</span>
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-extrabold text-slate-800">
                  {appr.resolutionTitle}
                </h3>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <strong>مجری:</strong> {appr.responsibleName} ({appr.responsibleDepartment})
                    </div>
                    <div className="text-[11px] text-slate-400">
                      تاریخ ارسال: {toPersianDigits(appr.submittedForApprovalDateJalali)}
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="font-bold text-purple-900 block mb-0.5">گزارش اتمام کار ثبت شده:</span>
                    {appr.completionReport}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                  <span>مرجع: {appr.meetingTitle}</span>
                  <span>•</span>
                  <span>کلیک جهت مشاهده پرونده کامل مصوبه و مستندات</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800">
                {actionType === 'APPROVE' ? 'تایید مرحله صحه‌گذاری' : 'عدم تایید و بازگشت به مجری'}
              </h3>
              <button onClick={() => setActiveItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>مصوبه:</strong> {activeItem.resolutionTitle}</div>
              <div><strong>مجری:</strong> {activeItem.responsibleName}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {actionType === 'APPROVE' ? 'توضیحات و ملاحظات تایید (اختیاری):' : 'علت عدم تایید و موارد نیازمند اصلاح (الزامی):'}
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={actionType === 'APPROVE' ? 'مورد تایید است.' : 'علت بازگشت را شرح دهید...'}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSubmitting ? 'در حال ثبت...' : actionType === 'APPROVE' ? 'تایید نهایی' : 'ثبت عدم تایید'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Dossier Modal */}
      <ResolutionDetailModal
        resolutionId={selectedResolutionId}
        onClose={() => setSelectedResolutionId(null)}
      />
    </div>
  );
};
