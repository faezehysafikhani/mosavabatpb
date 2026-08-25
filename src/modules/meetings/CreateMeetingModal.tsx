import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { meetingService } from '../../services/meetingService';
import { mockDepartments } from '../../mock/data';
import { PersianDatePicker } from '../../components/common/PersianDatePicker';
import { PersianTimePicker } from '../../components/common/PersianTimePicker';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Users, FileText, CheckCircle2, Search, UserCheck } from 'lucide-react';
import { MeetingType, MeetingMember, AgendaItem } from '../../types';

export const CreateMeetingModal: React.FC = () => {
  const { 
    isCreateMeetingOpen, 
    setIsCreateMeetingOpen, 
    createMeetingInitialDate,
    availableUsers, 
    showToast, 
    triggerRefresh 
  } = useApp();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<MeetingType>('COMMISSION');
  const [dateJalali, setDateJalali] = useState(createMeetingInitialDate || '۱۴۰۳/۰۷/۰۵');
  const [startTime, setStartTime] = useState('۰۹:۰۰');
  const [endTime, setEndTime] = useState('۱۱:۳۰');
  const [location, setLocation] = useState('سالن کنفرانس طبقه چهارم');
  const [departmentId, setDepartmentId] = useState('dept-1');
  const [organizerId, setOrganizerId] = useState('user-1');
  const [secretaryId, setSecretaryId] = useState('user-8');
  const [description, setDescription] = useState('');

  // Sync dateJalali when modal opens with custom initial date
  useEffect(() => {
    if (isCreateMeetingOpen && createMeetingInitialDate) {
      setDateJalali(createMeetingInitialDate);
    }
  }, [isCreateMeetingOpen, createMeetingInitialDate]);

  // Agenda items
  const [agendas, setAgendas] = useState<AgendaItem[]>([
    {
      id: 'ag-1',
      rowNumber: 1,
      order: 1,
      title: 'بررسی گزارش دوره‌ای پروژه‌های اولویت‌دار',
      presenter: 'مهندس پوریا حسینی',
      presenterName: 'مهندس پوریا حسینی',
      allocatedMinutes: 30,
      estimatedMinutes: 30,
      isDiscussed: false,
      status: 'PENDING',
    },
    {
      id: 'ag-2',
      rowNumber: 2,
      order: 2,
      title: 'بررسی درخواست تخصیص اعتبار خرید تجهیزات زیرساخت شبکه',
      presenter: 'مهندس سعید تقوی',
      presenterName: 'مهندس سعید تقوی',
      allocatedMinutes: 45,
      estimatedMinutes: 45,
      isDiscussed: false,
      status: 'PENDING',
    },
  ]);

  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaPresenterId, setNewAgendaPresenterId] = useState('');
  const [newAgendaMinutes, setNewAgendaMinutes] = useState(30);

  // Selected members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([
    'user-1',
    'user-2',
    'user-3',
    'user-8',
  ]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter available users for search in members
  const filteredUsers = useMemo(() => {
    if (!memberSearchQuery.trim()) return availableUsers;
    const q = memberSearchQuery.toLowerCase();
    return availableUsers.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q) ||
        u.departmentName.toLowerCase().includes(q) ||
        u.nationalCode.includes(q)
    );
  }, [availableUsers, memberSearchQuery]);

  const selectedUsers = useMemo(() => {
    return availableUsers.filter((u) => selectedMemberIds.includes(u.id));
  }, [availableUsers, selectedMemberIds]);

  if (!isCreateMeetingOpen) return null;

  const handleAddAgenda = () => {
    if (!newAgendaTitle.trim()) {
      showToast('خطا', 'لطفاً عنوان دستور جلسه را وارد کنید', 'error');
      return;
    }

    const selectedPresenter = availableUsers.find((u) => u.id === newAgendaPresenterId);
    const presenterName = selectedPresenter ? selectedPresenter.fullName : 'دبیر جلسه';

    const newAg: AgendaItem = {
      id: `ag-${Date.now()}`,
      order: agendas.length + 1,
      rowNumber: agendas.length + 1,
      title: newAgendaTitle.trim(),
      presenter: presenterName,
      presenterName: presenterName,
      estimatedMinutes: Number(newAgendaMinutes) || 30,
      allocatedMinutes: Number(newAgendaMinutes) || 30,
      isDiscussed: false,
      status: 'PENDING',
    };
    setAgendas([...agendas, newAg]);
    setNewAgendaTitle('');
    setNewAgendaPresenterId('');
    setNewAgendaMinutes(30);
  };

  const handleRemoveAgenda = (id: string) => {
    setAgendas(agendas.filter((a) => a.id !== id).map((a, idx) => ({ ...a, rowNumber: idx + 1, order: idx + 1 })));
  };

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const removeMember = (userId: string) => {
    setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('خطا', 'عنوان جلسه الزامی است.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const members: MeetingMember[] = selectedMemberIds.map((uId) => {
        const u = availableUsers.find((user) => user.id === uId) || availableUsers[0];
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
        title: title.trim(),
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">برنامه‌ریزی و ایجاد جلسه جدید</h3>
              <p className="text-[11px] text-teal-200">ثبت اطلاعات زمان‌بندی، اعضا، مدعوین و دستور جلسات</p>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان جلسه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: جلسه بررسی استراتژی مهاجرت به سرویس‌های ابری و امنیت داده‌ها"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع جلسه</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MeetingType)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                >
                  {mockDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Jalali Date Picker */}
              <div>
                <PersianDatePicker
                  label="تاریخ برگزاری جلسه"
                  value={dateJalali}
                  onChange={setDateJalali}
                />
              </div>

              {/* Start & End Time Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <PersianTimePicker
                    label="ساعت شروع"
                    value={startTime}
                    onChange={setStartTime}
                  />
                </div>
                <div>
                  <PersianTimePicker
                    label="ساعت پایان"
                    value={endTime}
                    onChange={setEndTime}
                  />
                </div>
              </div>

              {/* Location (مکان جلسه) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">مکان جلسه</label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="مثال: سالن جلسات شماره ۱ یا لینک وب‌کنفرانس سازمانی"
                    className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Members & Invitees Multi-select with Search and Chips */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                اعضا و مدعوین جلسه ({selectedMemberIds.length} نفر انتخاب شده)
              </span>
            </h4>

            {/* Selected Members Chips */}
            {selectedUsers.length > 0 && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[11px] font-bold text-slate-600 mb-2">افراد انتخاب‌شده:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 bg-teal-100/90 text-teal-900 border border-teal-300 text-[11px] font-medium py-1 px-2.5 rounded-full shadow-2xs"
                    >
                      <span className="w-4 h-4 rounded-full bg-teal-800 text-white text-[9px] font-bold flex items-center justify-center">
                        {u.fullName[0]}
                      </span>
                      <span>{u.fullName}</span>
                      <span className="text-[10px] text-teal-700">({u.title})</span>
                      <button
                        type="button"
                        onClick={() => removeMember(u.id)}
                        className="hover:bg-teal-200 text-teal-800 rounded-full p-0.5 ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Member Search input */}
            <div className="relative">
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="جستجو در نام کاربر، سمت سازمانی یا واحد..."
                className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-3" />
            </div>

            {/* Users grid selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-white">
              {filteredUsers.map((user) => {
                const isSelected = selectedMemberIds.includes(user.id);
                return (
                  <div
                    key={user.id}
                    onClick={() => toggleMember(user.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/80 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-800 text-white text-[11px] font-bold flex items-center justify-center">
                        {user.fullName[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{user.fullName}</div>
                        <div className="text-[10px] text-slate-500">{user.title} - {user.departmentName}</div>
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 shrink-0"></div>
                    )}
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

            {/* Add new agenda row (FIRST) */}
            <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-teal-700" />
                <span>افزودن بند دستور جلسه جدید:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">عنوان موضوع دستور جلسه</label>
                  <input
                    type="text"
                    placeholder="مثال: بررسی طرح توسعه شبکه و امنیت زیرساخت"
                    value={newAgendaTitle}
                    onChange={(e) => setNewAgendaTitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ارائه‌دهنده</label>
                  <select
                    value={newAgendaPresenterId}
                    onChange={(e) => setNewAgendaPresenterId(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  >
                    <option value="">انتخاب ارائه‌دهنده از فهرست کاربران...</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">مدت (دقیقه)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    step={5}
                    value={newAgendaMinutes}
                    onChange={(e) => setNewAgendaMinutes(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddAgenda}
                className="w-full py-2 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن بند به دستور کار جلسه</span>
              </button>
            </div>

            {/* List of Agendas (SECOND) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-600">فهرست بندهای ثبت‌شده ({agendas.length} بند):</div>
              {agendas.map((ag) => (
                <div
                  key={ag.id}
                  className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs hover:border-teal-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {ag.rowNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-800">{ag.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ارائه‌دهنده: <strong className="text-teal-900">{ag.presenterName || ag.presenter}</strong> ({ag.allocatedMinutes} دقیقه)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAgenda(ag.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                    title="حذف بند دستور جلسه"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreateMeetingOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'در حال ثبت جلسه...' : 'تایید و ایجاد جلسه'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
