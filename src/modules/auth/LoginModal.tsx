import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, ShieldCheck, UserCheck, CheckCircle2, Lock, ArrowLeft, X } from 'lucide-react';
import { mockUsers } from '../../mock/data';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, setCurrentUser, currentUser, showToast } = useApp();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

  if (!isLoginModalOpen) return null;

  const handleLogin = (userId: string) => {
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setIsLoginModalOpen(false);
      showToast('ورود موفق', `به عنوان ${user.fullName} (${user.title}) وارد سامانه شدید.`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 text-center relative">
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-4 left-4 text-teal-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-300 flex items-center justify-center text-slate-950 font-bold mx-auto mb-3 shadow-md">
            <Layers className="w-6 h-6 text-teal-950" />
          </div>
          <h2 className="text-base font-extrabold text-white">ورود به سامانه مدیریت جلسات و مصوبات</h2>
          <p className="text-xs text-teal-200 mt-1">احراز هویت سازمانی و انتخاب نقش جهت تست سناریوهای دسترسی</p>
        </div>

        {/* Roles list */}
        <div className="p-5 space-y-4">
          <div className="text-xs font-bold text-slate-700">یک هویت سازمانی را جهت ورود انتخاب فرمایید:</div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {mockUsers.slice(0, 6).map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedUserId === user.id
                    ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-400/30'
                    : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName.split(' ')[0][0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
                    <div className="text-[11px] text-slate-500">{user.title}</div>
                    <div className="text-[10px] text-teal-700 font-medium">{user.departmentName}</div>
                  </div>
                </div>

                {selectedUserId === user.id && (
                  <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => handleLogin(selectedUserId)}
            className="w-full bg-gradient-to-r from-teal-800 to-teal-700 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs py-3 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>تایید هویت و ورود به پیشخوان</span>
          </button>
        </div>
      </div>
    </div>
  );
};
