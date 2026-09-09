/**
 * Folder-based archive for پیشنهاد مصوبات (proposals).
 *
 * Entirely separate from the CEO's "بایگانی" (CLOSED status) action in
 * proposalService — a folder here only groups *references* to existing
 * Proposal records for easier retrieval. It never reads or changes a
 * proposal's status/workflow.
 *
 * Two independent scopes, matching two different audiences:
 *  - PERSONAL: one per organizational department. Any user in that
 *    department can create folders and file their own department's
 *    proposals into them — no special permission required.
 *  - ORGANIZATION: a single shared, org-wide archive. Viewing it requires
 *    VIEW_ORGANIZATION_ARCHIVE; creating/deleting folders in it additionally
 *    requires MANAGE_ARCHIVE_FOLDERS.
 */
import { ArchiveFolder, ArchiveItem, ApiResponse, User } from '../types';
import { apiClient } from './api/apiClient';
import { loadLocalValue, saveLocalValue } from './localStore';

const FOLDERS_KEY = 'archiveFolders';
const ITEMS_KEY = 'archiveItems';

const getFoldersData = (): ArchiveFolder[] => loadLocalValue<ArchiveFolder[]>(FOLDERS_KEY, []);
const saveFoldersData = (folders: ArchiveFolder[]) => saveLocalValue(FOLDERS_KEY, folders);
const getItemsData = (): ArchiveItem[] => loadLocalValue<ArchiveItem[]>(ITEMS_KEY, []);
const saveItemsData = (items: ArchiveItem[]) => saveLocalValue(ITEMS_KEY, items);

export interface IArchiveService {
  getFolders(scope: 'PERSONAL' | 'ORGANIZATION', ownerDepartmentId?: string): Promise<ApiResponse<ArchiveFolder[]>>;
  createFolder(name: string, scope: 'PERSONAL' | 'ORGANIZATION', actor: User, ownerDepartmentId?: string): Promise<ApiResponse<ArchiveFolder>>;
  deleteFolder(id: string, actor: User): Promise<ApiResponse<void>>;
  getItems(folderId: string): Promise<ApiResponse<ArchiveItem[]>>;
  archiveProposal(folderId: string, proposalId: string, proposalTitle: string, actor: User): Promise<ApiResponse<ArchiveItem>>;
  removeItem(itemId: string): Promise<ApiResponse<void>>;
  getArchivedProposalIds(): Promise<ApiResponse<Set<string>>>;
}

class MockArchiveService implements IArchiveService {
  public async getFolders(scope: 'PERSONAL' | 'ORGANIZATION', ownerDepartmentId?: string): Promise<ApiResponse<ArchiveFolder[]>> {
    const folders = getFoldersData().filter((f) =>
      scope === 'ORGANIZATION' ? f.scope === 'ORGANIZATION' : f.scope === 'PERSONAL' && f.ownerDepartmentId === ownerDepartmentId
    );
    return apiClient.simulateNetwork(folders, 100);
  }

  public async createFolder(name: string, scope: 'PERSONAL' | 'ORGANIZATION', actor: User, ownerDepartmentId?: string): Promise<ApiResponse<ArchiveFolder>> {
    if (!name.trim()) throw new Error('نام پوشه الزامی است.');
    if (scope === 'ORGANIZATION' && !(actor.role === 'ADMIN' || actor.permissions?.includes('MANAGE_ARCHIVE_FOLDERS'))) {
      throw new Error('برای ایجاد پوشه در بایگانی سازمانی دسترسی لازم را ندارید.');
    }
    const folders = getFoldersData();
    const scopedSiblings = folders.filter((f) => f.scope === scope && (scope === 'PERSONAL' ? f.ownerDepartmentId === ownerDepartmentId : true));
    if (scopedSiblings.some((f) => f.name.trim() === name.trim())) {
      throw new Error('پوشه‌ای با همین نام از قبل وجود دارد.');
    }
    const folder: ArchiveFolder = {
      id: `arch-folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      scope,
      ownerDepartmentId: scope === 'PERSONAL' ? ownerDepartmentId : undefined,
      createdByUserId: actor.id,
      createdByName: actor.fullName,
      createdAt: new Date().toISOString(),
    };
    folders.unshift(folder);
    saveFoldersData(folders);
    return apiClient.simulateNetwork(folder, 100);
  }

  public async deleteFolder(id: string, actor: User): Promise<ApiResponse<void>> {
    const folders = getFoldersData();
    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error('پوشه یافت نشد.');
    if (folder.scope === 'ORGANIZATION' && !(actor.role === 'ADMIN' || actor.permissions?.includes('MANAGE_ARCHIVE_FOLDERS'))) {
      throw new Error('برای حذف پوشه در بایگانی سازمانی دسترسی لازم را ندارید.');
    }
    saveFoldersData(folders.filter((f) => f.id !== id));
    saveItemsData(getItemsData().filter((item) => item.folderId !== id));
    return apiClient.simulateNetwork(undefined as unknown as void, 100);
  }

  public async getItems(folderId: string): Promise<ApiResponse<ArchiveItem[]>> {
    const items = getItemsData().filter((item) => item.folderId === folderId);
    return apiClient.simulateNetwork(items, 80);
  }

  public async archiveProposal(folderId: string, proposalId: string, proposalTitle: string, actor: User): Promise<ApiResponse<ArchiveItem>> {
    const items = getItemsData();
    if (items.some((item) => item.folderId === folderId && item.proposalId === proposalId)) {
      throw new Error('این پیشنهاد از قبل در این پوشه بایگانی شده است.');
    }
    const item: ArchiveItem = {
      id: `arch-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      folderId,
      proposalId,
      proposalTitle,
      movedByUserId: actor.id,
      movedByName: actor.fullName,
      movedAt: new Date().toISOString(),
    };
    items.unshift(item);
    saveItemsData(items);
    return apiClient.simulateNetwork(item, 100);
  }

  public async removeItem(itemId: string): Promise<ApiResponse<void>> {
    saveItemsData(getItemsData().filter((item) => item.id !== itemId));
    return apiClient.simulateNetwork(undefined as unknown as void, 80);
  }

  public async getArchivedProposalIds(): Promise<ApiResponse<Set<string>>> {
    const ids = new Set(getItemsData().map((item) => item.proposalId));
    return apiClient.simulateNetwork(ids, 60);
  }
}

export const archiveService: IArchiveService = new MockArchiveService();
