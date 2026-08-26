import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { taskService } from '../../services/taskService';
import { Task } from '../../types';
import { toPersianDigits, getPriorityMeta } from '../../utils/formatters';
import { ResolutionDetailModal } from '../resolutions/ResolutionDetailModal';
import { ListViewActions, ListViewMode } from '../../components/common/ListViewActions';
import { exportListToPdf } from '../../utils/pdfExport';

export const MyTasksView: React.FC = () => {
  const { currentUser, showToast, refreshTrigger } = useApp();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ListViewMode>('cards');

  // Complete task modal state
  const [activeCompletingTask, setActiveCompletingTask] = useState<Task | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [currentUser.id, searchTerm, statusFilter, refreshTrigger]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await taskService.getMyTasks(currentUser.id, {
        searchTerm,
        status: statusFilter,
        pageSize: 50,
      });
      if (res.isSuccess) {
        setTasks(res.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setActiveCompletingTask(task);
    setCompletionNotes('');
  };

  const handleSubmitTaskCompletion = async () => {
    if (!activeCompletingTask) return;
    if (!completionNotes) {
      showToast('خطا', 'لطفاً شرح اقدامات انجام شده را درج فرمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await taskService.submitTaskCompletion(activeCompletingTask.id, completionNotes);
      if (res.isSuccess) {
        showToast(
          'اتمام وظیفه',
          activeCompletingTask.requiresVerification
            ? 'وظیفه تکمیل گردید و به کارتابل صحه‌گذاری ارجاع شد.'
            : 'وظیفه خاتمه یافت.',
          'success'
        );
        setActiveCompletingTask(null);
        fetchTasks();
      }
    } catch (e) {
      showToast('خطا', 'خطا در ثبت اتمام وظیفه', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTaskStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'در حال اقدام', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'PENDING_APPROVAL':
        return { label: 'در انتظار صحه‌گذاری', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'RETURNED':
        return { label: 'عدم تایید / بازگشت به مجری', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CLOSED':
        return { label: 'تایید و خاتمه یافته', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'OVERDUE':
        return { label: 'عقب‌افتاده از موعد', bg: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { label: 'جدید', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const handleExportPdf = () => {
    const opened = exportListToPdf<Task>('لیست وظایف ارجاعی من', tasks, [
      { title: 'شماره مصوبه', value: (item) => item.resolutionNumber },
      { title: 'عنوان وظیفه', value: (item) => item.resolutionTitle },
      { title: 'جلسه', value: (item) => item.meetingTitle },
      { title: 'تاریخ ارجاع', value: (item) => toPersianDigits(item.referralDateJalali) },
      { title: 'مهلت', value: (item) => toPersianDigits(item.deadlineJalali) },
      { title: 'اولویت', value: (item) => getPriorityMeta(item.priority).label },
      { title: 'وضعیت', value: (item) => getTaskStatusBadge(item.status).label },
    ]);
    showToast(opened ? 'خروجی PDF' : 'خطای خروجی', opened ? 'پنجره ذخیره PDF وظایف باز شد.' : 'مرورگر اجازه باز شدن پنجره PDF را نداد.', opened ? 'success' : 'error');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>کارتابل وظایف و تکالیف من</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            تکالیف ارجاع‌شده از مصوبات جلسات به کاربر: <strong className="text-slate-700">{currentUser.fullName}</strong>
          </p>
        </div>
        <ListViewActions filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((value) => !value)} viewMode={viewMode} onViewModeChange={setViewMode} onExportPdf={handleExportPdf} />
      </div>

      {/* Filter toolbar */}
      {filtersOpen && <div className="app-panel bg-white rounded-2xl p-4 shadow-xs border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در عنوان مصوبه یا شماره ارجاع..."
            className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">تمام وظایف</option>
            <option value="IN_PROGRESS">در حال اقدام (In Progress)</option>
            <option value="PENDING_APPROVAL">ارسال‌شده جهت صحه‌گذاری (Pending Approval)</option>
            <option value="RETURNED">بازگشتی به دلیل عدم تایید (Returned)</option>
            <option value="CLOSED">خاتمه یافته (Closed)</option>
          </select>
        </div>
      </div>}

      {/* Tasks List */}
      {viewMode === 'cards' ? <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">هیچ وظیفه فعالی در کارتابل ندارید</h3>
            <p className="text-xs text-slate-400 mt-1">کلیه وظایف ارجاع‌شده انجام شده یا فیلتر جاری نتیجه‌ای ندارد.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const pMeta = getPriorityMeta(task.priority);
            const statusBadge = getTaskStatusBadge(task.status);
            const canComplete = task.status === 'IN_PROGRESS' || task.status === 'RETURNED' || task.status === 'NEW';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedResolutionId(task.resolutionId)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {task.resolutionNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text} border ${pMeta.border}`}>
                      اولویت: {pMeta.label}
                    </span>
                  </div>

                  {canComplete && (
                    <button
                      onClick={(e) => handleOpenCompleteModal(e, task)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>ثبت اتمام وظیفه</span>
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-900 transition-colors">
                  {task.resolutionTitle}
                </h3>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {task.instructions}
                </p>

                {task.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <strong>علت عدم تایید در مرحله صحه‌گذاری قبلی:</strong> {task.rejectionReason}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div>تاریخ ارجاع: {toPersianDigits(task.referralDateJalali)}</div>
                  <div>مهلت اقدام: <strong className="text-slate-700">{toPersianDigits(task.deadlineJalali)}</strong></div>
                  <div>جلسه: {task.meetingTitle}</div>
                  {task.requiresVerification && (
                    <div className="mr-auto text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>نیاز به صحه‌گذاری پس از اتمام</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div> : (
        <div className="app-panel bg-white rounded-2xl border border-slate-100 shadow-xs overflow-x-auto">
          <table className="w-full min-w-[850px] text-xs text-right">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="p-3">شماره</th><th className="p-3">عنوان وظیفه</th><th className="p-3">جلسه</th><th className="p-3">مهلت</th><th className="p-3">اولویت</th><th className="p-3">وضعیت</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => { const status = getTaskStatusBadge(task.status); return <tr key={task.id} onClick={() => setSelectedResolutionId(task.resolutionId)} className="hover:bg-slate-50 cursor-pointer transition-colors"><td className="p-3 font-bold text-blue-700">{task.resolutionNumber}</td><td className="p-3 font-bold text-slate-800">{task.resolutionTitle}</td><td className="p-3 text-slate-600">{task.meetingTitle}</td><td className="p-3">{toPersianDigits(task.deadlineJalali)}</td><td className="p-3">{getPriorityMeta(task.priority).label}</td><td className="p-3"><span className={`px-2 py-1 rounded-full border font-bold ${status.bg}`}>{status.label}</span></td></tr>; })}
            </tbody>
          </table>
        </div>
      )}

      {/* Completion Modal */}
      {activeCompletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              ثبت گزارش اتمام وظیفه: {activeCompletingTask.resolutionNumber}
            </h3>

            <p className="text-xs text-slate-600">
              لطفاً شرح اقدامات، دستاوردها و نتیجه اجرای این تکلیف سازمانی را وارد فرمایید:
            </p>

            <textarea
              rows={4}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="مثال: پیاده‌سازی زیرساخت تکمیل گردید، تست‌های امنیتی اخذ شد و گزارش به پیوست ضمیمه گردید..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveCompletingTask(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSubmitTaskCompletion}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'در حال ثبت...' : 'تایید و ارسال'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Detail Modal */}
      <ResolutionDetailModal
        resolutionId={selectedResolutionId}
        onClose={() => setSelectedResolutionId(null)}
      />
    </div>
  );
};
