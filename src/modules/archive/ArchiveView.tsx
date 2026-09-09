import React, { useEffect, useState } from 'react';
import { Archive, FolderPlus, Folder, Trash2, ChevronDown, ChevronUp, FilePlus2, X, Building2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { archiveService } from '../../services/archiveService';
import { proposalService } from '../../services/proposalService';
import { ArchiveFolder, ArchiveItem, Proposal } from '../../types';
import { toPersianDigits } from '../../utils/formatters';

type ArchiveTab = 'PERSONAL' | 'ORGANIZATION';

export const ArchiveView: React.FC = () => {
  const { currentUser, showToast, refreshTrigger, hasPermission } = useApp();
  const canViewOrgArchive = hasPermission('VIEW_ORGANIZATION_ARCHIVE');
  const canManageOrgFolders = hasPermission('MANAGE_ARCHIVE_FOLDERS');

  const [tab, setTab] = useState<ArchiveTab>('PERSONAL');
  const [folders, setFolders] = useState<ArchiveFolder[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [expandedFolderId, setExpandedFolderId] = useState<string | null>(null);
  const [folderItems, setFolderItems] = useState<Record<string, ArchiveItem[]>>({});
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);

  const canManageFolders = tab === 'PERSONAL' || canManageOrgFolders;

  const fetchFolders = async () => {
    const res = await archiveService.getFolders(tab, tab === 'PERSONAL' ? currentUser.departmentId : undefined);
    if (res.isSuccess) setFolders(res.data);
  };

  const fetchProposals = async () => {
    const res = await proposalService.getProposals({ pageSize: 1000 });
    if (res.isSuccess) setProposals(res.data.items);
  };

  useEffect(() => {
    fetchFolders();
    fetchProposals();
    setExpandedFolderId(null);
  }, [tab, refreshTrigger, currentUser.id]);

  const loadFolderItems = async (folderId: string) => {
    const res = await archiveService.getItems(folderId);
    if (res.isSuccess) setFolderItems((prev) => ({ ...prev, [folderId]: res.data }));
  };

  const toggleFolder = (folderId: string) => {
    if (expandedFolderId === folderId) {
      setExpandedFolderId(null);
      return;
    }
    setExpandedFolderId(folderId);
    loadFolderItems(folderId);
  };

  const handleCreateFolder = async () => {
    try {
      await archiveService.createFolder(newFolderName, tab, currentUser, tab === 'PERSONAL' ? currentUser.departmentId : undefined);
      showToast('ایجاد پوشه', `پوشه «${newFolderName.trim()}» ایجاد شد.`, 'success');
      setNewFolderName('');
      setIsNewFolderOpen(false);
      fetchFolders();
    } catch (error) {
      showToast('خطا', error instanceof Error ? error.message : 'ایجاد پوشه انجام نشد.', 'error');
    }
  };

  const handleDeleteFolder = async (folder: ArchiveFolder) => {
    if (!window.confirm(`پوشه «${folder.name}» و محتوای آن حذف شود؟`)) return;
    try {
      await archiveService.deleteFolder(folder.id, currentUser);
      showToast('حذف پوشه', `پوشه «${folder.name}» حذف شد.`, 'info');
      if (expandedFolderId === folder.id) setExpandedFolderId(null);
      fetchFolders();
    } catch (error) {
      showToast('خطا', error instanceof Error ? error.message : 'حذف پوشه انجام نشد.', 'error');
    }
  };

  const handleArchiveProposal = async (folderId: string, proposal: Proposal) => {
    try {
      await archiveService.archiveProposal(folderId, proposal.id, proposal.title, currentUser);
      showToast('افزودن به بایگانی', `«${proposal.title}» به پوشه اضافه شد.`, 'success');
      loadFolderItems(folderId);
      setPickerFolderId(null);
    } catch (error) {
      showToast('خطا', error instanceof Error ? error.message : 'افزودن به بایگانی انجام نشد.', 'error');
    }
  };

  const handleRemoveItem = async (folderId: string, item: ArchiveItem) => {
    await archiveService.removeItem(item.id);
    showToast('حذف از پوشه', `«${item.proposalTitle}» از پوشه حذف شد.`, 'info');
    loadFolderItems(folderId);
  };

  const eligibleProposals = proposals.filter((p) => tab === 'PERSONAL' ? p.proposerDepartmentId === currentUser.departmentId : true);
  const pickerAlreadyInFolder = new Set((pickerFolderId ? folderItems[pickerFolderId] : [])?.map((i) => i.proposalId));

  return (
    <div className="space-y-5 pb-12">
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100">
        <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Archive className="w-5 h-5 text-amber-500" />
          <span>بایگانی</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          ایجاد پوشه و انتقال پیشنهادهای مصوبات به آن برای دسته‌بندی و بازیابی آسان‌تر
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setTab('PERSONAL')}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              tab === 'PERSONAL' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>بایگانی واحد من</span>
          </button>
          {canViewOrgArchive && (
            <button
              onClick={() => setTab('ORGANIZATION')}
              className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                tab === 'ORGANIZATION' ? 'bg-teal-800 text-white border-teal-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>بایگانی سازمانی</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 space-y-3">
        {canManageFolders && (
          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="flex items-center gap-1.5 bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>پوشه جدید</span>
          </button>
        )}

        {folders.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">هنوز پوشه‌ای در این بخش ایجاد نشده است.</div>
        ) : (
          <div className="space-y-2.5">
            {folders.map((folder) => {
              const items = folderItems[folder.id] || [];
              const isExpanded = expandedFolderId === folder.id;
              return (
                <div key={folder.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-slate-50/70">
                    <button onClick={() => toggleFolder(folder.id)} className="flex items-center gap-2.5 cursor-pointer text-right flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">{folder.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">ایجادکننده: {folder.createdByName}</div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { setPickerFolderId(folder.id); if (!isExpanded) toggleFolder(folder.id); }}
                        className="p-1.5 rounded-lg text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        title="افزودن پیشنهاد به این پوشه"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                      </button>
                      {canManageFolders && (
                        <button
                          onClick={() => handleDeleteFolder(folder)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف پوشه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 space-y-2">
                      {pickerFolderId === folder.id && (
                        <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-teal-900">انتخاب پیشنهاد برای افزودن به پوشه</span>
                            <button onClick={() => setPickerFolderId(null)} className="text-teal-700 hover:text-teal-900 cursor-pointer"><X className="w-4 h-4" /></button>
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1.5">
                            {eligibleProposals.filter((p) => !pickerAlreadyInFolder.has(p.id)).length === 0 ? (
                              <div className="text-[11px] text-slate-400 py-2 text-center">پیشنهاد قابل افزودنی وجود ندارد.</div>
                            ) : eligibleProposals.filter((p) => !pickerAlreadyInFolder.has(p.id)).map((p) => (
                              <button
                                key={p.id}
                                onClick={() => handleArchiveProposal(folder.id, p)}
                                className="w-full text-right p-2 bg-white border border-slate-200 rounded-lg text-[11px] hover:border-teal-400 transition-colors cursor-pointer flex items-center justify-between gap-2"
                              >
                                <span className="truncate font-bold text-slate-700">{p.title}</span>
                                <span className="text-slate-400 shrink-0">{p.proposerDepartmentName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {items.length === 0 ? (
                        <div className="text-[11px] text-slate-400 py-3 text-center">این پوشه هنوز خالی است.</div>
                      ) : (
                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-200/90 rounded-xl">
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-800 truncate">{item.proposalTitle}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">افزوده‌شده توسط {item.movedByName}</div>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(folder.id, item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                                title="حذف از پوشه"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-teal-700" />
                پوشه جدید
              </h3>
              <button onClick={() => setIsNewFolderOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="نام پوشه، مثال: پیشنهادهای سال ۱۴۰۴"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button onClick={() => setIsNewFolderOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer">انصراف</button>
              <button onClick={handleCreateFolder} className="px-5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-700 text-white rounded-full shadow-xs cursor-pointer">ایجاد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
