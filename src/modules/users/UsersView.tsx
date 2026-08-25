import React, { useState } from 'react';
import { Users, Building2, ShieldCheck, Mail, Phone, Search } from 'lucide-react';
import { mockUsers, mockDepartments, mockOrganizations } from '../../mock/data';
import { toPersianDigits } from '../../utils/formatters';

export const UsersView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filteredUsers = mockUsers.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === 'ALL' || u.departmentId === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-700" />
            <span>مدیریت ساختار سازمانی، واحدها و کاربران</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            ساختار چارت سازمانی، سطوح دسترسی و فهرست کاربران سامانه مصوبات
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در نام کاربر، سمت سازمانی یا واحد..."
            className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
        </div>

        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
          >
            <option value="ALL">همه واحدهای سازمانی</option>
            {mockDepartments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/90 hover:border-teal-400 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white font-black text-sm flex items-center justify-center shadow-xs">
                {user.fullName.split(' ')[0][0]}
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-800">{user.fullName}</h3>
                <p className="text-[11px] text-slate-500">{user.title}</p>
                <span className="inline-block text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md mt-1">
                  {user.departmentName}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>داخلی: {toPersianDigits(user.internalPhone || '۱۰۱')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>نقش سیستمی: {user.role === 'ADMIN' ? 'مدیر ارشد سیستم' : user.role === 'DEPT_MANAGER' ? 'مدیر واحد / صحه‌گذار' : user.role === 'SECRETARY' ? 'دبیر جلسات' : 'عضو / مجری'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
