import { User, Department, Organization, ApiResponse, AppNotification } from '../types';
import { mockUsers, mockDepartments, mockOrganizations, mockNotifications } from '../mock/data';
import { apiClient } from './api/apiClient';
import { loadLocalCollection, saveLocalCollection } from './localStore';

export interface IUserService {
  getUsers(): Promise<ApiResponse<User[]>>;
  getUserById(id: string): Promise<ApiResponse<User | null>>;
  createUser(dto: Omit<User, 'id'>): Promise<ApiResponse<User>>;
  updateUser(id: string, dto: Omit<User, 'id'>): Promise<ApiResponse<User>>;
  getDepartments(): Promise<ApiResponse<Department[]>>;
  getOrganizations(): Promise<ApiResponse<Organization[]>>;
  getNotifications(userId?: string): Promise<ApiResponse<AppNotification[]>>;
  markNotificationAsRead(id: string): Promise<ApiResponse<boolean>>;
}

class MockUserService implements IUserService {
  private users: User[] = loadLocalCollection('users', mockUsers);
  private departments: Department[] = mockDepartments;
  private organizations: Organization[] = mockOrganizations;
  private notifications: AppNotification[] = loadLocalCollection('notifications', mockNotifications);

  public async getUsers(): Promise<ApiResponse<User[]>> {
    return apiClient.simulateNetwork(this.users, 100);
  }

  public async getUserById(id: string): Promise<ApiResponse<User | null>> {
    const user = this.users.find((u) => u.id === id) || null;
    return apiClient.simulateNetwork(user, 80);
  }

  public async createUser(dto: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...dto,
    };
    this.users.unshift(newUser);
    saveLocalCollection('users', this.users);
    return apiClient.simulateNetwork(newUser, 100);
  }

  public async updateUser(id: string, dto: Omit<User, 'id'>): Promise<ApiResponse<User>> {
    const index = this.users.findIndex((user) => user.id === id);
    if (index === -1) throw new Error('کاربر یافت نشد');
    this.users[index] = { id, ...dto };
    saveLocalCollection('users', this.users);
    return apiClient.simulateNetwork(this.users[index], 100);
  }

  public async getDepartments(): Promise<ApiResponse<Department[]>> {
    return apiClient.simulateNetwork(this.departments, 80);
  }

  public async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    return apiClient.simulateNetwork(this.organizations, 80);
  }

  public async getNotifications(userId?: string): Promise<ApiResponse<AppNotification[]>> {
    return apiClient.simulateNetwork(this.notifications, 80);
  }

  public async markNotificationAsRead(id: string): Promise<ApiResponse<boolean>> {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
    saveLocalCollection('notifications', this.notifications);
    return apiClient.simulateNetwork(true, 50);
  }
}

export const userService: IUserService = new MockUserService();
