import React, { useState } from 'react';
import { UserPlus, Pencil, ShieldCheck, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockDepartments } from '../../mock/data';
import { User, UserRole } from '../../types';
import { CreateUserModal } from '../users/CreateUserModal';
import { PermissionsModal } from './PermissionsModal';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'مدیر ارشد سیستم',
  CEO: 'مدیرعامل / ریاست',
  SECRETARY: 'دبیر جلسات',
  DEPT_MANAGER: 'مدیر واحد',
  EXPERT_ASSIGNEE: 'کارشناس مجری',
  AUDITOR: 'بازرس و ناظر',
};

export const UsersTable: React.FC = () => {
  const { availableUsers, hasPermission, currentUser, deleteUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = hasPermission('MANAGE_USERS') || currentUser.role === 'ADMIN';

  const filteredUsers = availableUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return !term || u.fullName.toLowerCase().includes(term) || u.title.toLowerCase().includes(term) || u.departmentName.toLowerCase().includes(term);
  });

  const getDirectManager = (user: User): string => {
    const dept = mockDepartments.find((d) => d.id === user.departmentId);
    if (!dept || dept.managerId === user.id) return '—';
    return dept.managerName;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی کاربر..."
            className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
        </div>
        {canManage && (
          <button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer">
            <UserPlus className="w-3.5 h-3.5" />
            <span>کاربر جدید</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-right text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[11px]">
              <th className="py-2.5 px-3 font-semibold">کاربر</th>
              <th className="py-2.5 px-3 font-semibold">موبایل</th>
              <th className="py-2.5 px-3 font-semibold">ایمیل</th>
              <th className="py-2.5 px-3 font-semibold">دپارتمان</th>
              <th className="py-2.5 px-3 font-semibold">سمت</th>
              <th className="py-2.5 px-3 font-semibold">مدیر مستقیم</th>
              <th className="py-2.5 px-3 font-semibold">دسترسی‌ها</th>
              <th className="py-2.5 px-3 font-semibold">وضعیت</th>
              <th className="py-2.5 px-3 font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3 font-bold text-slate-800">{user.fullName}</td>
                <td className="py-3 px-3 text-slate-600" dir="ltr">{user.phone}</td>
                <td className="py-3 px-3 text-slate-600" dir="ltr">{user.email}</td>
                <td className="py-3 px-3 text-slate-600">{user.departmentName}</td>
                <td className="py-3 px-3 text-slate-600">{user.title}</td>
                <td className="py-3 px-3 text-slate-600">{getDirectManager(user)}</td>
                <td className="py-3 px-3 text-slate-600">{ROLE_LABELS[user.role]} ({user.permissions.length})</td>
                <td className="py-3 px-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {user.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setEditingUser(user)} title="ویرایش" className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPermissionsUser(user)} title="دسترسی" className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 cursor-pointer">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(user.id)} title="حذف" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <CreateUserModal isOpen={Boolean(editingUser)} user={editingUser} onClose={() => setEditingUser(null)} />
      <PermissionsModal user={permissionsUser} onClose={() => setPermissionsUser(null)} />

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">حذف کاربر</h3>
            <p className="text-xs text-slate-600">آیا از حذف این کاربر مطمئن هستید؟ این عملیات قابل بازگشت نیست.</p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer">انصراف</button>
              <button
                onClick={async () => { await deleteUser(confirmDeleteId); setConfirmDeleteId(null); }}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-xs cursor-pointer"
              >
                حذف قطعی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
