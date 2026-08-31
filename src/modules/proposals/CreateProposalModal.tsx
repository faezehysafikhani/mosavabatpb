import React, { useState } from 'react';
import { X, Lightbulb, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { proposalService } from '../../services/proposalService';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, showToast, triggerRefresh } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isOfficeManager = currentUser.role === 'ADMIN' || currentUser.role === 'SECRETARY';
  const requiresOfficeReview = !isOfficeManager;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('خطا', 'عنوان و توضیحات الزامی است.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await proposalService.createProposal({
        title: title.trim(),
        description: description.trim(),
        proposerName: currentUser.fullName,
        proposerUserId: currentUser.id,
        proposerDepartmentId: currentUser.departmentId,
        proposerDepartmentName: currentUser.departmentName,
        dateJalali: '۱۴۰۳/۰۶/۲۸',
        requiresOfficeReview,
      });
      showToast(
        'ثبت مصوبه پیشنهادی',
        requiresOfficeReview ? 'برای بررسی به کارتابل مسئول دفتر ارسال شد.' : 'برای بررسی به کارتابل مدیرعامل ارسال شد.',
        'success'
      );
      setTitle('');
      setDescription('');
      triggerRefresh();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="app-modal-header text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-800 text-teal-200">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">ثبت مصوبه پیشنهادی جدید</h3>
              <p className="text-[11px] text-teal-200">
                {requiresOfficeReview ? 'برای بررسی مسئول دفتر و سپس تصمیم مدیرعامل ارسال می‌شود' : 'برای بررسی و تصمیم مدیرعامل ارسال می‌شود'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-teal-200 hover:text-white p-1 rounded-lg hover:bg-teal-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">عنوان *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="مثال: برگزاری دوره آموزشی امنیت سایبری"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات *</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="این موضوع چرا باید در جلسه مطرح و درباره آن تصمیم‌گیری شود؟"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer">
              انصراف
            </button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'در حال ارسال...' : requiresOfficeReview ? 'ارسال به کارتابل مسئول دفتر' : 'ارسال به کارتابل مدیرعامل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
