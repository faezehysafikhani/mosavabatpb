import React, { useState } from 'react';
import { Users2, History, Network } from 'lucide-react';
import { UsersTable } from './UsersTable';
import { LoginHistoryTable } from './LoginHistoryTable';
import { OrgChartView } from './OrgChartView';

type UserSubTab = 'USERS' | 'HISTORY' | 'ORG_CHART';

export const UserManagementTab: React.FC = () => {
  const [subTab, setSubTab] = useState<UserSubTab>('USERS');

  const subTabs: { id: UserSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'USERS', label: 'مدیریت کاربران', icon: Users2 },
    { id: 'HISTORY', label: 'تاریخچه ورود', icon: History },
    { id: 'ORG_CHART', label: 'چارت سازمانی', icon: Network },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              subTab === id ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {subTab === 'USERS' && <UsersTable />}
      {subTab === 'HISTORY' && <LoginHistoryTable />}
      {subTab === 'ORG_CHART' && <OrgChartView />}
    </div>
  );
};
