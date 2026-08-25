import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Send, Bot, Copy, Check, FileCheck2, ArrowRight } from 'lucide-react';

export const AiAssistantModal: React.FC = () => {
  const { isAiAssistantOpen, setIsAiAssistantOpen, showToast, navigateTo } = useApp();
  const [promptText, setPromptText] = useState('');
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'SUMMARIZE' | 'VERIFICATION_RULE'>('DRAFT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isAiAssistantOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    setGeneratedResult(null);

    setTimeout(() => {
      setIsGenerating(false);
      if (activeTab === 'DRAFT') {
        setGeneratedResult(`عنوان مصوبه: پیاده‌سازی زیرساخت احراز هویت دو مرحله‌ای (2FA) برای کلیه سامانه‌های حیاتی سازمان

شرح مصوبه:
با عنایت به گزارش ارزیابی امنیتی مرکز افتا و به‌منظور صیانت از داده‌های حساس سازمانی، مقرر گردید اداره کل فناوری اطلاعات با همکاری مرکز امنیت، تا پایان ماه جاری نسبت به پیاده‌سازی احراز هویت دومرحله‌ای بر بستر OTP پیامکی و توکن سخت‌افزاری اقدام نماید.

پیشنهاد ارجاعات:
۱. مجری اصلی: مهندس پوریا حسینی (اداره کل فناوری اطلاعات و ارتباطات)
۲. همکاران: مرکز امنیت اطلاعات و حراست

تنظیمات صحه‌گذاری پیشنهادی:
- نوع صحه‌گذاری: ترتیبی (Sequential)
- مرحله ۱: تایید فنی توسط رئیس مرکز امنیت اطلاعات (مهندس تقوی)
- مرحله ۲: تایید و خاتمه نهایی توسط معاونت برنامه‌ریزی (دکتر احمدی)`);
      } else if (activeTab === 'SUMMARIZE') {
        setGeneratedResult(`خلاصه اجرایی جلسه شورای راهبری:
- گزارش وضعیت پیشرفت ۹ پروژه کلیدی تحول دیجیتال بررسی شد.
- با تخصیص سرفصل اعتباری خرید تجهیزات دیتاسنتر شماره ۲ موافقت گردید.
- ۳ مصوبه اصلی در خصوص SSO، گواهینامه افتا و امنیت هویت تصویب و به واحدهای مربوطه ابلاغ شد.
- نرخ تحقق مصوبات جلسات گذشته به ۸۴ درصد ارتقا یافته است.`);
      } else {
        setGeneratedResult(`پیشنهاد زنجیره صحه‌گذاری (Verification Workflow):
با توجه به ماهیت مالی-فنی این موضوع، فرآیند ۲ مرحله‌ای ترتیبی توصیه می‌شود:
۱. مرحله اول: صحه‌گذاری فنی و تاییدیه تحویل کار توسط مدیر فناوری اطلاعات
۲. مرحله دوم: صحه‌گذاری مالی و انطباق با اسناد هزینه توسط مدیر کل امور مالی و ذی‌حساب
پس از اخذ هر دو تاییدیه، وضعیت مصوبه خودکار به «خاتمه یافته» تغییر می‌یابد.`);
      }
      showToast('پردازش هوشمند', 'پاسخ هوشمند با موفقیت تولید شد.', 'success');
    }, 1200);
  };

  const handleCopy = () => {
    if (generatedResult) {
      navigator.clipboard.writeText(generatedResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('کپی در حافظه', 'متن پیشنهادی در حافظه کپی شد.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-400 flex items-center justify-center text-slate-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">دستیار هوشمند مدیریت مصوبات و جلسات</h3>
              <p className="text-[11px] text-teal-200">دستیار AI سازمانی جهت خلاصه‌سازی و تدوین استاندارد مصوبات</p>
            </div>
          </div>
          <button
            onClick={() => setIsAiAssistantOpen(false)}
            className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-2 gap-2">
          <button
            onClick={() => { setActiveTab('DRAFT'); setGeneratedResult(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DRAFT' ? 'bg-white text-teal-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            تدوین متن مصوبه استاندارد
          </button>
          <button
            onClick={() => { setActiveTab('SUMMARIZE'); setGeneratedResult(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SUMMARIZE' ? 'bg-white text-teal-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            خلاصه‌سازی صورتجلسه
          </button>
          <button
            onClick={() => { setActiveTab('VERIFICATION_RULE'); setGeneratedResult(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VERIFICATION_RULE' ? 'bg-white text-teal-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            پیشنهاد زنجیره صحه‌گذاری
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {activeTab === 'DRAFT' && 'موضوع یا یادداشت‌های خام جلسه را وارد کنید:'}
              {activeTab === 'SUMMARIZE' && 'متن مذاکرات یا صورتجلسه را وارد کنید:'}
              {activeTab === 'VERIFICATION_RULE' && 'شرح وظیفه یا مصوبه را جهت تحلیل مراحل تایید وارد کنید:'}
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                activeTab === 'DRAFT'
                  ? 'مثال: جلسه در مورد فعال‌سازی احراز هویت دو مرحله‌ای در سامانه‌ها بود و تقوی و حسینی باید تا آخر ماه انجامش بدن...'
                  : 'متن خود را اینجا بنویسید...'
              }
              className="w-full text-xs p-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-5 rounded-2xl shadow-sm transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال پردازش هوشمند...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تولید هوشمند پیشنهاد</span>
                </>
              )}
            </button>
          </div>

          {generatedResult && (
            <div className="bg-slate-50 border border-teal-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <Bot className="w-4 h-4 text-teal-600" />
                  <span>نتیجه تولید شده توسط هوش مصنوعی:</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans bg-white p-3 rounded-xl border border-slate-100">
                {generatedResult}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>طراحی شده بر پایه هوش سازمانی برای تسریع تدوین مصوبات</span>
          <button
            onClick={() => setIsAiAssistantOpen(false)}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
