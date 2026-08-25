import React from 'react';
import { Settings, Server, Database, Code2, CheckCircle2, FileCode, Layers, ShieldCheck, Terminal } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

export const SettingsView: React.FC = () => {
  const endpoints = [
    { method: 'GET', path: '/api/meetings', desc: 'دریافت لیست جلسات با فیلتر و Pagination', controller: 'MeetingsController' },
    { method: 'POST', path: '/api/meetings', desc: 'ایجاد جلسه جدید همراه با دستور کار و اعضا', controller: 'MeetingsController' },
    { method: 'GET', path: '/api/meetings/{id}', desc: 'دریافت جزئیات جلسه و مصوبات مرتبط', controller: 'MeetingsController' },
    { method: 'GET', path: '/api/resolutions', desc: 'دریافت بانک مصوبات با فیلتر وضعیت و واحد', controller: 'ResolutionsController' },
    { method: 'POST', path: '/api/resolutions', desc: 'تصویب و ابلاغ مصوبه جدید با پیکربندی صحه‌گذاری', controller: 'ResolutionsController' },
    { method: 'POST', path: '/api/resolutions/{id}/complete', desc: 'ثبت گزارش اتمام اقدام توسط مجری و شروع صحه‌گذاری', controller: 'ResolutionsController' },
    { method: 'POST', path: '/api/resolutions/{id}/verification/approve', desc: 'تایید مرحله صحه‌گذاری توسط تاییدکننده', controller: 'VerificationController' },
    { method: 'POST', path: '/api/resolutions/{id}/verification/reject', desc: 'عدم تایید در صحه‌گذاری و بازگشت به مجری با ذکر علت', controller: 'VerificationController' },
    { method: 'GET', path: '/api/tasks/my-tasks', desc: 'دریافت کارتابل وظایف کاربر جاری', controller: 'TasksController' },
    { method: 'GET', path: '/api/approvals/cartable', desc: 'دریافت کارتابل صحه‌گذاری کاربر جاری', controller: 'ApprovalsController' },
    { method: 'GET', path: '/api/reports/dashboard-kpis', desc: 'دریافت شاخص‌های آماری پیشخوان و داشبورد', controller: 'ReportsController' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80">
        <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-700" />
          <span>تنظیمات سامانه و معماری اتصال به Backend (.NET 8 Web API)</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          مستندات معماری لایه سرویس‌ها، قراردادهای DTO و مسیرهای آماده برای اتصال به ASP.NET Core
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-2">
          <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>معماری ماژولار Service Layer</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            کامپوننت‌های فرانت‌اند به هیچ داده خامی وابسته نبوده و صرفاً با اینترفیس‌های <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">IMeetingService</code> و <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">IResolutionService</code> تعامل دارند.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-2">
          <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs">
            <Database className="w-4 h-4 text-teal-600" />
            <span>انطباق با DTOهای ASP.NET Core</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            مدل‌های TypeScript در <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">src/types/index.ts</code> دقیقاً منطبق با کلاس‌های C# در معماری Clean Architecture / CQRS تعریف شده‌اند.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-2">
          <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>پشتیبانی از JWT & Role-Based</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            هدرهای <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">Bearer Token</code> و مدیریت نقش‌های سازمانی در <code className="font-mono text-teal-700 bg-teal-50 px-1 rounded">apiClient.ts</code> پیاده‌سازی شده و آماده تزریق توکن است.
          </p>
        </div>
      </div>

      {/* Endpoints Table */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-700" />
            <span>نقشه اندپوینت‌های آماده در لایه سرویس (RESTful API Map)</span>
          </h3>
          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            {toPersianDigits(endpoints.length)} مسیر استاندارد
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3 font-bold w-20">Method</th>
                <th className="py-2.5 px-3 font-bold">API Route</th>
                <th className="py-2.5 px-3 font-bold">شرح عملیات در سامانه</th>
                <th className="py-2.5 px-3 font-bold">ASP.NET Core Controller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {endpoints.map((ep) => (
                <tr key={ep.path} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">{ep.path}</td>
                  <td className="py-3 px-3 font-sans text-slate-600">{ep.desc}</td>
                  <td className="py-3 px-3 text-teal-800 font-bold">{ep.controller}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
