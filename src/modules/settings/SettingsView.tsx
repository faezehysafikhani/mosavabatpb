import React, { useState } from 'react';
import { Settings, Users2 } from 'lucide-react';
import { GeneralSettingsTab } from './GeneralSettingsTab';
import { UserManagementTab } from './UserManagementTab';

type SettingsMainTab = 'GENERAL' | 'USERS';

export const SettingsView: React.FC = () => {
  const [mainTab, setMainTab] = useState<SettingsMainTab>('GENERAL');

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-700" />
          <span>تنظیمات سامانه</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          مدیریت اطلاعات سازمان، پنل پیامکی، تقویم، تم سامانه و مدیریت کاربران
        </p>

        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-bold mt-4 w-fit">
          <button
            onClick={() => setMainTab('GENERAL')}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
              mainTab === 'GENERAL' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تنظیمات عمومی</span>
          </button>
          <button
            onClick={() => setMainTab('USERS')}
            className={`flex items-center gap-1.5 py-2 px-4 rounded-xl transition-all cursor-pointer ${
              mainTab === 'USERS' ? 'bg-white text-teal-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>مدیریت کاربران</span>
          </button>
        </div>
      </div>

      {mainTab === 'GENERAL' ? <GeneralSettingsTab /> : <UserManagementTab />}
    </div>
  );
};
