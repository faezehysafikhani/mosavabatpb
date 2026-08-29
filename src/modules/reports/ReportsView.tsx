import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileDown,
  Printer,
  TrendingUp,
  Building2,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { reportService } from '../../services/reportService';
import { resolutionService } from '../../services/resolutionService';
import { mockDepartments } from '../../mock/data';
import { DepartmentPerformance, DashboardKPIs, Resolution } from '../../types';
import { toPersianDigits, getResolutionExecutionMeta } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useApp();
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDept, setDetailDept] = useState<DepartmentPerformance | null>(null);
  const [detailResolutions, setDetailResolutions] = useState<Resolution[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [deptRes, kpiRes, trendRes] = await Promise.all([
        reportService.getDepartmentPerformances(),
        reportService.getDashboardKPIs(),
        reportService.getMonthlyTrends(),
      ]);

      if (deptRes.isSuccess) setDepartments(deptRes.data);
      if (kpiRes.isSuccess) setKpis(kpiRes.data);
      if (trendRes.isSuccess) setMonthlyTrends(trendRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    showToast('گزارش عملکرد', 'گزارش جامع آماری در قالب اکسل دانلود شد.', 'info');
  };

  const handleOpenDeptDetail = async (dept: DepartmentPerformance) => {
    setDetailDept(dept);
    setDetailLoading(true);
    try {
      const targetDept = mockDepartments.find((d) => d.name === dept.departmentName);
      const res = await resolutionService.getResolutions({ departmentId: targetDept?.id, pageSize: 100 });
      if (res.isSuccess) setDetailResolutions(res.data.items);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>گزارش جامع عملکرد و تحلیلی مصوبات</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            ارزیابی نرخ تحقق مصوبات، عملکرد واحدهای تابعه و تحلیل فصلی جلسات
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>چاپ گزارش</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>خروجی فایل اکسل</span>
          </button>
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>روند ماهانه تشکیل جلسات و تحقق مصوبات سازمانی</span>
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip formatter={(val) => [toPersianDigits(Number(val)), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="resolutionsCount" name="تعداد مصوبات صادره" stroke="#2563eb" strokeWidth={2.5} />
              <Line type="monotone" dataKey="completedResolutionsCount" name="مصوبات خاتمه‌یافته" stroke="#10b981" strokeWidth={2.5} />
              <Line type="monotone" dataKey="meetingsCount" name="تعداد جلسات" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">ماتریس عملکرد واحدهای سازمانی در اجرای مصوبات</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                <th className="py-3 px-3 font-bold">واحد سازمانی</th>
                <th className="py-3 px-3 font-bold text-center">کل تکالیف ارجاع‌شده</th>
                <th className="py-3 px-3 font-bold text-center">تکمیل و تایید شده</th>
                <th className="py-3 px-3 font-bold text-center">در حال اقدام</th>
                <th className="py-3 px-3 font-bold text-center">در انتظار صحه‌گذاری</th>
                <th className="py-3 px-3 font-bold text-center">عقب‌افتاده</th>
                <th className="py-3 px-3 font-bold text-center w-40">نرخ تحقق (درصد)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <tr key={dept.departmentName} onClick={() => handleOpenDeptDetail(dept)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                  <td className="py-3.5 px-3 font-bold text-slate-800">{dept.departmentName}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">{toPersianDigits(dept.totalAssigned)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{toPersianDigits(dept.completed)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-blue-600">{toPersianDigits(dept.inProgress)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-purple-600">{toPersianDigits(dept.pendingApproval)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-rose-600">{toPersianDigits(dept.overdue)}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${dept.completionRatePercent}%`,
                            backgroundColor: dept.completionRatePercent >= 70 ? '#10b981' : dept.completionRatePercent >= 40 ? '#2563eb' : '#f59e0b',
                          }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 w-9 text-left">
                        {toPersianDigits(dept.completionRatePercent)}٪
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Detail Modal */}
      {detailDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="app-modal-header text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{detailDept.departmentName}</h3>
                  <p className="text-[11px] text-teal-200">جزئیات مصوبات و وظایف این واحد سازمانی</p>
                </div>
              </div>
              <button onClick={() => setDetailDept(null)} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {detailLoading ? (
                <div className="text-center py-8 text-xs text-slate-400">در حال بارگذاری...</div>
              ) : detailResolutions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">مصوبه‌ای برای این واحد ثبت نشده است.</div>
              ) : detailResolutions.map((res) => {
                const meta = getResolutionExecutionMeta(res.executionStatus);
                return (
                  <div key={res.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{res.topicTitle}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.bg}`}>{meta.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      مسئول: {res.mainResponsibleName || 'تعیین نشده'} — مهلت: {toPersianDigits(res.deadlineJalali || '—')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
