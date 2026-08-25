import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  FileCheck2, 
  Inbox, 
  CheckSquare, 
  BarChart3, 
  Users, 
  Settings, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  FolderKanban, 
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';
import { toPersianDigits } from '../../utils/formatters';

interface NavGroup {
  id: string;
  title: string;
  icon: React.ElementType;
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
    setIsCreateMeetingOpen, 
    setIsAiAssistantOpen,
    currentUser
  } = useApp();

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    dashboards: true,
    meetings_resolutions: true,
    cartable: true,
    reports: true,
    settings: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'dashboards',
      title: 'اصلی',
      icon: LayoutDashboard,
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
      icon: FolderKanban,
      items: [
        {
          route: 'meetings',
          title: 'مدیریت جلسات',
          icon: Calendar,
          badge: 15,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        },
        {
          route: 'meetings',
          title: 'ایجاد جلسه جدید',
          icon: PlusCircle,
          action: () => setIsCreateMeetingOpen(true),
        },
        {
          route: 'resolutions',
          title: 'مصوبات سازمانی',
          icon: FileCheck2,
          badge: 12,
          badgeColor: 'bg-blue-600 text-white',
        },
        {
          route: 'calendar',
          title: 'تقویم هوشمند',
          icon: Clock,
        },
      ],
    },
    {
      id: 'cartable',
      title: 'کارتابل‌ها',
      icon: Inbox,
      items: [
        {
          route: 'tasks',
          title: 'وظایف ارجاعی من',
          icon: CheckSquare,
          badge: 4,
          badgeColor: 'bg-red-500 text-white',
        },
        {
          route: 'approvals',
          title: 'کارتابل صحه‌گذاری',
          icon: ShieldCheck,
          badge: 12,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        },
      ],
    },
    {
      id: 'reports',
      title: 'گزارشات و پایش',
      icon: BarChart3,
      items: [
        {
          route: 'reports',
          title: 'گزارش عملکرد واحدها',
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      icon: Settings,
      items: [
        {
          route: 'users',
          title: 'مدیریت کاربران و ساختار',
          icon: Users,
        },
        {
          route: 'settings',
          title: 'تنظیمات و معماری سیستم',
          icon: Building2,
        },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#0f172a] text-slate-300 border-l border-slate-800 transition-all duration-300 flex flex-col shrink-0 z-30 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header with Brand */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
              س
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">سامانه مصوبات</span>
              <p className="text-[10px] text-slate-400 font-medium">مدیریت جلسات و صحه‌گذاری</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto shadow-sm">
            س
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={isSidebarCollapsed ? 'گسترش منو' : 'جمع کردن منو'}
        >
          {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-3">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isExpanded = expandedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {/* Group Header */}
              {!isSidebarCollapsed ? (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{group.title}</span>
                </div>
              ) : (
                <div className="text-center py-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-800/60 text-slate-400 flex items-center justify-center mx-auto text-xs font-bold" title={group.title}>
                    <GroupIcon className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Group Sub-items */}
              <div className="space-y-1">
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                      } ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <ItemIcon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.title}</span>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-blue-600 text-white'
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
          );
        })}
      </div>

      {/* Sidebar User Footer */}
      {!isSidebarCollapsed ? (
        <div className="p-3.5 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser.fullName.slice(0, 2)}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.title}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800 text-center">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white mx-auto">
            {currentUser.fullName.slice(0, 2)}
          </div>
        </div>
      )}
    </aside>
  );
};
