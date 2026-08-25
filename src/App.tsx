import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { LoginModal } from './modules/auth/LoginModal';
import { CreateMeetingModal } from './modules/meetings/CreateMeetingModal';

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
import { SettingsView } from './modules/settings/SettingsView';

import { Sparkles, Bot } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentRoute, selectedMeetingId, setIsAiAssistantOpen } = useApp();

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
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <Navbar />

      {/* Body container: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Right Collapsible Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Trigger */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="group relative flex items-center gap-2.5 bg-[#0f172a] text-white font-bold text-xs py-2.5 px-4 rounded-full shadow-lg hover:shadow-xl border border-slate-700 hover:scale-105 transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight text-slate-200">دستیار هوشمند</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <AiAssistantModal />
      <LoginModal />
      <CreateMeetingModal />
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
