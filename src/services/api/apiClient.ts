/**
 * ASP.NET Core (.NET 8) Web API Client Abstraction
 * 
 * Provides a standardized HTTP client layer with:
 * - Simulated async delay & network realism
 * - Future endpoint routing to ASP.NET Core endpoints: /api/meetings, /api/resolutions, etc.
 * - Authorization Bearer token injection
 * - Unified ApiResponse<T> wrapper
 */

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  statusCode: number;
  errors?: string[];
}

export interface ApiFilterParams {
  searchTerm?: string;
  pageIndex?: number;
  pageSize?: number;
  status?: string;
  departmentId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  priority?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

class ApiClient {
  private baseUrl: string = '/api';
  private authToken: string | null = null;

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Helper to simulate async REST call with controllable latency
   */
  public async simulateNetwork<T>(data: T, delayMs: number = 200, shouldFail: boolean = false): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject({
            isSuccess: false,
            data: null as unknown as T,
            message: 'خطا در برقراری ارتباط با سرویس سرور',
            statusCode: 500,
            errors: ['Internal Server Error in ASP.NET Core service'],
          });
        } else {
          resolve({
            isSuccess: true,
            data,
            statusCode: 200,
          });
        }
      }, delayMs);
    });
  }
}

export const apiClient = new ApiClient();
