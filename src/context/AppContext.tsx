import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AppNotification } from '../types';
import { mockUsers, mockNotifications } from '../mock/data';
import { userService } from '../services/userService';

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
  | 'settings';

interface ToastInfo {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
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
  toasts: ToastInfo[];
  showToast: (title: string, message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
  isCreateMeetingOpen: boolean;
  setIsCreateMeetingOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to User-2 (مهندس حسینی - مدیر فناوری اطلاعات) or Admin
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[1]);
  const [availableUsers, setAvailableUsers] = useState<User[]>(mockUsers);
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

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

  const markNotificationAsRead = async (id: string) => {
    await userService.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
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
        toasts,
        showToast,
        removeToast,
        isCreateMeetingOpen,
        setIsCreateMeetingOpen,
        isAiAssistantOpen,
        setIsAiAssistantOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshTrigger,
        triggerRefresh,
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
