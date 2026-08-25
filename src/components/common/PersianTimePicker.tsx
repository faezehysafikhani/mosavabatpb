import React from 'react';
import { Clock } from 'lucide-react';
import { toPersianDigits } from '../../utils/formatters';

interface PersianTimePickerProps {
  value: string; // e.g. "۰۹:۳۰" or "09:30"
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const TIME_OPTIONS = [
  '07:00', '07:30',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00',
];

export const PersianTimePicker: React.FC<PersianTimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className = '',
}) => {
  // Normalize value to English digits for standard select value
  const standardVal = value
    ? value.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    : '09:00';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={standardVal}
          disabled={disabled}
          onChange={(e) => onChange(toPersianDigits(e.target.value))}
          className="w-full text-xs p-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none font-bold text-slate-800 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          {TIME_OPTIONS.map((time) => (
            <option key={time} value={time}>
              {toPersianDigits(time)}
            </option>
          ))}
        </select>
        <Clock className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
      </div>
    </div>
  );
};
