import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileCheck2,
  CheckSquare,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  UserCheck,
  Settings,
  Lightbulb
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';
import { toPersianDigits } from '../../utils/formatters';
import { meetingService, resolutionService, taskService, approvalService } from '../../services';
import { GUIDE_SLIDES } from '../../modules/guide/UserGuideView';

interface NavGroup {
  id: string;
  title: string;
  items: {
    route: AppRoute;
    title: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    action?: () => void;
  }[];
}

export const Sidebar: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    isSidebarCollapsed,
    toggleSidebar,
    currentUser,
    hasPermission,
    refreshTrigger
  } = useApp();

  const [counts, setCounts] = useState({ meetings: 0, resolutions: 0, tasks: 0, approvals: 0 });

  useEffect(() => {
    const isAdmin = currentUser.role === 'ADMIN';
    Promise.all([
      meetingService.getMeetings({ pageSize: 1, participantUserId: isAdmin ? undefined : currentUser.id }),
      resolutionService.getResolutions({ pageSize: 1, relatedUserId: isAdmin ? undefined : currentUser.id }),
      taskService.getMyTasks(currentUser.id, { pageSize: 1 }),
      approvalService.getMyApprovals(currentUser.id, { pageSize: 1, status: 'PENDING' }),
    ]).then(([meetingsRes, resRes, taskRes, apprRes]) => {
      setCounts({
        meetings: meetingsRes.isSuccess ? meetingsRes.data.totalCount : 0,
        resolutions: resRes.isSuccess ? resRes.data.totalCount : 0,
        tasks: taskRes.isSuccess ? taskRes.data.totalCount : 0,
        approvals: apprRes.isSuccess ? apprRes.data.totalCount : 0,
      });
    });
  }, [currentUser.id, refreshTrigger]);

  const allNavGroups: NavGroup[] = [
    {
      id: 'dashboards',
      title: 'پیشخوان',
      items: [
        {
          route: 'dashboard',
          title: 'داشبورد مدیریتی',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 'meetings_resolutions',
      title: 'جلسات و مصوبات',
      items: [
        ...(currentUser.role === 'ADMIN' || currentUser.role === 'CEO' || currentUser.role === 'SECRETARY'
          ? [
              {
                route: 'proposals' as AppRoute,
                title: 'مصوبات پیشنهادی',
                icon: Lightbulb,
              },
            ]
          : []),
        {
          route: 'meetings' as AppRoute,
          title: 'مدیریت جلسات',
          icon: Calendar,
          badge: counts.meetings,
          badgeColor: 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
        },
        {
          route: 'resolutions' as AppRoute,
          title: 'بانک مصوبات',
          icon: FileCheck2,
          badge: counts.resolutions,
          badgeColor: 'bg-teal-700 text-white',
        },
        {
          route: 'calendar' as AppRoute,
          title: 'تقویم هوشمند',
          icon: Clock,
        },
      ],
    },
    {
      id: 'cartable',
      title: 'کارتابل و تکالیف',
      items: [
        ...(currentUser.role !== 'CEO'
          ? [
              {
                route: 'tasks' as AppRoute,
                title: 'وظایف ارجاعی من',
                icon: CheckSquare,
                badge: counts.tasks,
                badgeColor: 'bg-rose-500 text-white',
              },
            ]
          : []),
        ...(hasPermission('VIEW_APPROVALS') || currentUser.role === 'ADMIN' || currentUser.role === 'DEPT_MANAGER' || currentUser.role === 'CEO'
          ? [
              {
                route: 'approvals' as AppRoute,
                title: 'کارتابل صحه‌گذاری',
                icon: ShieldCheck,
                badge: counts.approvals,
                badgeColor: 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
              },
            ]
          : []),
      ],
    },
    {
      id: 'reports_system',
      title: 'گزارش و راهنما',
      items: [
        {
          route: 'reports' as AppRoute,
          title: 'گزارش عملکرد',
          icon: FileSpreadsheet,
        },
        ...(currentUser.role === 'ADMIN' || hasPermission('MANAGE_USERS')
          ? [
              {
                route: 'settings' as AppRoute,
                title: 'تنظیمات',
                icon: Settings,
              },
            ]
          : []),
        {
          route: 'guide' as AppRoute,
          title: 'راهنمای کاربری سامانه',
          icon: BookOpen,
          badge: GUIDE_SLIDES.length,
          badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[9px] border border-teal-200 dark:border-teal-800',
        },
      ],
    },
  ];

  const navGroups = allNavGroups.filter((g) => g.items.length > 0);

  return (
    <aside
      className={`app-surface bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-l border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-start shrink-0 z-30 h-full select-none shadow-xs ${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* User Info Box - Placed at the very TOP, above "پیشخوان" (Dashboard) */}
      <div className="p-2 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        {!isSidebarCollapsed ? (
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden shadow-xs">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.fullName.slice(0, 2)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 truncate">{currentUser.fullName}</p>
                <p className="text-[9px] text-teal-700 dark:text-teal-400 font-semibold truncate">{currentUser.title}</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="جمع کردن منو"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-0.5">
            <div 
              className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer"
              title={`${currentUser.fullName} - ${currentUser.title}`}
              onClick={toggleSidebar}
            >
              {currentUser.fullName.slice(0, 2)}
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="گسترش منو"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation List - Super Compact & Smooth - Above fold with Zero Scroll */}
      <div className="flex-1 py-1 px-2 space-y-1 overflow-hidden flex flex-col justify-start">
        {navGroups.map((group) => (
          <div key={group.id} className="space-y-0.5">
            {/* Group Header */}
            {!isSidebarCollapsed ? (
              <div className="px-2 pt-1.5 pb-1 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {group.title}
              </div>
            ) : (
              <div className="h-1" />
            )}

            {/* Group Items */}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = currentRoute === item.route && !item.action;

                return (
                  <button
                    key={item.title}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        navigateTo(item.route);
                      }
                    }}
                    title={item.title}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'app-nav-active text-white font-extrabold shadow-xs'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-bold'
                    } ${isSidebarCollapsed ? 'justify-center px-1 py-1.5' : ''}`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'
                        }`}
                      />
                      {!isSidebarCollapsed && (
                        <span className="truncate text-[12px] leading-5">{item.title}</span>
                      )}
                    </div>

                    {!isSidebarCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                          item.badgeColor || 'bg-teal-700 text-white'
                        }`}
                      >
                        {toPersianDigits(item.badge)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
