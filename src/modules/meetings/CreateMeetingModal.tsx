import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { meetingService } from '../../services/meetingService';
import { mockUsers, mockDepartments } from '../../mock/data';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Users, FileText, CheckCircle2 } from 'lucide-react';
import { MeetingType, MeetingMember, AgendaItem } from '../../types';

export const CreateMeetingModal: React.FC = () => {
  const { isCreateMeetingOpen, setIsCreateMeetingOpen, showToast, triggerRefresh } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('COMMISSION');
  const [dateJalali, setDateJalali] = useState('۱۴۰۳/۰۷/۰۵');
  const [startTime, setStartTime] = useState('۰۹:۰۰');
  const [endTime, setEndTime] = useState('۱۱:۳۰');
  const [location, setLocation] = useState('سالن کنفرانس طبقه چهارم');
  const [departmentId, setDepartmentId] = useState('dept-1');
  const [organizerId, setOrganizerId] = useState('user-1');
  const [secretaryId, setSecretaryId] = useState('user-4');
  const [description, setDescription] = useState('');

  // Agenda items
  const [agendas, setAgendas] = useState<AgendaItem[]>([
    {
      id: 'ag-1',
      rowNumber: 1,
      title: 'بررسی گزارش دوره‌ای پروژه‌های اولویت‌دار',
      presenterName: 'مهندس حسینی',
      allocatedMinutes: 30,
      status: 'PENDING',
    },
    {
      id: 'ag-2',
      rowNumber: 2,
      title: 'بررسی درخواست تخصیص اعتبار خرید تجهیزات زیرساخت شبکه',
      presenterName: 'دکتر تقوی',
      allocatedMinutes: 45,
      status: 'PENDING',
    },
  ]);

  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaPresenter, setNewAgendaPresenter] = useState('');
  const [newAgendaMinutes, setNewAgendaMinutes] = useState(30);

  // Selected members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    'user-1',
    'user-2',
    'user-3',
    'user-4',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateMeetingOpen) return null;

  const handleAddAgenda = () => {
    if (!newAgendaTitle) {
      showToast('خطا', 'لطفاً عنوان دستور جلسه را وارد کنید', 'error');
      return;
    }
    const newAg: AgendaItem = {
      id: `ag-${Date.now()}`,
      order: agendas.length + 1,
      rowNumber: agendas.length + 1,
      title: newAgendaTitle,
      presenter: newAgendaPresenter || 'دبیر جلسه',
      presenterName: newAgendaPresenter || 'دبیر جلسه',
      estimatedMinutes: newAgendaMinutes,
      allocatedMinutes: newAgendaMinutes,
      isDiscussed: false,
      status: 'PENDING',
    };
    setAgendas([...agendas, newAg]);
    setNewAgendaTitle('');
    setNewAgendaPresenter('');
  };

  const handleRemoveAgenda = (id: string) => {
    setAgendas(agendas.filter((a) => a.id !== id).map((a, idx) => ({ ...a, rowNumber: idx + 1 })));
  };

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showToast('خطا', 'عنوان جلسه الزامی است.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const members: MeetingMember[] = selectedMemberIds.map((uId) => {
        const u = mockUsers.find((user) => user.id === uId)!;
        return {
          userId: u.id,
          fullName: u.fullName,
          roleInMeeting: u.id === organizerId ? 'CHAIRMAN' : u.id === secretaryId ? 'SECRETARY' : 'MEMBER',
          organizationPosition: u.title,
          departmentName: u.departmentName,
          attendanceStatus: 'INVITED',
        };
      });

      const res = await meetingService.createMeeting({
        title,
        type,
        dateJalali,
        startTime,
        endTime,
        location,
        organizerId,
        secretaryId,
        departmentId,
        description,
        members,
        agendaItems: agendas,
        attachments: [],
      });

      if (res.isSuccess) {
        showToast('ثبت موفق', `جلسه "${res.data.title}" با شماره ${res.data.meetingNumber} ایجاد گردید.`, 'success');
        triggerRefresh();
        setIsCreateMeetingOpen(false);
      }
    } catch (err) {
      showToast('خطا', 'ثبت جلسه با خطا مواجه شد.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">برنامه‌ریزی و ایجاد جلسه جدید</h3>
              <p className="text-[11px] text-teal-200">ثبت اطلاعات زمان‌بندی، اعضا و دستور جلسه</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateMeetingOpen(false)}
            className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              اطلاعات پایه جلسه
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان جلسه *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: جلسه شورای راهبری فناوری اطلاعات و امنیت داده‌ها"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع جلسه</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MeetingType)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="BOARD">جلسه هیئت مدیره</option>
                  <option value="EXECUTIVE">جلسه هیئت عامل / اجرایی</option>
                  <option value="COMMISSION">جلسه کمیسیون تخصصی</option>
                  <option value="DEPARTMENTAL">جلسه داخلی واحد</option>
                  <option value="COORDINATION">جلسه هماهنگی بین‌بخشی</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">واحد برگزارکننده</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {mockDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاریخ برگزاری (جلالی)</label>
                <input
                  type="text"
                  value={dateJalali}
                  onChange={(e) => setDateJalali(e.target.value)}
                  placeholder="۱۴۰۳/۰۷/۰۵"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ساعت شروع</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ساعت پایان</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">مکان یا بستر جلسه</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="سالن جلسات یا لینک وب‌کنفرانس سازمانی"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Members Multi-select */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                اعضا و مدعوین جلسه ({selectedMemberIds.length} نفر انتخاب شده)
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {mockUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/70'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-700 text-white text-[11px] font-bold flex items-center justify-center">
                        {user.fullName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
                        <div className="text-[10px] text-slate-500">{user.title}</div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              دستور کار جلسه (Agendas)
            </h4>

            <div className="space-y-2">
              {agendas.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-[10px]">
                      {ag.rowNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{ag.title}</div>
                      <div className="text-[10px] text-slate-400">ارائه‌دهنده: {ag.presenterName} ({ag.allocatedMinutes} دقیقه)</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(ag.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new agenda row */}
            <div className="p-3 bg-teal-50/50 border border-teal-200/70 rounded-2xl space-y-2">
              <div className="text-[11px] font-bold text-teal-900">افزودن بند دستور جلسه جدید:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="عنوان موضوع دستور جلسه"
                  value={newAgendaTitle}
                  onChange={(e) => setNewAgendaTitle(e.target.value)}
                  className="sm:col-span-2 text-xs p-2 bg-white border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="ارائه‌دهنده"
                  value={newAgendaPresenter}
                  onChange={(e) => setNewAgendaPresenter(e.target.value)}
                  className="text-xs p-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAgenda}
                className="w-full py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن به دستور کار</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و یادداشت تکمیلی جلسه</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نکات قابل توجه پیش از شروع جلسه..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Footer Submit buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateMeetingOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'در حال ثبت جلسه...' : 'تایید و ایجاد جلسه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
