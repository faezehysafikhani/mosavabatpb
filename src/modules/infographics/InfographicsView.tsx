import React, { useEffect, useState } from 'react';
import {
  PieChart,
  CalendarDays,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ListTodo,
  Lightbulb,
  Users,
  PenTool,
  Rocket,
  Flag,
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  PointElement,
  LineElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { reportService, ResolutionStatusDistribution } from '../../services/reportService';
import { proposalService } from '../../services/proposalService';
import { DashboardKPIs, DepartmentPerformance, ProposalStatus } from '../../types';
import { toPersianDigits } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

ChartJS.register(ArcElement, BarElement, PointElement, LineElement, LinearScale, CategoryScale, Filler, ChartJsTooltip, ChartJsLegend);

// Fixed categorical order (identity, never re-ordered by value) — see the
// dataviz skill's reference palette. Each status below is pinned to one
// slot for its own sake, so the same status always reads as the same color
// across every chart on this page.
const CATEGORICAL = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
  yellow: '#eda100',
  magenta: '#e87ba4',
  green: '#008300',
  violet: '#4a3aa7',
  red: '#e34948',
};
const STATUS = { good: '#0ca30c', warning: '#fab219', serious: '#ec835a', critical: '#d03b3b' };
const MUTED = '#898781';
const INK_SECONDARY = '#52514e';

const PROPOSAL_STATUS_META: Partial<Record<ProposalStatus, { label: string; color: string }>> = {
  PENDING_OFFICE_REVIEW: { label: 'در انتظار مسئول دفتر', color: CATEGORICAL.yellow },
  PENDING_CEO_REVIEW: { label: 'در انتظار مدیرعامل', color: CATEGORICAL.yellow },
  RESUBMITTED: { label: 'اصلاح و ارسال مجدد', color: CATEGORICAL.yellow },
  APPROVED: { label: 'تایید شده', color: CATEGORICAL.blue },
  REJECTED: { label: 'رد شده', color: CATEGORICAL.red },
  RETURNED_FOR_REVISION: { label: 'برگشت جهت اصلاح', color: CATEGORICAL.orange },
  NO_BOARD_REQUIRED: { label: 'عدم نیاز به طرح', color: MUTED },
  CEO_ORDER_ISSUED: { label: 'دستور مستقیم مدیرعامل', color: CATEGORICAL.violet },
  CONFIRMED_FOR_MEETING: { label: 'تایید جلسه شده', color: CATEGORICAL.aqua },
  CONVERTED_TO_AGENDA: { label: 'تبدیل به دستور جلسه', color: CATEGORICAL.green },
};

// Resolution execution states are genuine statuses, not free identities —
// closed/overdue map to the reserved good/critical status colors; the
// remaining, less conclusive states stay on neutral categorical/muted hues.
const RESOLUTION_STATUS_COLOR: Record<string, string> = {
  APPROVED_CLOSED: STATUS.good,
  OVERDUE: STATUS.critical,
  IN_PROGRESS: CATEGORICAL.blue,
  PENDING_APPROVAL: CATEGORICAL.violet,
  NOT_STARTED: MUTED,
};

interface ProposalStatusCount { status: ProposalStatus; label: string; color: string; count: number }

const legendFont = { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', size: 11, weight: 600 as const };
const tooltipFont = { family: 'system-ui, -apple-system, "Segoe UI", sans-serif', size: 12 };

export const InfographicsView: React.FC = () => {
  const { currentUser } = useApp();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [departments, setDepartments] = useState<DepartmentPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<{ month: string; meetingsCount: number; resolutionsCount: number; completedResolutionsCount: number }[]>([]);
  const [resolutionStatusDist, setResolutionStatusDist] = useState<ResolutionStatusDistribution[]>([]);
  const [proposalStatusCounts, setProposalStatusCounts] = useState<ProposalStatusCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [kpiRes, deptRes, trendRes, resDistRes, proposalsRes] = await Promise.all([
          reportService.getDashboardKPIs(currentUser.id),
          reportService.getDepartmentPerformances(),
          reportService.getMonthlyTrends(),
          reportService.getResolutionStatusDistribution(),
          proposalService.getProposals({ pageSize: 1000 }),
        ]);
        if (kpiRes.isSuccess) setKpis(kpiRes.data);
        if (deptRes.isSuccess) setDepartments(deptRes.data.filter((d) => d.totalAssigned > 0).sort((a, b) => b.completionRatePercent - a.completionRatePercent).slice(0, 8));
        if (trendRes.isSuccess) setMonthlyTrends(trendRes.data);
        if (resDistRes.isSuccess) setResolutionStatusDist(resDistRes.data.filter((item) => item.count > 0));

        if (proposalsRes.isSuccess) {
          const counts = new Map<ProposalStatus, number>();
          proposalsRes.data.items.forEach((p) => counts.set(p.status, (counts.get(p.status) || 0) + 1));
          const rows: ProposalStatusCount[] = (Object.keys(PROPOSAL_STATUS_META) as ProposalStatus[])
            .filter((status) => (counts.get(status) || 0) > 0)
            .map((status) => ({ status, count: counts.get(status)!, label: PROPOSAL_STATUS_META[status]!.label, color: PROPOSAL_STATUS_META[status]!.color }));
          setProposalStatusCounts(rows);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser.id]);

  const totalProposals = proposalStatusCounts.reduce((sum, item) => sum + item.count, 0);
  const totalResolutionsInDist = resolutionStatusDist.reduce((sum, item) => sum + item.count, 0);
  const fulfillmentPercent = kpis && kpis.totalResolutions > 0 ? Math.round((kpis.completedClosedResolutions / kpis.totalResolutions) * 100) : 0;

  const statCards = kpis ? [
    { label: 'کل جلسات', value: kpis.totalMeetings, icon: CalendarDays, color: CATEGORICAL.blue },
    { label: 'کل مصوبات', value: kpis.totalResolutions, icon: FileCheck2, color: CATEGORICAL.orange },
    { label: 'در حال اجرا', value: kpis.inProgressResolutions, icon: Loader2, color: CATEGORICAL.aqua },
    { label: 'تکمیل‌شده', value: kpis.completedClosedResolutions, icon: CheckCircle2, color: STATUS.good },
    { label: 'عقب‌افتاده', value: kpis.overdueResolutions, icon: AlertTriangle, color: STATUS.critical },
    { label: 'وظایف من', value: kpis.myPendingTasksCount, icon: ListTodo, color: CATEGORICAL.violet },
  ] : [];

  const pipelineStages = kpis ? [
    { label: 'پیشنهاد مصوبه', value: totalProposals, icon: Lightbulb, color: CATEGORICAL.blue },
    { label: 'جلسه', value: kpis.totalMeetings, icon: Users, color: CATEGORICAL.orange },
    { label: 'مصوبه', value: kpis.totalResolutions, icon: FileCheck2, color: CATEGORICAL.aqua },
    { label: 'در حال اجرا', value: kpis.inProgressResolutions, icon: PenTool, color: CATEGORICAL.yellow },
    { label: 'تکمیل‌شده', value: kpis.completedClosedResolutions, icon: Flag, color: CATEGORICAL.magenta },
  ] : [];

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-600" />
          <span>اینفوگراف سامانه</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          نمای بصری و یک‌نگاه از وضعیت کلی مصوبات، جلسات و اجرای آن‌ها
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-100 shadow-xs text-xs text-slate-400">در حال بارگذاری...</div>
      ) : (
        <>
          {/* Hero stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}1a`, color: card.color }}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="text-xl font-extrabold text-slate-800">{toPersianDigits(card.value)}</div>
                <div className="text-[11px] font-bold text-slate-500">{card.label}</div>
              </div>
            ))}
          </div>

          {/* Fulfillment ring + workflow pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100 flex flex-col items-center justify-center">
              <h3 className="text-xs font-bold text-slate-600 mb-3 self-start">درصد تحقق کلی مصوبات</h3>
              <div className="relative w-40 h-40">
                <Doughnut
                  data={{
                    datasets: [{
                      data: [fulfillmentPercent, 100 - fulfillmentPercent],
                      backgroundColor: [STATUS.good, '#eef0ee'],
                      borderWidth: 0,
                    }],
                  }}
                  options={{ cutout: '78%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, maintainAspectRatio: false }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-slate-800">{toPersianDigits(fulfillmentPercent)}٪</span>
                  <span className="text-[10px] font-bold text-slate-400">تحقق‌یافته</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-5">مسیر گردش‌کار مصوبات</h3>
              <div className="flex items-center overflow-x-auto pb-1">
                {pipelineStages.map((stage, idx) => (
                  <React.Fragment key={stage.label}>
                    <div className="flex flex-col items-center gap-2 shrink-0 px-1">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs" style={{ backgroundColor: stage.color }}>
                        <stage.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-lg font-extrabold text-slate-800">{toPersianDigits(stage.value)}</div>
                      <div className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{stage.label}</div>
                    </div>
                    {idx < pipelineStages.length - 1 && (
                      <div className="flex-1 h-0.5 min-w-[24px] mx-1 mb-6" style={{ backgroundColor: '#e1e0d9' }}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Proposal & resolution status doughnuts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-4">توزیع وضعیت مصوبات پیشنهادی</h3>
              {proposalStatusCounts.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">داده‌ای برای نمایش وجود ندارد.</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-44 h-44 shrink-0">
                    <Doughnut
                      data={{
                        labels: proposalStatusCounts.map((s) => s.label),
                        datasets: [{ data: proposalStatusCounts.map((s) => s.count), backgroundColor: proposalStatusCounts.map((s) => s.color), borderWidth: 2, borderColor: '#ffffff' }],
                      }}
                      options={{
                        cutout: '62%',
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { titleFont: tooltipFont, bodyFont: tooltipFont, callbacks: { label: (ctx) => `${ctx.label}: ${toPersianDigits(ctx.parsed)} (${toPersianDigits(Math.round((ctx.parsed / totalProposals) * 100))}٪)` } },
                        },
                      }}
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    {proposalStatusCounts.map((s) => (
                      <div key={s.status} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>{s.label}</span>
                        <span className="font-bold text-slate-700">{toPersianDigits(s.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-4">توزیع وضعیت اجرای مصوبات</h3>
              {resolutionStatusDist.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">داده‌ای برای نمایش وجود ندارد.</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-44 h-44 shrink-0">
                    <Doughnut
                      data={{
                        labels: resolutionStatusDist.map((s) => s.statusLabel),
                        datasets: [{ data: resolutionStatusDist.map((s) => s.count), backgroundColor: resolutionStatusDist.map((s) => RESOLUTION_STATUS_COLOR[s.statusKey] || MUTED), borderWidth: 2, borderColor: '#ffffff' }],
                      }}
                      options={{
                        cutout: '62%',
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { titleFont: tooltipFont, bodyFont: tooltipFont, callbacks: { label: (ctx) => `${ctx.label}: ${toPersianDigits(ctx.parsed)} (${toPersianDigits(Math.round((ctx.parsed / totalResolutionsInDist) * 100))}٪)` } },
                        },
                      }}
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    {resolutionStatusDist.map((s) => (
                      <div key={s.statusKey} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: RESOLUTION_STATUS_COLOR[s.statusKey] || MUTED }}></span>{s.statusLabel}</span>
                        <span className="font-bold text-slate-700">{toPersianDigits(s.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Department performance bar + monthly trend line */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-4">نرخ تحقق مصوبات به تفکیک واحد سازمانی</h3>
              {departments.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">داده‌ای برای نمایش وجود ندارد.</div>
              ) : (
                <div style={{ height: `${Math.max(220, departments.length * 38)}px` }}>
                  <Bar
                    data={{
                      labels: departments.map((d) => d.departmentName),
                      datasets: [{
                        label: 'نرخ تحقق',
                        data: departments.map((d) => d.completionRatePercent),
                        backgroundColor: CATEGORICAL.blue,
                        borderRadius: 6,
                        barThickness: 16,
                      }],
                    }}
                    options={{
                      indexAxis: 'y' as const,
                      maintainAspectRatio: false,
                      scales: {
                        x: { min: 0, max: 100, ticks: { callback: (v) => `${toPersianDigits(Number(v))}٪`, font: tooltipFont, color: MUTED }, grid: { color: '#e1e0d9' } },
                        y: { ticks: { font: tooltipFont, color: INK_SECONDARY }, grid: { display: false } },
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: { titleFont: tooltipFont, bodyFont: tooltipFont, callbacks: { label: (ctx) => `${toPersianDigits(Number(ctx.parsed.x))}٪ تحقق` } },
                      },
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <h3 className="text-xs font-bold text-slate-600 mb-4">روند ماهانه جلسات و مصوبات</h3>
              {monthlyTrends.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">داده‌ای برای نمایش وجود ندارد.</div>
              ) : (
                <div style={{ height: '260px' }}>
                  <Line
                    data={{
                      labels: monthlyTrends.map((m) => m.month),
                      datasets: [
                        { label: 'جلسات', data: monthlyTrends.map((m) => m.meetingsCount), borderColor: CATEGORICAL.blue, backgroundColor: `${CATEGORICAL.blue}22`, fill: true, tension: 0.35, pointRadius: 3 },
                        { label: 'مصوبات صادره', data: monthlyTrends.map((m) => m.resolutionsCount), borderColor: CATEGORICAL.orange, backgroundColor: `${CATEGORICAL.orange}22`, fill: true, tension: 0.35, pointRadius: 3 },
                        { label: 'مصوبات خاتمه‌یافته', data: monthlyTrends.map((m) => m.completedResolutionsCount), borderColor: STATUS.good, backgroundColor: `${STATUS.good}22`, fill: true, tension: 0.35, pointRadius: 3 },
                      ],
                    }}
                    options={{
                      maintainAspectRatio: false,
                      interaction: { mode: 'index' as const, intersect: false },
                      scales: {
                        x: { ticks: { font: tooltipFont, color: MUTED }, grid: { display: false } },
                        y: { beginAtZero: true, ticks: { font: tooltipFont, color: MUTED, callback: (v) => toPersianDigits(Number(v)) }, grid: { color: '#e1e0d9' } },
                      },
                      plugins: {
                        legend: { position: 'top' as const, labels: { font: legendFont, color: INK_SECONDARY, usePointStyle: true, boxWidth: 8 } },
                        tooltip: { titleFont: tooltipFont, bodyFont: tooltipFont, callbacks: { label: (ctx) => `${ctx.dataset.label}: ${toPersianDigits(Number(ctx.parsed.y))}` } },
                      },
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Overdue KPI ratio, if any */}
          {kpis && kpis.totalResolutions > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-600">نسبت مصوبات عقب‌افتاده به کل</h3>
                <span className="text-[11px] font-bold" style={{ color: STATUS.critical }}>
                  {toPersianDigits(Math.round((kpis.overdueResolutions / kpis.totalResolutions) * 100))}٪
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((kpis.overdueResolutions / kpis.totalResolutions) * 100)}%`, backgroundColor: STATUS.critical }}></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
