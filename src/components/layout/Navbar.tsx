import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  Layers, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  UserCheck, 
  ChevronDown,
  User as UserIcon,
  ShieldAlert,
  Check,
  Trash2,
  Inbox
  ,Palette
  ,Droplets
  ,Clock3
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';
import { toPersianDigits } from '../../utils/formatters';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    availableUsers, 
    toggleSidebar, 
    globalSearch, 
    setGlobalSearch,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    navigateTo,
    setIsLoginModalOpen,
    showToast,
    appTheme,
    setAppTheme
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [now, setNow] = useState(new Date());
  const todayJalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const currentTime = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(now);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (notificationTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationAsRead(notif.id);
    setShowNotifications(false);
    
    if (notif.targetRoute) {
      const cleanRoute = notif.targetRoute.replace('/', '') as AppRoute;
      navigateTo(cleanRoute);
      showToast(notif.title, 'انتقال به بخش مربوطه انجام شد.', 'info');
    }
  };

  return (
    <header className="app-surface h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-40 shadow-xs select-none">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Right side: App Title & Toggle & Organization Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
            title="تغییر وضعیت منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <img
              src="/pars-project.png"
              alt="لوگوی Pars Project"
              className="w-12 h-12 object-contain rounded-xl bg-white shrink-0 p-0.5 border border-slate-100"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight hidden sm:inline">سامانه مصوبات و جلسات</h1>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium sm:hidden">
                سامانه مصوبات و جلسات
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="جستجوی شماره مصوبه، عنوان جلسه، نام مسئول..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 pr-8 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" />
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                className="absolute left-2 top-1.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>

        {/* Left side: Role switcher, Notifications, Theme switch, User Profile, Date & Time */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Quick Role Switcher */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center gap-1.5 min-w-[190px] lg:min-w-[250px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span className="hidden md:inline font-medium text-slate-500 dark:text-slate-400">کاربر:</span>
              <span className="font-bold whitespace-nowrap">{currentUser.fullName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown for role switching */}
            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">تغییر کاربر فعال (شبیه‌سازی)</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400">بررسی سطح دسترسی‌ها و کارتابل‌ها با هویت‌های مختلف</p>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setShowUserMenu(false);
                        showToast('تغییر کاربر فعال', `شما اکنون با هویت "${user.fullName}" در سامانه هستید.`, 'info');
                      }}
                      className={`w-full text-right p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        currentUser.id === user.id 
                          ? 'bg-teal-50 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{user.fullName}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400">{user.title}</div>
                      </div>
                      {currentUser.id === user.id && <CheckCircle2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown (Item 5 Fixed) */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full relative transition-colors cursor-pointer ${
                showNotifications 
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-teal-800 dark:hover:text-teal-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="اعلان‌ها و اطلاعیه‌ها"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-slate-900">
                  {toPersianDigits(unreadNotificationsCount)}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 space-y-2.5">
                {/* Notification Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">اعلان‌های سامانه</h4>
                      <p className="text-[10px] text-slate-400">پیام‌ها و ارجاعات جدید شما</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-teal-800 dark:text-teal-300 hover:underline font-bold px-2 py-1 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950 cursor-pointer flex items-center gap-1"
                        title="علامت‌گذاری همه به عنوان خوانده‌شده"
                      >
                        <Check className="w-3 h-3" />
                        <span>خوانده شد</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="پاکسازی اعلان‌ها"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1 text-[11px] font-bold">
                  <button
                    onClick={() => setNotificationTab('ALL')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      notificationTab === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    همه ({toPersianDigits(notifications.length)})
                  </button>
                  <button
                    onClick={() => setNotificationTab('UNREAD')}
                    className={`flex-1 py-1 rounded-lg transition-all cursor-pointer ${
                      notificationTab === 'UNREAD'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    خوانده‌نشده ({toPersianDigits(unreadNotificationsCount)})
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-8 space-y-2 text-slate-400 dark:text-slate-500">
                      <Inbox className="w-7 h-7 mx-auto opacity-40" />
                      <p className="text-xs font-medium">اعلانی در این بخش وجود ندارد</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-2xl text-xs transition-all cursor-pointer border ${
                          !notif.isRead 
                            ? 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/70' 
                            : 'bg-slate-50 dark:bg-slate-850/60 border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0"></span>
                            )}
                            <span className="font-extrabold text-slate-800 dark:text-slate-200">{notif.title}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {toPersianDigits(notif.dateJalali)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme selector */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu((prev) => !prev)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-[var(--app-primary)] rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="انتخاب تم سامانه"
            >
              {appTheme === 'glass' ? <Droplets className="w-4 h-4 text-sky-500" /> : appTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Palette className="w-4 h-4 text-fuchsia-700" />}
            </button>
            {showThemeMenu && (
              <div className="app-surface absolute left-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50">
                {[
                  { id: 'brand', label: 'تم سازمانی', icon: Palette },
                  { id: 'glass', label: 'آبی شیشه‌ای', icon: Droplets },
                  { id: 'dark', label: 'تم تیره', icon: Moon },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setAppTheme(id as 'brand' | 'glass' | 'dark'); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${appTheme === id ? 'app-nav-active text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Logout / Switch User */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="خروج / تغییر کاربر"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <div
            className="hidden xl:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[11px] py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap"
            title="تاریخ و ساعت جاری"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--app-primary)]" />
            <span>{todayJalali}</span>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-600" />
            <Clock3 className="w-3.5 h-3.5 text-[var(--app-primary)]" />
            <span dir="ltr">{currentTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
