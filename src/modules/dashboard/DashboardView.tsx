import React, { useState, useEffect } from 'react';
import { 
  FileDown, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  BarChart2, 
  PieChart as PieIcon,
  Layers, 
  Users, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { reportService, meetingService, resolutionService, taskService, approvalService } from '../../services';
import { DashboardKPIs, Meeting, Resolution, Task, ApprovalCartableItem } from '../../types';
import { toPersianDigits, getResolutionExecutionMeta, getPriorityMeta } from '../../utils/formatters';

export const DashboardView: React.FC = () => {
  const { navigateTo, setIsCreateMeetingOpen, setIsAiAssistantOpen, showToast, currentUser, refreshTrigger } = useApp();

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);
  const [recentResolutions, setRecentResolutions] = useState<Resolution[]>([]);
  const [urgentTasks, setUrgentTasks] = useState<Task[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalCartableItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Chart view toggles (Pie vs Bar) matching screenshot
  const [chart1Mode, setChart1Mode] = useState<'donut' | 'bar'>('donut');
  const [chart2Mode, setChart2Mode] = useState<'bar' | 'donut'>('bar');
  const [chart3Mode, setChart3Mode] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    loadDashboardData();
  }, [currentUser.id, refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, meetingsRes, resRes, taskRes, apprRes] = await Promise.all([
        reportService.getDashboardKPIs(currentUser.id),
        meetingService.getMeetings({ pageSize: 5, participantUserId: currentUser.id }),
        resolutionService.getResolutions({ pageSize: 6, relatedUserId: currentUser.id }),
        taskService.getMyTasks(currentUser.id, { pageSize: 4, status: 'IN_PROGRESS' }),
        approvalService.getMyApprovals(currentUser.id, { pageSize: 4, status: 'PENDING' }),
      ]);

      if (kpiRes.isSuccess) setKpis(kpiRes.data);
      if (meetingsRes.isSuccess) setRecentMeetings(meetingsRes.data.items);
      if (resRes.isSuccess) setRecentResolutions(resRes.data.items);
      if (taskRes.isSuccess) setUrgentTasks(taskRes.data.items);
      if (apprRes.isSuccess) setPendingApprovals(apprRes.data.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = () => {
    showToast('خروجی PDF', 'در حال آماده‌سازی گزارش داشبورد جهت چاپ...', 'info');
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Status chart data matching Capture.PNG
  const statusData = [
    { name: 'در حال انجام', value: kpis?.inProgressResolutions ?? 0, color: '#2563eb' },
    { name: 'برنامه‌ریزی / شروع نشده', value: kpis ? Math.max(0, kpis.totalResolutions - kpis.inProgressResolutions - kpis.pendingApprovalResolutions - kpis.completedClosedResolutions - kpis.overdueResolutions) : 0, color: '#f59e0b' },
    { name: 'در انتظار صحه‌گذاری', value: kpis?.pendingApprovalResolutions ?? 0, color: '#a855f7' },
    { name: 'خاتمه یافته', value: kpis?.completedClosedResolutions ?? 0, color: '#10b981' },
  ];

  // Department ownership data matching Capture.PNG horizontal bars
  const departmentData = [
    { name: 'واحد فناوری اطلاعات', count: 7, color: '#10b981', percent: 70 },
    { name: 'معاونت برنامه‌ریزی', count: 5, color: '#3b82f6', percent: 50 },
    { name: 'مدیریت منابع انسانی', count: 3, color: '#f59e0b', percent: 30 },
    { name: 'اداره امور مالی', count: 2, color: '#a855f7', percent: 20 },
  ];

  // Proposer / Manager distribution matching Capture.PNG
  const managerData = [
    { name: 'مهندس حسینی (IT)', value: 7, color: '#10b981' },
    { name: 'دکتر احمدی (برنامه‌ریزی)', value: 6, color: '#3b82f6' },
    { name: 'مهندس مرادی (HR)', value: 2, color: '#ec4899' },
    { name: 'دکتر رستمی (ریاست)', value: 1, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar with Filter and PDF Export */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-slate-800 tracking-tight">داشبورد من</h1>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">| پیشخوان پایش مصوبات و جلسات سازمانی</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>خروجی PDF</span>
          </button>

          <button
            onClick={() => showToast('فیلترها', 'فیلترهای پیشرفته فعال هستند.', 'info')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-full border border-slate-200 transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>فیلترها</span>
          </button>

          <button
            onClick={() => setIsCreateMeetingOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>جلسه جدید</span>
          </button>
        </div>
      </div>

      {/* Row 1: 4 Large Metric KPI Cards matching Clean Minimalism Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Meetings */}
        <div 
          onClick={() => navigateTo('meetings')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium">تعداد کل جلسات</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {toPersianDigits(kpis?.totalMeetings ?? 0)}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              فعال
            </span>
          </div>
        </div>

        {/* Card 2: Total Resolutions */}
        <div 
          onClick={() => navigateTo('resolutions')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium">تعداد کل مصوبات</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {toPersianDigits(kpis?.totalResolutions ?? 0)}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              ثبت‌شده
            </span>
          </div>
        </div>

        {/* Card 3: In Progress Resolutions */}
        <div 
          onClick={() => navigateTo('resolutions')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium">مصوبات در حال اجرا</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {toPersianDigits(kpis?.inProgressResolutions ?? 0)}
            </div>
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              در جریان
            </span>
          </div>
        </div>

        {/* Card 4: My Active Tasks */}
        <div 
          onClick={() => navigateTo('tasks')}
          className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-slate-200 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-500 font-medium">اقدامات من</span>
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {toPersianDigits(kpis?.myPendingTasksCount ?? 0)}
            </div>
            <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              اقدام فوری
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Visual Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Chart 1: Status Distribution Donut */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="text-xs font-bold text-slate-800">مصوبات بر اساس وضعیت</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full text-[10px]">
              <button
                onClick={() => setChart1Mode('donut')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart1Mode === 'donut' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                دایره‌ای
              </button>
              <button
                onClick={() => setChart1Mode('bar')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart1Mode === 'bar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                میله‌ای
              </button>
            </div>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {chart1Mode === 'donut' ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val) => [toPersianDigits(Number(val)), 'تعداد']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [toPersianDigits(Number(val)), 'تعداد']} />
                  <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {/* Center label for donut */}
            {chart1Mode === 'donut' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{toPersianDigits(16)}</span>
                <span className="text-[10px] text-slate-400 font-medium">مجموع</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>در حال انجام: {toPersianDigits(11)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>برنامه‌ریزی: {toPersianDigits(5)}</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Department Owner Horizontal Bars */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="text-xs font-bold text-slate-800">مصوبات بر اساس واحد مالک</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full text-[10px]">
              <button
                onClick={() => setChart2Mode('bar')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart2Mode === 'bar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                میله‌ای
              </button>
              <button
                onClick={() => setChart2Mode('donut')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart2Mode === 'donut' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                دایره‌ای
              </button>
            </div>
          </div>

          <div className="py-2 space-y-4">
            {departmentData.map((dept) => (
              <div key={dept.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{dept.name}</span>
                  <span className="font-bold text-slate-900">{toPersianDigits(dept.count)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${dept.percent}%`, backgroundColor: dept.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400">
            بیشترین تمرکز مصوبات روی اداره کل فناوری اطلاعات است
          </div>
        </div>

        {/* Chart 3: Proposer / Lead Pie */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <span className="text-xs font-bold text-slate-800">مصوبات بر اساس مدیر واحد</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full text-[10px]">
              <button
                onClick={() => setChart3Mode('pie')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart3Mode === 'pie' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                دایره‌ای
              </button>
              <button
                onClick={() => setChart3Mode('bar')}
                className={`px-2.5 py-0.5 rounded-full font-bold transition-all ${
                  chart3Mode === 'bar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                میله‌ای
              </button>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={managerData}
                  outerRadius={75}
                  dataKey="value"
                >
                  {managerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [toPersianDigits(Number(val)), 'تعداد']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-slate-600">
            {managerData.map((m) => (
              <div key={m.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                <span>{m.name}: {toPersianDigits(m.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Actionable Cartable Items (Immediate user attention) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Pending Verification Approvals */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">موارد در انتظار صحه‌گذاری من</h3>
            </div>
            <button 
              onClick={() => navigateTo('approvals')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده کارتابل</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">موردی در انتظار تایید شما نیست.</div>
          ) : (
            <div className="space-y-2.5">
              {pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  onClick={() => navigateTo('approvals')}
                  className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1">{appr.resolutionTitle}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      مسئول: {appr.responsibleName} ({appr.responsibleDepartment})
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                    نیازمند صحه‌گذاری
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Active Tasks */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">وظایف ارجاع‌شده به من</h3>
            </div>
            <button 
              onClick={() => navigateTo('tasks')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>کارتابل وظایف</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentTasks.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">هیچ وظیفه فعالی ندارید.</div>
          ) : (
            <div className="space-y-2.5">
              {urgentTasks.map((t) => {
                const pMeta = getPriorityMeta(t.priority);
                return (
                  <div
                    key={t.id}
                    onClick={() => navigateTo('tasks')}
                    className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-100 transition-all cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{t.resolutionTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        مهلت: {toPersianDigits(t.deadlineJalali)} | اولویت: {pMeta.label}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${pMeta.bg} ${pMeta.text} border ${pMeta.border}`}>
                      {pMeta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Waterfall Table matching Capture.PNG */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">مصوبات و پروژه‌های جاری سازمان</h3>
          </div>
          <button 
            onClick={() => navigateTo('resolutions')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
          >
            مشاهده همه مصوبات
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[11px]">
                <th className="py-2.5 px-3 font-semibold">ردیف</th>
                <th className="py-2.5 px-3 font-semibold">نام پروژه / عنوان مصوبه</th>
                <th className="py-2.5 px-3 font-semibold">واحد مسئول</th>
                <th className="py-2.5 px-3 font-semibold">تاریخ شروع</th>
                <th className="py-2.5 px-3 font-semibold">تاریخ پایان</th>
                <th className="py-2.5 px-3 font-semibold">وضعیت</th>
                <th className="py-2.5 px-3 font-semibold text-center">پیشرفت برنامه‌ای</th>
                <th className="py-2.5 px-3 font-semibold text-center">پیشرفت واقعی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentResolutions.map((res, index) => {
                const sMeta = getResolutionExecutionMeta(res.executionStatus);
                const planned = 100;
                const actual = res.executionStatus === 'APPROVED_CLOSED' ? 100 : res.executionStatus === 'PENDING_APPROVAL' ? 90 : 45;

                return (
                  <tr 
                    key={res.id} 
                    onClick={() => navigateTo('resolutions')}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 font-bold text-slate-600">{toPersianDigits(index + 1)}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{res.topicTitle}</div>
                      <div className="text-[10px] text-slate-400">{res.resolutionNumber} - {res.meetingTitle}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {res.responsibleDepartmentName || 'اداره کل فناوری اطلاعات'}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{toPersianDigits(res.assignedDateJalali || '۱۴۰۳/۰۶/۱۰')}</td>
                    <td className="py-3 px-3 text-slate-500">{toPersianDigits(res.deadlineJalali || '۱۴۰۳/۰۷/۱۵')}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${sMeta.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sMeta.dot}`}></span>
                        <span>{sMeta.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${planned}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">{toPersianDigits(planned)}٪</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${actual}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700">{toPersianDigits(actual)}٪</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
