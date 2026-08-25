import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { meetingService, resolutionService } from '../../services';
import { Meeting, Resolution } from '../../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  ArrowRight, 
  Printer, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Building,
  UserCheck,
  Layers,
  ChevronLeft
} from 'lucide-react';
import { toPersianDigits, getMeetingTypeLabel, getMeetingStatusMeta, getResolutionExecutionMeta, getPriorityMeta } from '../../utils/formatters';
import { AttachmentList } from '../../components/common/AttachmentList';
import { TimelineView } from '../../components/common/TimelineView';

interface MeetingDetailViewProps {
  meetingId: string;
  onOpenCreateResolution?: () => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({ meetingId, onOpenCreateResolution }) => {
  const { navigateTo, showToast, refreshTrigger } = useApp();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [activeTab, setActiveTab] = useState<'RESOLUTIONS' | 'AGENDAS' | 'MEMBERS' | 'ATTACHMENTS' | 'MINUTES_PRINT'>('RESOLUTIONS');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetingDetails();
  }, [meetingId, refreshTrigger]);

  const loadMeetingDetails = async () => {
    setLoading(true);
    try {
      const [meetRes, resRes] = await Promise.all([
        meetingService.getMeetingById(meetingId),
        resolutionService.getResolutions({ meetingId, pageSize: 50 }),
      ]);

      if (meetRes.isSuccess && meetRes.data) {
        setMeeting(meetRes.data);
      }
      if (resRes.isSuccess) {
        setResolutions(resRes.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintMinutes = () => {
    setActiveTab('MINUTES_PRINT');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  if (loading || !meeting) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-bold text-slate-600">در حال بارگذاری اطلاعات جلسه...</p>
      </div>
    );
  }

  const statusMeta = getMeetingStatusMeta(meeting.status);

  return (
    <div className="space-y-5 pb-16">
      {/* Top Navigation & Actions Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigateTo('meetings')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست جلسات</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintMinutes}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ صورتجلسه رسمی</span>
          </button>

          <button
            onClick={() => navigateTo('resolutions')}
            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت مصوبه جدید برای این جلسه</span>
          </button>
        </div>
      </div>

      {/* Main Meeting Banner Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200">
              {meeting.meetingNumber}
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {getMeetingTypeLabel(meeting.type)}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`}></span>
              <span>{statusMeta.label}</span>
            </span>
          </div>

          <div className="text-xs font-bold text-slate-400">
            شناسه سیستمی: <span className="font-mono">{meeting.id}</span>
          </div>
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
          {meeting.title}
        </h2>

        {meeting.description && (
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {meeting.description}
          </p>
        )}

        {/* Meeting Specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>تاریخ برگزاری</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800">{toPersianDigits(meeting.dateJalali)}</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>ساعت برگزاری</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800">
              {toPersianDigits(meeting.startTime)} الی {toPersianDigits(meeting.endTime)}
            </div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span>محل برگزاری</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800 truncate" title={meeting.location}>{meeting.location}</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>دبیر جلسه</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800">{meeting.secretaryName}</div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('RESOLUTIONS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'RESOLUTIONS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مصوبات جلسه ({toPersianDigits(resolutions.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('AGENDAS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'AGENDAS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دستور جلسه و مذاکرات ({toPersianDigits(meeting.agendaItems.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'MEMBERS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>اعضا و امضاکنندگان ({toPersianDigits(meeting.members.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('ATTACHMENTS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'ATTACHMENTS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>پیوست‌ها ({toPersianDigits(meeting.attachments.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('MINUTES_PRINT')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'MINUTES_PRINT'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>پیش‌نمایش چاپ صورتجلسه</span>
        </button>
      </div>

      {/* Tab 1: Resolutions inside meeting */}
      {activeTab === 'RESOLUTIONS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              مصوبات مصوب این جلسه
            </h3>
            <span className="text-xs text-slate-400">
              مجموعاً {toPersianDigits(resolutions.length)} مصوبه ثبت شده است.
            </span>
          </div>

          {resolutions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              هنوز هیچ مصوبه‌ای برای این جلسه ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {resolutions.map((res, index) => {
                const sMeta = getResolutionExecutionMeta(res.executionStatus);
                const pMeta = getPriorityMeta(res.priority);

                return (
                  <div
                    key={res.id}
                    onClick={() => navigateTo('resolutions')}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-teal-400 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-800 bg-teal-100/60 px-2.5 py-0.5 rounded-md">
                          بند {toPersianDigits(index + 1)}: {res.resolutionNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sMeta.bg}`}>
                          {sMeta.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pMeta.bg} ${pMeta.text}`}>
                          اولویت: {pMeta.label}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-teal-700 flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                        <span>مشاهده پرونده مصوبه</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 mb-1.5">{res.topicTitle}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {res.executionDescription || res.requestDescription}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <div>
                        مسئول اصلی: <strong className="text-slate-700">{res.mainResponsibleName || 'نامشخص'}</strong> ({res.responsibleDepartmentName})
                      </div>
                      <div>
                        مهلت اجرا: <strong className="text-slate-700">{toPersianDigits(res.deadlineJalali || '—')}</strong>
                      </div>
                      {res.verificationConfig?.requiresVerification && (
                        <div className="text-purple-700 font-bold flex items-center gap-1 mr-auto bg-purple-50 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>نیازمند صحه‌گذاری ({toPersianDigits(res.verificationConfig.steps.length)} مرحله)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Agendas */}
      {activeTab === 'AGENDAS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-3">
            بندهای دستور جلسه و شرح مذاکرات
          </h3>

          <div className="space-y-3">
            {meeting.agendaItems.map((ag) => (
              <div key={ag.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                      {toPersianDigits(ag.rowNumber)}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">{ag.title}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    زمان تخصیص‌یافته: {toPersianDigits(ag.allocatedMinutes)} دقیقه
                  </span>
                </div>

                <div className="text-xs text-slate-600 pr-8">
                  ارائه‌دهنده و گزارش‌گر بند: <strong className="text-slate-800">{ag.presenterName}</strong>
                </div>

                {ag.outcomeNotes && (
                  <div className="mr-8 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-teal-800 block mb-1">نتیجه مذاکرات و تصمیمات:</span>
                    {ag.outcomeNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Members */}
      {activeTab === 'MEMBERS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-3">
            فهرست اعضای حاضر و ارکان جلسه
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {meeting.members.map((member) => (
              <div
                key={member.userId}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center">
                  {member.fullName[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{member.fullName}</div>
                  <div className="text-[11px] text-slate-500">{member.organizationPosition}</div>
                  <div className="text-[10px] text-teal-700 font-semibold mt-0.5">
                    {member.roleInMeeting === 'CHAIRMAN' ? 'رئیس جلسه' : member.roleInMeeting === 'SECRETARY' ? 'دبیر جلسه' : 'عضو جلسه'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Attachments */}
      {activeTab === 'ATTACHMENTS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-100 pb-3">
            مستندات و فایل‌های پیوست جلسه
          </h3>
          <AttachmentList
            attachments={meeting.attachments}
            canUpload={true}
            onAddFiles={(newFiles) => {
              setMeeting({
                ...meeting,
                attachments: [...meeting.attachments, ...newFiles],
              });
            }}
          />
        </div>
      )}

      {/* Tab 5: Official Printable Minutes (صورتجلسه رسمی سازمان) */}
      {activeTab === 'MINUTES_PRINT' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-300 print:border-none print:shadow-none space-y-6 text-slate-900">
          <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
            <div className="text-sm font-bold text-slate-600">جمهوری اسلامی ایران</div>
            <h1 className="text-lg font-black text-slate-900">صورتجلسه رسمی {meeting.title}</h1>
            <div className="text-xs font-bold text-slate-500">شماره ثبت صورتجلسه: {meeting.meetingNumber}</div>
          </div>

          <div className="grid grid-cols-2 text-xs border border-slate-300 divide-x divide-x-reverse divide-slate-300 rounded-xl overflow-hidden">
            <div className="p-3 space-y-1">
              <div><strong>تاریخ:</strong> {toPersianDigits(meeting.dateJalali)}</div>
              <div><strong>زمان:</strong> {toPersianDigits(meeting.startTime)} الی {toPersianDigits(meeting.endTime)}</div>
              <div><strong>محل:</strong> {meeting.location}</div>
            </div>
            <div className="p-3 space-y-1">
              <div><strong>رئیس جلسه:</strong> {meeting.organizerName}</div>
              <div><strong>دبیر جلسه:</strong> {meeting.secretaryName}</div>
              <div><strong>واحد برگزارکننده:</strong> {meeting.departmentName}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-black bg-slate-100 p-2 rounded-lg border border-slate-200">
              خلاصه مصوبات تصویب‌شده
            </h3>
            <div className="space-y-2">
              {resolutions.map((res, i) => (
                <div key={res.id} className="p-3 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800">
                    بند {toPersianDigits(i + 1)}: {res.topicTitle} ({res.resolutionNumber})
                  </div>
                  <div className="text-slate-600">{res.executionDescription || res.requestDescription}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    مسئول اجرا: {res.mainResponsibleName} | مهلت اقدام: {toPersianDigits(res.deadlineJalali || '—')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures box */}
          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 mb-4 text-center">امضای اعضا و حاضرین جلسه:</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center text-xs">
              {meeting.members.map((m) => (
                <div key={m.userId} className="p-3 border border-dashed border-slate-300 rounded-xl h-24 flex flex-col justify-between">
                  <div className="font-bold text-slate-800">{m.fullName}</div>
                  <div className="text-[10px] text-slate-400">امضا دیجیتال / دستی</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
