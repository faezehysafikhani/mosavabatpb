import React, { useState } from 'react';
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
  Sparkles,
  ChevronDown,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
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
    navigateTo,
    setIsAiAssistantOpen,
    setIsLoginModalOpen,
    showToast
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    showToast('حالت نمایش', isDarkMode ? 'حالت روز فعال شد' : 'حالت شب آزمایشی فعال شد', 'info');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 sticky top-0 z-40 shadow-xs">
      <div className="w-full flex items-center justify-between gap-4">
        
        {/* Right side: App Title & Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
            title="تغییر وضعیت منو"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">خلاصه وضعیت مدیریتی</h1>
            <span className="text-xs text-slate-400 font-medium hidden md:inline border-r border-slate-200 pr-3">
              امروز: {toPersianDigits('۱۴۰۳/۰۸/۱۵')}
            </span>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="جستجوی شماره مصوبه، عنوان جلسه..."
              className="w-full bg-slate-100 border-none rounded-full px-4 py-1.5 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-2" />
            {globalSearch && (
              <button 
                onClick={() => setGlobalSearch('')}
                className="absolute left-2 top-1.5 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full hover:bg-slate-300"
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>

        {/* Left side: Role switcher, AI Assistant trigger, Notifications, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Role Switcher (For demo & testing enterprise permissions) */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-3 rounded-full border border-slate-200 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline font-medium text-slate-500">نقش:</span>
              <span className="font-bold text-slate-800 max-w-[120px] truncate">{currentUser.fullName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Dropdown for role switching */}
            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-700">تغییر کاربر برای تست دسترسی‌ها</p>
                  <p className="text-[11px] text-slate-500">انتخاب نقش سازمانی جهت بررسی رفتار کارتابل‌ها</p>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setShowUserMenu(false);
                        showToast('تغییر نقش کاربر', `شما اکنون با هویت "${user.fullName}" وارد سامانه شدید.`, 'info');
                      }}
                      className={`w-full text-right p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        currentUser.id === user.id ? 'bg-blue-50 text-blue-800 font-bold border border-blue-200' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{user.fullName}</div>
                        <div className="text-[10px] text-slate-500">{user.title}</div>
                      </div>
                      {currentUser.id === user.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick AI Assistant Trigger */}
          <button
            onClick={() => setIsAiAssistantOpen(true)}
            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-1.5 px-3 rounded-full border border-blue-200 transition-all cursor-pointer"
            title="دستیار هوشمند مدیریت مصوبات"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">دستیار هوشمند</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 relative transition-colors"
              title="اعلان‌ها"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800">اطلاعیه‌های سیستمی</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    {toPersianDigits(unreadNotificationsCount)} پیام جدید
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">اعلانی وجود ندارد</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.targetRoute) {
                            navigateTo(notif.targetRoute.replace('/', '') as any);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs transition-all cursor-pointer border ${
                          !notif.isRead ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-100 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{notif.title}</span>
                          <span className="text-[10px] text-slate-400">{toPersianDigits(notif.dateJalali)} - {toPersianDigits(notif.timeString)}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark mode mock toggle */}
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors hidden sm:flex"
            title="تغییر پوسته"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout / Switch User */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="خروج / تغییر کاربر"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
