import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { mockDepartments } from '../../mock/data';
import { User, UserRole } from '../../types';
import { X, UserPlus, Save } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, user }) => {
  const { addUser, updateUser, showToast } = useApp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(mockDepartments[0].id);
  const [role, setRole] = useState<UserRole>('EXPERT_ASSIGNEE');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user?.firstName || user?.fullName.split(' ')[0] || '');
    setLastName(user?.lastName || user?.fullName.split(' ').slice(1).join(' ') || '');
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setTitle(user?.title || '');
    setDepartmentId(user?.departmentId || mockDepartments[0].id);
    setRole(user?.role || 'EXPERT_ASSIGNEE');
    setIsActive(user?.isActive ?? true);
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getPermissionsForRole = (r: UserRole): string[] => {
    switch (r) {
      case 'ADMIN':
        return [
          'VIEW_DASHBOARD',
          'VIEW_MEETINGS',
          'CREATE_MEETING',
          'EDIT_MEETING',
          'DELETE_MEETING',
          'CREATE_RESOLUTION',
          'VIEW_RESOLUTIONS',
          'EDIT_RESOLUTION',
          'VIEW_TASKS',
          'VIEW_APPROVALS',
          'APPROVE_RESOLUTION',
          'REJECT_RESOLUTION',
          'VIEW_REPORTS',
          'MANAGE_USERS',
          'CREATE_USER',
        ];
      case 'CEO':
        return [
          'VIEW_DASHBOARD',
          'VIEW_MEETINGS',
          'VIEW_RESOLUTIONS',
          'VIEW_APPROVALS',
          'APPROVE_RESOLUTION',
          'REJECT_RESOLUTION',
          'VIEW_REPORTS',
        ];
      case 'SECRETARY':
        return [
          'VIEW_DASHBOARD',
          'VIEW_MEETINGS',
          'CREATE_MEETING',
          'EDIT_MEETING',
          'CREATE_RESOLUTION',
          'VIEW_RESOLUTIONS',
          'EDIT_RESOLUTION',
          'VIEW_TASKS',
        ];
      case 'DEPT_MANAGER':
        return [
          'VIEW_DASHBOARD',
          'VIEW_MEETINGS',
          'VIEW_RESOLUTIONS',
          'VIEW_TASKS',
          'VIEW_APPROVALS',
          'APPROVE_RESOLUTION',
          'REJECT_RESOLUTION',
          'VIEW_REPORTS',
        ];
      case 'EXPERT_ASSIGNEE':
      default:
        return ['VIEW_DASHBOARD', 'VIEW_MEETINGS', 'VIEW_TASKS'];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('خطا', 'نام و نام خانوادگی الزامی است.', 'error');
      return;
    }

    const dept = mockDepartments.find((d) => d.id === departmentId) || mockDepartments[0];
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const generatedUsername = username.trim() || `user_${Date.now().toString().slice(-4)}`;

    setIsSubmitting(true);
    try {
      const userData: Omit<User, 'id'> = {
        nationalCode: user?.nationalCode || '00' + Math.floor(10000000 + Math.random() * 90000000),
        username: generatedUsername,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName,
        title: title.trim() || `کارشناس ${dept.name}`,
        email: email.trim() || `${generatedUsername}@org.gov.ir`,
        phone: phone.trim() || '0912' + Math.floor(1000000 + Math.random() * 9000000),
        internalPhone: Math.floor(100 + Math.random() * 899).toString(),
        role,
        departmentId: dept.id,
        departmentName: dept.name,
        organizationId: 'org-1',
        organizationName: 'سازمان مرکزی فناوری و اطلاعات',
        isActive,
        permissions: getPermissionsForRole(role),
      };

      if (user) await updateUser(user.id, userData);
      else await addUser(userData);

      onClose();
    } catch (err) {
      showToast('خطا', 'افزودن کاربر با خطا مواجه شد.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="app-modal-header text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user ? 'ویرایش کاربر' : 'افزودن کاربر جدید به سامانه'}</h3>
              <p className="text-[11px] text-teal-200">{user ? 'اصلاح مشخصات، واحد و سطح دسترسی کاربر' : 'تعریف مشخصات هویتی، واحد سازمانی و نقش کاربری'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="مثال: علی"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="مثال: حسینی"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام کاربری (Username)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: a_hosseini"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سمت سازمانی</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: کارشناس ارشد شبکه و امنیت"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">پست الکترونیکی</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@org.gov.ir"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس همراه</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09121234567"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">واحد سازمانی</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
              >
                {mockDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نقش و سطح دسترسی</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-bold text-teal-900"
              >
                <option value="ADMIN">مدیر ارشد سیستم (Full Admin)</option>
                <option value="CEO">مدیرعامل / ریاست سازمان (CEO)</option>
                <option value="SECRETARY">دبیر جلسات (Secretary)</option>
                <option value="DEPT_MANAGER">مدیر واحد / صحه‌گذار (Dept Manager)</option>
                <option value="EXPERT_ASSIGNEE">کارشناس مجری مصوبه (Expert Assignee)</option>
              </select>
            </div>
          </div>

          {/* Active status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">وضعیت حساب کاربری</span>
              <span className="text-[11px] text-slate-500">امکان ورود و انتخاب کاربر در فرآیندهای جلسه و مصوبات</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-700"></div>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {user ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{isSubmitting ? 'در حال ذخیره...' : user ? 'ذخیره تغییرات' : 'ثبت و فعال‌سازی کاربر'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
