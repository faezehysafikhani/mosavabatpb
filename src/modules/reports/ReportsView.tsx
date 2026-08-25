import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileDown, 
  Printer, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { reportService } from '../../services/reportService';
import { DepartmentPerformance, DashboardKPIs } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export const ReportsView: React.FC = () => {
  const { showToast } = useApp();
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-700" />
            <span>گزارش جامع عملکرد و تحلیلی مصوبات</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            ارزیابی نرخ تحقق مصوبات، عملکرد واحدهای تابعه و تحلیل فصلی جلسات
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ گزارش</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>خروجی فایل اکسل</span>
          </button>
        </div>
      </div>

      {/* Monthly Trend Line Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <TrendingUp className="w-4 h-4 text-teal-700" />
          <span>روند ماهانه تشکیل جلسات و تحقق مصوبات سازمانی</span>
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [toPersianDigits(Number(val)), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="resolutionsCount" name="تعداد مصوبات صادره" stroke="#3b82f6" strokeWidth={3} />
              <Line type="monotone" dataKey="completedResolutionsCount" name="مصوبات خاتمه‌یافته" stroke="#10b981" strokeWidth={3} />
              <Line type="monotone" dataKey="meetingsCount" name="تعداد جلسات" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-extrabold text-slate-800">ماتریس عملکرد واحدهای سازمانی در اجرای مصوبات</h3>
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
                <tr key={dept.departmentName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-bold text-slate-800">{dept.departmentName}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">{toPersianDigits(dept.totalAssigned)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{toPersianDigits(dept.completed)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-blue-600">{toPersianDigits(dept.inProgress)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-purple-600">{toPersianDigits(dept.pendingApproval)}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-rose-600">{toPersianDigits(dept.overdue)}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${dept.completionRatePercent}%`,
                            backgroundColor: dept.completionRatePercent >= 70 ? '#10b981' : dept.completionRatePercent >= 40 ? '#3b82f6' : '#f59e0b',
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
    </div>
  );
};
