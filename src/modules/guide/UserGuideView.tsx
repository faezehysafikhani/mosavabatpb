import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Layers, 
  Calendar, 
  FileCheck2, 
  CheckSquare, 
  ShieldCheck, 
  BarChart3, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  Info,
  Lightbulb,
  Building2,
  Users,
  Printer,
  Play,
  RotateCcw
} from 'lucide-react';
import { useApp, AppRoute } from '../../context/AppContext';
import { toPersianDigits } from '../../utils/formatters';

interface GuideSlide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  targetRoute?: AppRoute;
  actionTitle?: string;
  steps: {
    number: number;
    title: string;
    description: string;
  }[];
  keyTips: string[];
  quickSummary: string;
}

const GUIDE_SLIDES: GuideSlide[] = [
  {
    id: 1,
    title: 'معرفی جامع سامانه و جریان کاری کلان',
    subtitle: 'آشنایی با ساختار یکپارچه مدیریت جلسات، پیگیری مصوبات و صحه‌گذاری سازمانی',
    badge: 'بخش اول • ساختار کلی',
    icon: Layers,
    color: 'from-teal-800 to-slate-900',
    targetRoute: 'dashboard',
    actionTitle: 'مشاهده داشبورد مدیریتی',
    quickSummary: 'این سامانه تمام چرخه حیات مصوبات سازمانی را از لحظه تشکیل جلسه تا صدور، ارجاع، اجرای تکالیف، صحه‌گذاری و گزارش‌گیری تحت پوشش قرار می‌دهد.',
    steps: [
      {
        number: 1,
        title: 'برگزاری و اداره جلسات',
        description: 'ثبت جزئیات زمان، مکان، اعضای حاضر و بندهای دستور جلسه در یک محیط استاندارد.'
      },
      {
        number: 2,
        title: 'تصویب و ابلاغ مستقیم مصوبات',
        description: 'امکان صدور مستقیم مصوبه از کنار هر بند دستور جلسه همراه با تعیین مسئول و مهلت.'
      },
      {
        number: 3,
        title: 'پیگیری در کارتابل وظایف',
        description: 'انعکاس آنی مصوبات در کارتابل مسئولان مجری جهت ثبت گزارش اقدامات و پیوست اسناد.'
      },
      {
        number: 4,
        title: 'صحه‌گذاری و خاتمه هوشمند',
        description: 'تاییدات چندمرحله‌ای توسط مدیران و تغییر خودکار وضعیت مصوبه به خاتمه‌یافته.'
      }
    ],
    keyTips: [
      'داشبورد مدیریتی خلاصه وضعیت آماری، مصوبات فوری و جلسات پیش‌رو را به صورت زنده نمایش می‌دهد.',
      'نقش کاربری شما تعیین‌کننده دسترسی به منوها، کارتابل‌ها و امکان تایید مصوبات است.'
    ]
  },
  {
    id: 2,
    title: 'مدیریت جلسات و صدور مستقیم مصوبه',
    subtitle: 'راهنمای ثبت دستور کار، دعوت اعضا و ارتباط مصوبات با مذاکرات جلسه',
    badge: 'بخش دوم • جلسات',
    icon: Calendar,
    color: 'from-blue-800 to-indigo-900',
    targetRoute: 'meetings',
    actionTitle: 'ورود به بخش مدیریت جلسات',
    quickSummary: 'در صفحه جزئیات هر جلسه، تب پیش‌فرض به «دستور جلسه و مذاکرات» اختصاص دارد و دکمه اختصاصی برای صدور مصوبه تعبیه شده است.',
    steps: [
      {
        number: 1,
        title: 'ایجاد جلسه و تقویم هوشمند',
        description: 'روی روز مورد نظر در تقویم کلیک کنید تا فرم جلسه جدید با همان تاریخ باز شود.'
      },
      {
        number: 2,
        title: 'تعریف بندهای دستور کار',
        description: 'عناوین دستور جلسه، ارائه‌دهندگان و زمان تخصیص‌یافته را مشخص فرمایید.'
      },
      {
        number: 3,
        title: 'ثبت مصوبه متناظر با هر بند',
        description: 'با زدن دکمه «ثبت مصوبه برای این بند»، عنوان و اطلاعات جلسه به صورت خودکار قفل و بارگذاری می‌شود.'
      },
      {
        number: 4,
        title: 'چاپ صورتجلسه رسمی',
        description: 'با یک کلیک در بالای صفحه، پیش‌نمایش چاپی رسمی با جدول مصوبات و محل امضاها تولید می‌شود.'
      }
    ],
    keyTips: [
      'امکان ثبت چندین مصوبه مجزا برای یک بند دستور جلسه وجود دارد.',
      'وضعیت حضور و غیاب اعضا در تب اعضا ثبت و در صورتجلسه چاپی درج می‌گردد.'
    ]
  },
  {
    id: 3,
    title: 'صدور، ابلاغ و ارجاع مصوبات سازمانی',
    subtitle: 'نحوه تخصیص مسئول اصلی، مهلت اقدام و کنترل واحد سازمانی مجری',
    badge: 'بخش سوم • مصوبات',
    icon: FileCheck2,
    color: 'from-emerald-800 to-teal-950',
    targetRoute: 'resolutions',
    actionTitle: 'مشاهده بانک مصوبات',
    quickSummary: 'هنگام ثبت مصوبه، با انتخاب شخص مسئول، واحد سازمانی او به صورت خودکار شناسایی و قفل می‌گردد تا از خطای ارجاع جلوگیری شود.',
    steps: [
      {
        number: 1,
        title: 'تعیین وضعیت تصویب',
        description: 'مصوب و ابلاغ جهت اجرا، مصوب مشروط، یا ارجاع مجدد جهت اصلاح.'
      },
      {
        number: 2,
        title: 'تخصیص مسئول اصلی (Assignee)',
        description: 'انتخاب فرد مجری که بلافاصله واحد سازمانی او به عنوان مجری در فرم تکمیل و قفل می‌شود.'
      },
      {
        number: 3,
        title: 'تعیین تاریخ ابلاغ و مهلت اقدام',
        description: 'انتخاب روزهای شمسی از تقویم جلالی و تعیین سطح اولویت (عادی، متوسط، مهم، حیاتی).'
      },
      {
        number: 4,
        title: 'تنظیم زنجیره صحه‌گذاری',
        description: 'تعیین ترتیب و افراد تاییدکننده نهایی که پس از پایان کار توسط مجری باید کار را بررسی کنند.'
      }
    ],
    keyTips: [
      'مصوبات با اولویت حیاتی (Critical) در پیشخوان با برچسب هشدار قرمز تفکیک می‌شوند.',
      'تمامی سوابق تغییرات و تاییدات در تاریخچه مصوبه به صورت غیرقابل تغییر ثبت می‌گردد.'
    ]
  },
  {
    id: 4,
    title: 'کارتابل وظایف من و ثبت گزارش اقدامات',
    subtitle: 'راهنمای مجریان مصوبات برای بروزرسانی پیشرفت و ارسال برای صحه‌گذاری',
    badge: 'بخش چهارم • وظایف',
    icon: CheckSquare,
    color: 'from-amber-800 to-slate-900',
    targetRoute: 'tasks',
    actionTitle: 'مشاهده وظایف ارجاعی من',
    quickSummary: 'منوی «وظایف ارجاعی من» برای کلیه کاربران سازمان فعال است تا تکالیف و وظایف خود را مستقیماً مشاهده و پیگیری نمایند.',
    steps: [
      {
        number: 1,
        title: 'مشاهده وظایف در دست اقدام',
        description: 'فیلتر بر اساس فوریت، مهلت‌های نزدیک و وضعیت اجرای مصوبه.'
      },
      {
        number: 2,
        title: 'ثبت اقدامات و گزارش پیشرفت',
        description: 'وارد کردن درصد پیشرفت فیزیکی، توضیحات اقدامات انجام‌شده و تاریخ ثبت گزارش.'
      },
      {
        number: 3,
        title: 'درخواست تمدید مهلت',
        description: 'در صورت نیاز به زمان بیشتر، ثبت درخواست تمدید با ذکر دلایل توجیهی.'
      },
      {
        number: 4,
        title: 'اعلام اتمام و ارسال به صحه‌گذاری',
        description: 'با زدن دکمه «اعلام اتمام کار»، مصوبه خودکار وارد کارتابل صحه‌گذار مرحله اول می‌شود.'
      }
    ],
    keyTips: [
      'تعداد روزهای باقیمانده تا مهلت اقدام با رنگ‌بندی هشداردهنده مشخص است.',
      'پیوست فایل‌ها و مستندات تحویل کار از طریق فرم ثبت اقدام امکان‌پذیر است.'
    ]
  },
  {
    id: 5,
    title: 'کارتابل صحه‌گذاری و زنجیره تاییدات',
    subtitle: 'فرآیند اعتبارسنجی کیفی و فنی مصوبات توسط مدیران و مراجع ذی‌صلاح',
    badge: 'بخش پنجم • صحه‌گذاری',
    icon: ShieldCheck,
    color: 'from-purple-800 to-slate-900',
    targetRoute: 'approvals',
    actionTitle: 'ورود به کارتابل صحه‌گذاری',
    quickSummary: 'مکانیزم صحه‌گذاری تضمین می‌کند که هیچ مصوبه‌ای بدون تایید مدیران مربوطه به عنوان «خاتمه‌یافته» ثبت نشود.',
    steps: [
      {
        number: 1,
        title: 'ورود به کارتابل تاییدات',
        description: 'مشاهده مصوباتی که اجرای آنها توسط مجری پایان یافته و منتظر تایید شما هستند.'
      },
      {
        number: 2,
        title: 'بررسی گزارش و مستندات',
        description: 'مطالعه شرح اقدامات مجری و فایل‌های پیوست‌شده تحویل کار.'
      },
      {
        number: 3,
        title: 'تایید مرحله یا ارجاع جهت اصلاح',
        description: 'در صورت تایید، کار به مرحله بعد می‌رود؛ در صورت رد، با ثبت علت به کارتابل مجری بازمی‌گردد.'
      },
      {
        number: 4,
        title: 'تغییر خودکار وضعیت به خاتمه‌یافته',
        description: 'با تایید آخرین صحه‌گذار، وضعیت مصوبه در کل سامانه به عنوان خاتمه‌یافته قطعی ثبت می‌شود.'
      }
    ],
    keyTips: [
      'صحه‌گذاری می‌تواند به صورت ترتیبی (پله‌ای) یا موازی (همزمان) پیکربندی شود.',
      'امکان ثبت یادداشت‌های محرمانه و نظرات تکمیلی در هر مرحله وجود دارد.'
    ]
  },
  {
    id: 6,
    title: 'گزارش‌های عملکردی و داشبوردها',
    subtitle: 'پایش نرخ تحقق مصوبات، رتبه‌بندی واحدها و خروجی‌های آماری استاندارد',
    badge: 'بخش ششم • گزارشات',
    icon: BarChart3,
    color: 'from-cyan-900 to-slate-900',
    targetRoute: 'reports',
    actionTitle: 'مشاهده گزارش‌های عملکردی',
    quickSummary: 'گزارش‌های جامع آماری به مدیران ارشد امکان می‌دهد تا عملکرد هر اداره کل را در انجام به موقع تکالیف ارزیابی کنند.',
    steps: [
      {
        number: 1,
        title: 'شاخص‌های کلیدی (KPIs)',
        description: 'بررسی نرخ کل تحقق مصوبات، تعداد مصوبات در جریان و مصوبات با تاخیر.'
      },
      {
        number: 2,
        title: 'تحلیل عملکرد به تفکیک واحدها',
        description: 'مقایسه سرعت و کیفیت اجرای وظایف میان ادارات کل و معاونت‌ها.'
      },
      {
        number: 3,
        title: 'خروجی‌های اکسل و PDF',
        description: 'دریافت گزارش خام جهت ارائه‌های مدیریتی و ممیزی‌های سازمانی.'
      },
      {
        number: 4,
        title: 'فیلترهای پیشرفته زمانی',
        description: 'فیلتر بر اساس بازه‌های زمانی شمسی، نوع جلسه، اولویت و وضعیت اقدام.'
      }
    ],
    keyTips: [
      'واحدهایی که مصوبات با تاخیر بیش از ۱۵ روز دارند به صورت خودکار در گزارش ممیزی نشان‌دار می‌شوند.',
      'نمودارهای آماری به صورت تعاملی امکان کلیک و بررسی پرونده‌های زیرمجموعه را دارند.'
    ]
  },
  {
    id: 7,
    title: 'دستیار هوشمند مدیریت مصوبات (AI Assistant)',
    subtitle: 'پرسش و پاسخ زنده، تولید خودکار لیست جلسات و نمایش نمودارهای تحلیلی',
    badge: 'بخش هفتم • هوش مصنوعی',
    icon: Sparkles,
    color: 'from-teal-900 via-emerald-900 to-slate-950',
    actionTitle: 'گفتگو با دستیار هوشمند',
    quickSummary: 'دستیار هوشمند با پردازش زبان طبیعی قادر است سوالات شما را در خصوص جلسات و مصوبات پاسخ دهد و لیست‌ها و نمودارها را فوراً رسم کند.',
    steps: [
      {
        number: 1,
        title: 'درخواست لیست جلسات و مصوبات',
        description: 'کافی است بنویسید: «لیست جلسات اخیر رو بفرست» یا «مصوبات با اولویت بالا چی هستند؟»'
      },
      {
        number: 2,
        title: 'درخواست نمودار تحلیلی',
        description: 'با پیام «نمودار وضعیت مصوبات رو نشون بده»، نمودار تعاملی داخل چت ترسیم می‌شود.'
      },
      {
        number: 3,
        title: 'استعلام وظایف و تاخیرها',
        description: 'سوالاتی مانند «چه مصوباتی تاخیر دارند؟» یا «وظایف من چیست؟» را فوراً پاسخ می‌دهد.'
      },
      {
        number: 4,
        title: 'تدوین هوشمند متن مصوبه',
        description: 'پیش‌نویس مصوبات را بر اساس استانداردهای حقوقی و سازمانی بهینه و نگارش می‌کند.'
      }
    ],
    keyTips: [
      'دکمه دستیار هوشمند در پایین صفحه سمت چپ یا بالای نوار ناوبری همواره در دسترس است.',
      'پیشنهادات آماده گفتگو برای دسترسی فوق سریع در بالای چت‌باکس قرار داده شده است.'
    ]
  }
];

export const UserGuideView: React.FC = () => {
  const { navigateTo, setIsAiAssistantOpen } = useApp();
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const currentSlide = GUIDE_SLIDES[currentSlideIndex];
  const IconComponent = currentSlide.icon;

  const handleNext = () => {
    if (currentSlideIndex < GUIDE_SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleActionClick = () => {
    if (currentSlide.id === 7) {
      setIsAiAssistantOpen(true);
    } else if (currentSlide.targetRoute) {
      navigateTo(currentSlide.targetRoute);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-800 text-white shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              راهنمای جامع کاربری و فرآیندهای سامانه
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              مجموعه اسلایدهای آموزشی تعاملی برای آشنایی با امکانات جلسات، مصوبات، کارتابل و هوش مصنوعی
            </p>
          </div>
        </div>

        {/* Quick Navigation Slider Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentSlideIndex === 0}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="اسلاید قبل"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">قبلی</span>
          </button>

          <span className="text-xs font-extrabold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
            اسلاید {toPersianDigits(currentSlideIndex + 1)} از {toPersianDigits(GUIDE_SLIDES.length)}
          </span>

          <button
            onClick={handleNext}
            disabled={currentSlideIndex === GUIDE_SLIDES.length - 1}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="اسلاید بعد"
          >
            <span className="hidden sm:inline">بعدی</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Navigation Pills / Topics Bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-xs gap-1.5 overflow-x-auto">
        {GUIDE_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              currentSlideIndex === idx
                ? 'bg-teal-800 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[10px]">
              {toPersianDigits(idx + 1)}
            </span>
            <span>{slide.title.split(' ')[0]} {slide.title.split(' ')[1] || ''}</span>
          </button>
        ))}
      </div>

      {/* Active Slide Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden space-y-6">
        {/* Slide Hero Header */}
        <div className={`p-6 sm:p-8 bg-gradient-to-r ${currentSlide.color} text-white space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-xs">
              {currentSlide.badge}
            </span>
            <span className="text-xs text-white/80 font-mono">
              Step {currentSlideIndex + 1}/{GUIDE_SLIDES.length}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white/10 text-white backdrop-blur-xs shrink-0 hidden sm:block">
              <IconComponent className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-2xl font-black tracking-tight">{currentSlide.title}</h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{currentSlide.subtitle}</p>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="p-3.5 bg-black/20 rounded-2xl border border-white/10 text-xs text-teal-100 leading-relaxed flex items-center gap-2.5">
            <Lightbulb className="w-5 h-5 text-amber-300 shrink-0" />
            <span>{currentSlide.quickSummary}</span>
          </div>
        </div>

        {/* Slide Body: Steps Grid */}
        <div className="p-6 sm:p-8 space-y-6 pt-0">
          <div>
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              مراحل و گام‌های عملیاتی
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSlide.steps.map((step) => (
                <div
                  key={step.number}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0">
                      {toPersianDigits(step.number)}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-8">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Tips & Practical Advice */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-300">
              <Info className="w-4 h-4" />
              <span>نکات کلیدی و کاربردی برای این بخش:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed list-disc list-inside">
              {currentSlide.keyTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Footer Action Bar inside slide */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 text-xs font-bold transition-all cursor-pointer"
              >
                اسلاید قبلی
              </button>

              <button
                onClick={handleNext}
                disabled={currentSlideIndex === GUIDE_SLIDES.length - 1}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-700 text-white disabled:opacity-30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <span>اسلاید بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {currentSlide.actionTitle && (
              <button
                onClick={handleActionClick}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-700 dark:hover:bg-teal-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <IconComponent className="w-4 h-4" />
                <span>{currentSlide.actionTitle}</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
