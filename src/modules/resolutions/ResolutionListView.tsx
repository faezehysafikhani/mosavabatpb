import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Search, 
  Filter, 
  Plus, 
  FileDown, 
  ShieldCheck, 
  Clock, 
  User, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { resolutionService } from '../../services/resolutionService';
import { Resolution, ResolutionExecutionStatus } from '../../types';
import { toPersianDigits, getResolutionApprovalMeta, getResolutionExecutionMeta, getPriorityMeta } from '../../utils/formatters';
import { mockDepartments } from '../../mock/data';
import { CreateResolutionModal } from './CreateResolutionModal';
import { ResolutionDetailModal } from './ResolutionDetailModal';

export const ResolutionListView: React.FC = () => {
  const { showToast, refreshTrigger, selectedResolutionId, setSelectedResolutionId } = useApp();

  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [executionFilter, setExecutionFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeModalResId, setActiveModalResId] = useState<string | null>(null);

  useEffect(() => {
    fetchResolutions();
  }, [searchTerm, executionFilter, departmentFilter, refreshTrigger]);

  const fetchResolutions = async () => {
    setLoading(true);
    try {
      const res = await resolutionService.getResolutions({
        searchTerm,
        executionStatus: executionFilter,
        departmentId: departmentFilter,
        pageSize: 50,
      });
      if (res.isSuccess) {
        setResolutions(res.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    showToast('خروجی اکسل', 'فایل اکسل جامع مصوبات سازمان آماده دریافت شد.', 'info');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <span>بانک مصوبات سازمانی و فرآیند صحه‌گذاری</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            پیگیری وضعیت اجرا، مهلت‌های اقدام، ارجاعات و مراحل صحه‌گذاری تاییدات
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت مصوبه جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در موضوع، شماره مصوبه، نام مسئول..."
            className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
        </div>

        <div>
          <select
            value={executionFilter}
            onChange={(e) => setExecutionFilter(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">تمام وضعیت‌های اجرایی</option>
            <option value="IN_PROGRESS">در حال انجام (In Progress)</option>
            <option value="PENDING_APPROVAL">در انتظار صحه‌گذاری (Pending Verification)</option>
            <option value="APPROVED_CLOSED">خاتمه یافته و تایید شده (Closed)</option>
            <option value="REJECTED_RETURNED">عدم تایید در صحه‌گذاری / برگشتی</option>
            <option value="OVERDUE">عقب‌افتاده از موعد (Overdue)</option>
          </select>
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-700"
          >
            <option value="ALL">همه واحدهای سازمانی</option>
            {mockDepartments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resolutions Grid */}
      <div className="space-y-3">
        {resolutions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-xs">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">هیچ مصوبه‌ای یافت نشد</h3>
            <p className="text-xs text-slate-400 mt-1">با معیارهای فیلتر فعلی موردی وجود ندارد.</p>
          </div>
        ) : (
          resolutions.map((res) => {
            const sMeta = getResolutionExecutionMeta(res.executionStatus);
            const pMeta = getPriorityMeta(res.priority);
            const aMeta = getResolutionApprovalMeta(res.approvalStatus);

            return (
              <div
                key={res.id}
                onClick={() => setActiveModalResId(res.id)}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {res.resolutionNumber}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sMeta.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sMeta.dot}`}></span>
                      <span>{sMeta.label}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text} border ${pMeta.border}`}>
                      {pMeta.label}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                    <Eye className="w-4 h-4" />
                    <span>بررسی پرونده و صحه‌گذاری</span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1.5 group-hover:text-blue-900 transition-colors">
                  {res.topicTitle}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                  {res.executionDescription || res.requestDescription}
                </p>

                {/* Footer metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>مسئول: <strong className="text-slate-700">{res.mainResponsibleName || 'نامشخص'}</strong> ({res.responsibleDepartmentName})</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>مهلت اقدام: <strong className="text-slate-700">{toPersianDigits(res.deadlineJalali || '—')}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    مرجع: {res.meetingTitle} ({res.meetingNumber})
                  </div>

                  {res.verificationConfig?.requiresVerification && (
                    <div className="mr-auto text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{toPersianDigits(res.verificationConfig.steps.length)} مرحله صحه‌گذاری</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Resolution Modal */}
      <CreateResolutionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Detail & Action Modal */}
      <ResolutionDetailModal
        resolutionId={activeModalResId}
        onClose={() => setActiveModalResId(null)}
      />
    </div>
  );
};
