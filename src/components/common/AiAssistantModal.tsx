import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User as UserIcon, 
  Copy, 
  Check, 
  RotateCcw, 
  Calendar, 
  FileCheck2, 
  CheckSquare, 
  BarChart3, 
  ArrowLeft,
  Clock,
  MapPin,
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { mockMeetings, mockResolutions, mockTasks, mockDepartments } from '../../mock/data';
import { toPersianDigits, getResolutionExecutionMeta, getPriorityMeta, getMeetingTypeLabel } from '../../utils/formatters';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  chartType?: 'RESOLUTIONS_STATUS' | 'DEPARTMENT_WORKLOAD' | 'MONTHLY_PROGRESS';
  meetingCards?: typeof mockMeetings;
  resolutionCards?: typeof mockResolutions;
  taskCards?: typeof mockTasks;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'bot',
    timestamp: 'هم‌اکنون',
    text: 'سلام! من دستیار هوشمند سازمانی سامانه مصوبات و جلسات هستم. شما می‌توانید هرگونه سوال، استعلام لیست جلسات، استعلام مصوبات یا درخواست رسم نمودارهای آماری را از من بپرسید.',
  },
];

const SUGGESTED_PROMPTS = [
  '📋 لیست جلسات اخیر رو بفرست',
  '📊 نمودار وضعیت مصوبات رو نشون بده',
  '⚡ مصوبات با اولویت بالا چی هستند؟',
  '🎯 وظایف منتظر اقدام من کدامند؟',
  '📈 نمودار عملکرد واحدها رو بکش',
  '⚠️ چه مصوباتی تاخیر دارند؟',
];

const PIE_COLORS = ['#0d9488', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];

export const AiAssistantModal: React.FC = () => {
  const { isAiAssistantOpen, setIsAiAssistantOpen, navigateTo, showToast, isDarkMode } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiAssistantOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isAiAssistantOpen, isTyping]);

  if (!isAiAssistantOpen) return null;

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      processAiResponse(query);
      setIsTyping(false);
    }, 700);
  };

  const processAiResponse = (query: string) => {
    const q = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    let botMsg: ChatMessage;

    // 1. Check for Charts / Graphs
    if (q.includes('نمودار') || q.includes('chart') || q.includes('گراف') || q.includes('رسم') || q.includes('آمار')) {
      if (q.includes('واحد') || q.includes('دپارتمان') || q.includes('عملکرد')) {
        botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: timeStr,
          text: 'در ادامه نمودار مقایسه عملکرد و حجم مصوبات به تفکیک واحدهای سازمانی را مشاهده می‌فرمایید. اداره کل فناوری اطلاعات بیشترین حجم مصوبات فعال را داراست:',
          chartType: 'DEPARTMENT_WORKLOAD',
        };
      } else {
        botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: timeStr,
          text: 'نمودار توزیع وضعیت مصوبات سازمانی بر اساس آخرین وضعیت داده‌های زنده برای شما آماده شد. در حال حاضر بیشترین سهم مربوط به مصوبات در حال اجرا و خاتمه‌یافته است:',
          chartType: 'RESOLUTIONS_STATUS',
        };
      }
    }
    // 2. Check for Meetings
    else if (q.includes('جلسه') || q.includes('جلسات') || q.includes('meeting') || q.includes('شورا') || q.includes('کمیسیون')) {
      const topMeetings = mockMeetings.slice(0, 4);
      botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: timeStr,
        text: `تعداد ${toPersianDigits(mockMeetings.length)} جلسه در سیستم ثبت شده است. در ادامه لیست جلسات اخیر همراه با تاریخ و محل برگزاری آورده شده است. با کلیک بر روی هر مورد می‌توانید پرونده کامل و صورتجلسه آن را مشاهده فرمایید:`,
        meetingCards: topMeetings,
      };
    }
    // 3. Check for Tasks
    else if (q.includes('وظیفه') || q.includes('وظایف') || q.includes('کارتابل') || q.includes('تکلیف') || q.includes('تکالیف') || q.includes('اقدام')) {
      const topTasks = mockTasks.slice(0, 3);
      botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: timeStr,
        text: 'لیست وظایف ارجاعی و تکالیف در دست اقدام شما به شرح زیر است. می‌توانید نسبت به ثبت گزارش پیشرفت و اعلام خاتمه اقدام کنید:',
        taskCards: topTasks,
      };
    }
    // 4. Check for Overdue or High Priority Resolutions
    else if (q.includes('تاخیر') || q.includes('فوری') || q.includes('حیاتی') || q.includes('اولویت') || q.includes('عقب')) {
      const criticalResolutions = mockResolutions.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH' || r.executionStatus === 'OVERDUE' || r.executionStatus === 'IN_PROGRESS');
      botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: timeStr,
        text: 'مصوبات با اولویت بالا و دارای حساسیت زمانی به شرح زیر شناسایی شدند. توجه ویژه به مهلت اقدام این موارد ضروری است:',
        resolutionCards: criticalResolutions.slice(0, 3),
      };
    }
    // 5. Check for Resolutions in general
    else if (q.includes('مصوبه') || q.includes('مصوبات') || q.includes('resolution')) {
      const topResolutions = mockResolutions.slice(0, 3);
      botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: timeStr,
        text: `بانک مصوبات سازمان شامل ${toPersianDigits(mockResolutions.length)} مصوبه است. آخرین مصوبات تصویب‌شده به شرح زیر است:`,
        resolutionCards: topResolutions,
      };
    }
    // 6. General / Fallback questions
    else {
      botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: timeStr,
        text: `در پاسخ به درخواست شما «${query}»:\n\nسامانه مدیریت جلسات و پیگیری مصوبات امکان پایش دقیق فرآیندها را از زمان طرح در دستور جلسه تا تصویب، ارجاع به مسئولین، ثبت گزارش اقدامات و صحه‌گذاری نهایی فراهم می‌کند.\n\nشما می‌توانید برای دریافت سریع اطلاعات، از گزینه‌های آماده زیر یا سوالات اختصاصی مانند «لیست جلسات»، «نمودار مصوبات» یا «وظایف من» استفاده فرمایید.`,
      };
    }

    setMessages((prev) => [...prev, botMsg]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('کپی در حافظه', 'متن پیام کپی شد.', 'info');
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    showToast('بازنشانی گفتگو', 'تاریخچه چت با دستیار هوشمند پاکسازی شد.', 'info');
  };

  // Prepare chart data
  const resolutionStatusData = [
    { name: 'خاتمه‌یافته', count: 18, fill: '#0d9488' },
    { name: 'در حال اجرا', count: 12, fill: '#3b82f6' },
    { name: 'در انتظار صحه‌گذاری', count: 6, fill: '#8b5cf6' },
    { name: 'دارای تاخیر', count: 4, fill: '#ef4444' },
    { name: 'ابلاغ شده', count: 8, fill: '#f59e0b' },
  ];

  const departmentWorkloadData = [
    { name: 'فناوری اطلاعات', count: 14 },
    { name: 'برنامه‌ریزی', count: 10 },
    { name: 'منابع انسانی', count: 7 },
    { name: 'امور مالی', count: 6 },
    { name: 'مرکز امنیت', count: 5 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full h-[88vh] max-h-[750px] overflow-hidden flex flex-col">
        
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-950 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-300 flex items-center justify-center text-slate-950 font-black shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white">دستیار هوشمند چت سازمانی</h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  آنلاین
                </span>
              </div>
              <p className="text-[10px] text-teal-200 font-medium">پاسخ به سوالات، ارسال لیست جلسات و رسم آنی نمودارها</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="text-teal-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="شروع مجدد گفتگو"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="text-teal-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="bg-slate-50 dark:bg-slate-850 p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-800 dark:hover:text-teal-300 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 transition-all cursor-pointer shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : 'bg-teal-700 text-white'
                }`}
              >
                {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-teal-800 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-1">
                  <span className={`text-[10px] font-bold ${msg.sender === 'user' ? 'text-teal-200' : 'text-teal-700 dark:text-teal-400'}`}>
                    {msg.sender === 'user' ? 'شما' : 'دستیار هوشمند'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] ${msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                    {msg.sender === 'bot' && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="کپی متن"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Text Content */}
                <div className="whitespace-pre-line text-[11px] sm:text-xs">
                  {msg.text}
                </div>

                {/* Embedded Charts (If generated) */}
                {msg.chartType === 'RESOLUTIONS_STATUS' && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                        توزیع وضعیت مصوبات سازمانی
                      </span>
                      <span className="text-[10px] text-teal-800 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                        مجموع: ۴۸ مصوبه
                      </span>
                    </div>

                    <div className="h-44 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={resolutionStatusData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                          <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                              fontSize: '11px',
                              borderRadius: '8px'
                            }} 
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {resolutionStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {msg.chartType === 'DEPARTMENT_WORKLOAD' && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                        حجم مصوبات در دست اقدام واحدها
                      </span>
                    </div>

                    <div className="h-44 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentWorkloadData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                          <XAxis type="number" tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                          <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fill: isDarkMode ? '#94a3b8' : '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                              borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                              fontSize: '11px',
                              borderRadius: '8px'
                            }} 
                          />
                          <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Embedded Meeting Cards */}
                {msg.meetingCards && (
                  <div className="mt-2.5 space-y-2">
                    {msg.meetingCards.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setIsAiAssistantOpen(false);
                          navigateTo('meeting-details', { meetingId: m.id });
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 truncate">
                            {m.title}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-teal-600" />
                              {toPersianDigits(m.dateJalali)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-600" />
                              {toPersianDigits(m.startTime)}
                            </span>
                            <span className="hidden sm:flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-teal-600" />
                              {m.location}
                            </span>
                          </div>
                        </div>

                        <button className="px-2.5 py-1 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 group-hover:bg-teal-700 group-hover:text-white transition-all shrink-0 flex items-center gap-1">
                          <span>مشاهده پرونده</span>
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Embedded Resolution Cards */}
                {msg.resolutionCards && (
                  <div className="mt-2.5 space-y-2">
                    {msg.resolutionCards.map((r) => {
                      const statusMeta = getResolutionExecutionMeta(r.executionStatus);
                      return (
                        <div
                          key={r.id}
                          onClick={() => {
                            setIsAiAssistantOpen(false);
                            navigateTo('resolutions');
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">
                              {r.title}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusMeta.bg}`}>
                              {statusMeta.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>مجری: {r.assigneeName}</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                              مهلت: {toPersianDigits(r.deadlineJalali)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Embedded Task Cards */}
                {msg.taskCards && (
                  <div className="mt-2.5 space-y-2">
                    {msg.taskCards.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsAiAssistantOpen(false);
                          navigateTo('tasks');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950/60 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="font-extrabold text-[11px] text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">
                            {t.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            پیشرفت: {toPersianDigits(t.progressPercentage)}٪ • مهلت: {toPersianDigits(t.deadlineJalali)}
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
                          ثبت اقدام
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-xs animate-pulse pr-2">
              <div className="w-6 h-6 rounded-xl bg-teal-700 text-white flex items-center justify-center text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span>دستیار هوشمند در حال تحلیل و پردازش داده‌ها...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="هر سوالی در مورد جلسات، مصوبات یا درخواست رسم نمودار دارید بنویسید..."
              className="flex-1 text-xs p-2.5 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-teal-800 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs p-2.5 px-4 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>ارسال</span>
              <Send className="w-3.5 h-3.5 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
