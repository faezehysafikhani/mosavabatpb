import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { LoginModal } from './modules/auth/LoginModal';
import { CreateMeetingModal } from './modules/meetings/CreateMeetingModal';
import { CreateResolutionModal } from './modules/resolutions/CreateResolutionModal';

// Views
import { DashboardView } from './modules/dashboard/DashboardView';
import { MeetingListView } from './modules/meetings/MeetingListView';
import { MeetingDetailView } from './modules/meetings/MeetingDetailView';
import { ResolutionListView } from './modules/resolutions/ResolutionListView';
import { MyTasksView } from './modules/tasks/MyTasksView';
import { ApprovalsView } from './modules/approvals/ApprovalsView';
import { ReportsView } from './modules/reports/ReportsView';
import { CalendarView } from './modules/calendar/CalendarView';
import { UsersView } from './modules/users/UsersView';
import { UserGuideView } from './modules/guide/UserGuideView';

import { Sparkles, Bot } from 'lucide-react';

const AppContent: React.FC = () => {
  const { 
    currentRoute, 
    selectedMeetingId, 
    setIsAiAssistantOpen,
    resolutionModalState,
    closeCreateResolutionModal,
    isDarkMode
  } = useApp();

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardView />;
      case 'meetings':
        return <MeetingListView />;
      case 'meeting-details':
        return <MeetingDetailView meetingId={selectedMeetingId || 'meet-1'} />;
      case 'resolutions':
        return <ResolutionListView />;
      case 'tasks':
        return <MyTasksView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'reports':
        return <ReportsView />;
      case 'calendar':
        return <CalendarView />;
      case 'users':
        return <UsersView />;
      case 'guide':
      case 'settings':
        return <UserGuideView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-teal-700 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <Navbar />

      {/* Body container: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-950 ${currentRoute === 'calendar' ? 'overflow-hidden' : ''}`}>
          <div className="max-w-7xl mx-auto h-full">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Trigger */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="group relative flex items-center gap-2 bg-slate-900 dark:bg-teal-800 text-white font-bold text-xs py-2 px-3.5 rounded-full shadow-lg hover:shadow-xl border border-slate-700 dark:border-teal-600 hover:scale-105 transition-all cursor-pointer"
        >
          <div className="w-5 h-5 rounded-full bg-teal-500 dark:bg-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-xs">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="tracking-tight text-slate-200">دستیار هوشمند (چت)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <AiAssistantModal />
      <LoginModal />
      <CreateMeetingModal />
      
      {/* Global Create Resolution Modal (Triggerable from anywhere, including Meeting Agendas) */}
      <CreateResolutionModal
        isOpen={resolutionModalState.isOpen}
        onClose={closeCreateResolutionModal}
        defaultMeetingId={resolutionModalState.defaultMeetingId}
        defaultAgendaItemId={resolutionModalState.defaultAgendaItemId}
        defaultTopicTitle={resolutionModalState.defaultTopicTitle}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
