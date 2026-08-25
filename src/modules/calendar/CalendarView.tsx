import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Clock, MapPin, Plus, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { mockMeetings } from '../../mock/data';
import { toPersianDigits, getMeetingTypeLabel } from '../../utils/formatters';

export const CalendarView: React.FC = () => {
  const { navigateTo, setIsCreateMeetingOpen } = useApp();
  const [currentMonth, setCurrentMonth] = useState('شهریور ۱۴۰۳');

  // Days in calendar month (Sample Persian month grid for شهریور)
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  // Map meetings to days
  const getMeetingsForDay = (day: number) => {
    if (day === 5) return [mockMeetings[0]];
    if (day === 12) return [mockMeetings[1]];
    if (day === 20) return [mockMeetings[2]];
    if (day === 28) return [mockMeetings[3]];
    return [];
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight">تقویم هوشمند جلسات</h1>
            <p className="text-xs text-slate-400 font-medium">نمای تقویمی جلسات، سالن‌های کنفرانس و مواعد مصوبات</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setCurrentMonth('مرداد ۱۴۰۳')}
              className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3">{currentMonth}</span>
            <button
              onClick={() => setCurrentMonth('مهر ۱۴۰۳')}
              className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCreateMeetingOpen(true)}
            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>رزرو و جلسه جدید</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/90 space-y-3">
        {/* Days of week header in Persian */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
          <div>شنبه</div>
          <div>یکشنبه</div>
          <div>دوشنبه</div>
          <div>سه‌شنبه</div>
          <div>چهارشنبه</div>
          <div>پنجشنبه</div>
          <div className="text-rose-500">جمعه</div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day) => {
            const dayMeetings = getMeetingsForDay(day);
            const isToday = day === 28;

            return (
              <div
                key={day}
                className={`min-h-[105px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                  isToday
                    ? 'bg-teal-50/70 border-teal-400 ring-2 ring-teal-300/30'
                    : dayMeetings.length > 0
                    ? 'bg-slate-50/80 border-slate-300/90'
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-teal-700 text-white' : 'text-slate-700'
                    }`}
                  >
                    {toPersianDigits(day)}
                  </span>
                  {dayMeetings.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  )}
                </div>

                <div className="space-y-1 my-1">
                  {dayMeetings.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => navigateTo('meeting-details', { meetingId: m.id })}
                      className="p-1.5 bg-teal-800 text-white rounded-xl text-[10px] font-bold truncate cursor-pointer hover:bg-teal-700 transition-colors shadow-xs"
                      title={m.title}
                    >
                      <div className="truncate">{m.title}</div>
                      <div className="text-[9px] text-teal-200">{toPersianDigits(m.startTime)}</div>
                    </div>
                  ))}
                </div>

                <div className="text-[9px] text-slate-400 text-left">
                  {dayMeetings.length > 0 ? `${toPersianDigits(dayMeetings.length)} جلسه` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
