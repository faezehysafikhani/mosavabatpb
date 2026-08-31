import React, { useState, useEffect, useRef } from 'react';
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
  ChevronLeft,
  FileCheck2,
  ExternalLink,
  FileDown
} from 'lucide-react';
import { toPersianDigits, getMeetingTypeLabel, getMeetingStatusMeta, getResolutionExecutionMeta, getPriorityMeta } from '../../utils/formatters';
import { AttachmentList } from '../../components/common/AttachmentList';
import { TimelineView } from '../../components/common/TimelineView';
import { exportHtmlToPdf } from '../../utils/pdfExport';

interface MeetingDetailViewProps {
  meetingId: string;
  onOpenCreateResolution?: () => void;
}

export const MeetingDetailView: React.FC<MeetingDetailViewProps> = ({ meetingId }) => {
  const { navigateTo, showToast, refreshTrigger, openCreateResolutionModal, hasPermission } = useApp();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [activeTab, setActiveTab] = useState<'AGENDAS' | 'RESOLUTIONS' | 'MEMBERS' | 'ATTACHMENTS' | 'MINUTES_PRINT'>('AGENDAS');
  const [loading, setLoading] = useState(true);
  const printableRef = useRef<HTMLDivElement>(null);
  const canCreateResolution = hasPermission('CREATE_RESOLUTION');

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

  const handlePrintMinutesPreview = () => {
    window.print();
  };

  const handleExportMinutesPdf = () => {
    const html = printableRef.current?.innerHTML || '';
    const opened = exportHtmlToPdf(`صورتجلسه ${meeting?.meetingNumber || ''}`, html);
    showToast(opened ? 'خروجی PDF' : 'خطای خروجی', opened ? 'نسخه PDF صورتجلسه در پنجره جدید باز شد.' : 'مرورگر اجازه باز شدن پنجره PDF را نداد.', opened ? 'success' : 'error');
  };

  const handleRegisterResolutionForAgenda = (agendaId: string, agendaTitle: string) => {
    openCreateResolutionModal({
      meetingId: meeting?.id,
      agendaItemId: agendaId,
      topicTitle: agendaTitle,
    });
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
      <div className="no-print bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigateTo('meetings')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست جلسات</span>
        </button>

        {canCreateResolution && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreateResolutionModal({ meetingId: meeting.id })}
              className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت مصوبه جدید برای این جلسه</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Meeting Banner Header */}
      <div className="no-print bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
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
              <span>مکان جلسه</span>
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

      {/* Tabs Menu - Tab 1 is "دستور جلسه و مذاکرات" */}
      <div className="no-print flex border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('AGENDAS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'AGENDAS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>دستور جلسه و مذاکرات ({toPersianDigits(meeting.agendaItems.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('RESOLUTIONS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'RESOLUTIONS'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>مصوبات جلسه ({toPersianDigits(resolutions.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
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
          className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'MINUTES_PRINT'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>پیش‌نمایش چاپ صورتجلسه</span>
        </button>
      </div>

      {/* Tab 1: Agendas & Discussions with "ثبت مصوبه" button per agenda item (Requirement 9) */}
      {activeTab === 'AGENDAS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                بندهای دستور جلسه، شرح مذاکرات و صدور مستقیم مصوبه
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                شما می‌توانید در کنار هر بند دستور جلسه، اقدام به ثبت مصوبه متناظر با آن نمایید.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-bold">
              تعداد بندها: {toPersianDigits(meeting.agendaItems.length)}
            </span>
          </div>

          <div className="space-y-4">
            {meeting.agendaItems.map((ag) => {
              const relatedResolutions = resolutions.filter(
                (r) => r.agendaItemId === ag.id || r.topicTitle.toLowerCase().includes(ag.title.toLowerCase())
              );

              return (
                <div
                  key={ag.id}
                  className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 hover:border-teal-300 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-teal-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {toPersianDigits(ag.rowNumber)}
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{ag.title}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          ارائه‌دهنده: <strong className="text-teal-900">{ag.presenterName || ag.presenter}</strong> | 
                          مدت زمان: {toPersianDigits(ag.allocatedMinutes)} دقیقه
                        </div>
                      </div>
                    </div>

                    {/* Prominent Button: ثبت مصوبه برای این بند (Requirement 9) */}
                    {canCreateResolution && (
                      <button
                        onClick={() => handleRegisterResolutionForAgenda(ag.id, ag.title)}
                        className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4" />
                        <span>ثبت مصوبه برای این بند</span>
                      </button>
                    )}
                  </div>

                  {ag.outcomeNotes && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-teal-900 block mb-1">شرح مذاکرات و نتایج بررسی:</span>
                      {ag.outcomeNotes}
                    </div>
                  )}

                  {/* Linked Resolutions for this Agenda */}
                  {relatedResolutions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/70">
                      <div className="text-[11px] font-bold text-teal-900 mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>مصوبات صادرشده برای این بند ({toPersianDigits(relatedResolutions.length)} مورد):</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {relatedResolutions.map((r) => (
                          <span
                            key={r.id}
                            onClick={() => {
                              setActiveTab('RESOLUTIONS');
                            }}
                            className="inline-flex items-center gap-1.5 bg-white border border-teal-300 text-teal-900 text-xs font-bold py-1 px-3 rounded-xl cursor-pointer hover:bg-teal-50 shadow-2xs"
                          >
                            <span>{r.resolutionNumber}</span>
                            <span className="text-[11px] text-slate-500 truncate max-w-xs">({r.topicTitle})</span>
                            <ExternalLink className="w-3 h-3 text-teal-600" />
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Resolutions */}
      {activeTab === 'RESOLUTIONS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              مصوبات مصوب این جلسه
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              مجموعاً {toPersianDigits(resolutions.length)} مصوبه ثبت شده است.
            </span>
          </div>

          {resolutions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <p>هنوز هیچ مصوبه‌ای برای این جلسه ثبت نشده است.</p>
              {canCreateResolution && (
                <button
                  onClick={() => openCreateResolutionModal({ meetingId: meeting.id })}
                  className="inline-flex items-center gap-1.5 text-teal-800 font-bold text-xs hover:underline cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>اولین مصوبه را ثبت فرمایید</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {resolutions.map((res, index) => {
                const sMeta = getResolutionExecutionMeta(res.executionStatus);
                const pMeta = getPriorityMeta(res.priority);

                return (
                  <div
                    key={res.id}
                    onClick={() => navigateTo('resolutions', { resolutionId: res.id })}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:border-teal-400 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-teal-800 bg-teal-100/60 px-2.5 py-0.5 rounded-md">
                          بند {toPersianDigits(index + 1)}: {res.resolutionNumber}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${sMeta.bg}`}>
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
                        <div className="text-teal-800 font-bold flex items-center gap-1 mr-auto bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
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
                <div className="w-9 h-9 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center">
                  {member.fullName[0]}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{member.fullName}</div>
                  <div className="text-[11px] text-slate-500">{member.organizationPosition}</div>
                  <div className="text-[10px] text-teal-800 font-medium">{member.departmentName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Attachments */}
      {activeTab === 'ATTACHMENTS' && (
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/90">
          <AttachmentList attachments={meeting.attachments} />
        </div>
      )}

      {/* Tab 5: Official Minutes Preview & Print */}
      {activeTab === 'MINUTES_PRINT' && (
        <div className="space-y-3">
          <div className="no-print flex items-center justify-end gap-2">
            <button
              onClick={handlePrintMinutesPreview}
              title="چاپ صورتجلسه"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ</span>
            </button>
            <button
              onClick={handleExportMinutesPdf}
              title="نمایش نسخه PDF"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>

          <div ref={printableRef} className="bg-white rounded-3xl p-8 shadow-xs border border-slate-200/90 space-y-6 text-slate-900 printable-minutes">
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-base font-black">صورتجلسه رسمی مصوبات سازمان</h2>
            <p className="text-xs font-bold">شماره جلسه: {meeting.meetingNumber} | تاریخ: {toPersianDigits(meeting.dateJalali)}</p>
          </div>

          <div className="text-xs space-y-2">
            <p><strong>عنوان جلسه:</strong> {meeting.title}</p>
            <p><strong>مکان جلسه:</strong> {meeting.location}</p>
            <p><strong>زمان برگزاری:</strong> از ساعت {toPersianDigits(meeting.startTime)} لغایت {toPersianDigits(meeting.endTime)}</p>
            <p><strong>دبیر جلسه:</strong> {meeting.secretaryName}</p>
          </div>

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-black border-b border-slate-300 pb-1">مصوبات و تصمیمات اتخاذ شده:</h4>
            {resolutions.map((res, i) => (
              <div key={res.id} className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold">بند {toPersianDigits(i + 1)}: {res.topicTitle} ({res.resolutionNumber})</div>
                <div className="text-slate-700">{res.executionDescription || res.requestDescription}</div>
                <div className="text-[11px] text-slate-500">
                  مسئول اجرا: {res.mainResponsibleName} ({res.responsibleDepartmentName}) | مهلت: {toPersianDigits(res.deadlineJalali || '—')}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
            <div>امضای رئیس جلسه</div>
            <div>امضای دبیر جلسه</div>
            <div>مهر و امضای اعضای حاضر</div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};
