import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppNotification, PermissionKey } from '../types';
import { mockUsers, mockNotifications } from '../mock/data';
import { userService } from '../services/userService';
import { loadLocalCollection, loadLocalValue, saveLocalCollection, saveLocalValue } from '../services/localStore';

export type AppRoute = 
  | 'dashboard'
  | 'meetings'
  | 'meeting-details'
  | 'resolutions'
  | 'tasks'
  | 'approvals'
  | 'reports'
  | 'calendar'
  | 'users'
  | 'settings'
  | 'guide';

export type AppTheme = 'brand' | 'glass' | 'dark';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export interface CreateResolutionModalState {
  isOpen: boolean;
  defaultMeetingId?: string;
  defaultAgendaItemId?: string;
  defaultTopicTitle?: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  addUser: (userData: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: string, userData: Omit<User, 'id'>) => Promise<User>;
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute, params?: { meetingId?: string; resolutionId?: string; taskId?: string }) => void;
  selectedMeetingId: string | null;
  setSelectedMeetingId: (id: string | null) => void;
  selectedResolutionId: string | null;
  setSelectedResolutionId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  toasts: ToastInfo[];
  showToast: (title: string, message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
  isCreateMeetingOpen: boolean;
  setIsCreateMeetingOpen: (open: boolean) => void;
  createMeetingInitialDate: string;
  openCreateMeetingModal: (defaultDate?: string) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  login: (usernameOrId: string, password?: string) => boolean;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  resolutionModalState: CreateResolutionModalState;
  openCreateResolutionModal: (opts?: { meetingId?: string; agendaItemId?: string; topicTitle?: string }) => void;
  closeCreateResolutionModal: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  appTheme: AppTheme;
  setAppTheme: (theme: AppTheme) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to User-2 (مهندس حسینی - مدیر فناوری اطلاعات) or Admin
  const initialUsers = loadLocalCollection('users', mockUsers);
  const savedUserId = loadLocalValue<string | null>('currentUserId', null);
  const [currentUser, setCurrentUserState] = useState<User>(initialUsers.find((user) => user.id === savedUserId) || initialUsers[1] || initialUsers[0]);
  const [availableUsers, setAvailableUsers] = useState<User[]>(initialUsers);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(loadLocalValue('isAuthenticated', true));
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>(loadLocalCollection('notifications', mockNotifications));
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState<boolean>(false);
  const [createMeetingInitialDate, setCreateMeetingInitialDate] = useState<string>('۱۴۰۳/۰۷/۰۵');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [appTheme, setAppThemeState] = useState<AppTheme>('brand');
  const isDarkMode = appTheme === 'dark';
  const [resolutionModalState, setResolutionModalState] = useState<CreateResolutionModalState>({
    isOpen: false,
  });
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const applyTheme = (theme: AppTheme) => {
    document.documentElement.classList.remove('dark', 'theme-brand', 'theme-glass');
    document.documentElement.classList.add(theme === 'dark' ? 'dark' : `theme-${theme}`);
  };

  // Initialize selected visual theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme');
    const initialTheme: AppTheme = savedTheme === 'dark' || savedTheme === 'glass' || savedTheme === 'brand'
      ? savedTheme
      : 'brand';
    setAppThemeState(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const setAppTheme = (theme: AppTheme) => {
    setAppThemeState(theme);
    applyTheme(theme);
    localStorage.setItem('app-theme', theme);
  };

  const toggleDarkMode = () => {
    setAppTheme(isDarkMode ? 'brand' : 'dark');
  };

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    saveLocalValue('currentUserId', user.id);
  };

  const navigateTo = (route: AppRoute, params?: { meetingId?: string; resolutionId?: string; taskId?: string }) => {
    if (params?.meetingId) {
      setSelectedMeetingId(params.meetingId);
    }
    if (params?.resolutionId) {
      setSelectedResolutionId(params.resolutionId);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      saveLocalCollection('notifications', next);
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, isRead: true }));
      saveLocalCollection('notifications', next);
      return next;
    });
    showToast('اعلان‌ها', 'تمامی اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند.', 'info');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    saveLocalCollection('notifications', []);
    showToast('اعلان‌ها', 'تمامی اعلان‌ها پاک شدند.', 'info');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const showToast = (title: string, message: string, type: ToastInfo['type'] = 'success') => {
    const id = `toast-${Date.now()}`;
    const newToast: ToastInfo = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openCreateMeetingModal = (defaultDate?: string) => {
    if (defaultDate) {
      setCreateMeetingInitialDate(defaultDate);
    }
    setIsCreateMeetingOpen(true);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    // Every authenticated user can access personal meetings, resolutions, tasks and approvals.
    if (['VIEW_MEETINGS', 'VIEW_RESOLUTIONS', 'VIEW_TASKS', 'VIEW_APPROVALS'].includes(permission)) return true;
    if (currentUser.role === 'ADMIN') return true;
    if (currentUser.permissions?.includes('VIEW_ALL') || currentUser.permissions?.includes('APPROVE_ALL')) {
      if (permission.startsWith('VIEW_')) return true;
    }
    return currentUser.permissions?.includes(permission) ?? false;
  };

  const login = (usernameOrId: string, password?: string): boolean => {
    // Find user by id, username, or national code
    const user = availableUsers.find(
      (u) =>
        u.id === usernameOrId ||
        (u.username && u.username.toLowerCase() === usernameOrId.toLowerCase()) ||
        u.nationalCode === usernameOrId ||
        u.email.toLowerCase() === usernameOrId.toLowerCase()
    );

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      saveLocalValue('isAuthenticated', true);
      setIsLoginModalOpen(false);
      navigateTo('dashboard');
      showToast('ورود موفق', `خوش آمدید ${user.fullName} (${user.title})`, 'success');
      return true;
    }
    showToast('خطای ورود', 'کاربر مورد نظر یافت نشد.', 'error');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    saveLocalValue('isAuthenticated', false);
    setIsLoginModalOpen(true);
    showToast('خروج از سیستم', 'از حساب کاربری خارج شدید.', 'info');
  };

  const addUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    const res = await userService.createUser(userData);
    const newUser = res.data;
    setAvailableUsers((prev) => [newUser, ...prev]);
    showToast('ثبت کاربر جدید', `کاربر "${newUser.fullName}" با موفقیت اضافه شد.`, 'success');
    triggerRefresh();
    return newUser;
  };

  const updateUser = async (id: string, userData: Omit<User, 'id'>): Promise<User> => {
    const res = await userService.updateUser(id, userData);
    const updatedUser = res.data;
    setAvailableUsers((prev) => prev.map((user) => user.id === id ? updatedUser : user));
    if (currentUser.id === id) setCurrentUser(updatedUser);
    showToast('ویرایش کاربر', `اطلاعات کاربر «${updatedUser.fullName}» ذخیره شد.`, 'success');
    triggerRefresh();
    return updatedUser;
  };

  const openCreateResolutionModal = (opts?: {
    meetingId?: string;
    agendaItemId?: string;
    topicTitle?: string;
  }) => {
    setResolutionModalState({
      isOpen: true,
      defaultMeetingId: opts?.meetingId,
      defaultAgendaItemId: opts?.agendaItemId,
      defaultTopicTitle: opts?.topicTitle,
    });
  };

  const closeCreateResolutionModal = () => {
    setResolutionModalState({ isOpen: false });
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        addUser,
        updateUser,
        currentRoute,
        navigateTo,
        selectedMeetingId,
        setSelectedMeetingId,
        selectedResolutionId,
        setSelectedResolutionId,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        globalSearch,
        setGlobalSearch,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        toasts,
        showToast,
        removeToast,
        isCreateMeetingOpen,
        setIsCreateMeetingOpen,
        createMeetingInitialDate,
        openCreateMeetingModal,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        resolutionModalState,
        openCreateResolutionModal,
        closeCreateResolutionModal,
        refreshTrigger,
        triggerRefresh,
        isDarkMode,
        toggleDarkMode,
        appTheme,
        setAppTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
