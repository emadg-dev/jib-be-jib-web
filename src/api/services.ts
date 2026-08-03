import { apiClient } from './client';

export interface Trip { id: string; name: string; currency: string; active?: boolean; role?: 'owner' | 'member'; }
export interface User { id: string; name: string; display_name?: string; role: 'owner' | 'member'; trip_id?: string; }
export interface SessionResponse { user: User; trips: Trip[]; requires_trip_selection: boolean; token?: string; selected_trip?: Trip; }
export interface Member { id: string; trip_id: string; name: string; display_name: string; role: string; active: boolean; created_at: string; }
export interface Deposit { id: string; trip_id: string; member_id: string; member_name: string; member_display_name?: string; amount: number; note: string; date?: string; created_at: string; }
export interface Beneficiary { withdrawal_id: string; member_id: string; member_name?: string; member_display_name?: string; share: number; }
export interface Withdrawal { id: string; trip_id: string; description: string; category: string; amount: number; date?: string; created_at: string; beneficiaries: Beneficiary[]; }
export interface Settlement { from: string; fromName: string; to: string; toName: string; amount: number; }
export interface DashboardData { currentBankBalance: number; totalDeposits: number; totalWithdrawals: number; members: { member_id: string; name: string; display_name?: string; total_deposited: number; total_expenses: number; balance: number; }[]; categories: { category: string; total: number; }[]; settlements: Settlement[]; }

export const authApi = {
  login: (data: { name: string; password: string }) => apiClient.post<SessionResponse>('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<SessionResponse>('/auth/me'),
};
export const tripsApi = {
  available: () => apiClient.get<Trip[]>('/trip/available'),
  select: (trip_id: string) => apiClient.post<{ token: string; trip?: Trip }>('/trip/select', { trip_id }),
  create: (data: { name: string; currency: string }) => apiClient.post<Trip>('/trip', data),
  get: () => apiClient.get<Trip>('/trip'),
  update: (data: Partial<Trip>) => apiClient.put<Trip>('/trip', data),
  delete: (id: string) => apiClient.delete(`/trip/delete/${id}`),
};
export const dashboardApi = { get: () => apiClient.get<DashboardData>('/dashboard') };
export const membersApi = {
  getAll: () => apiClient.get<Member[]>('/members'),
  create: (data: { name: string; display_name: string; password: string; role: string; active: boolean }) => apiClient.post('/members', data),
  add: (data: { member_id: string; role: string; active: boolean }) => apiClient.post('/members/add', data),
  update: (id: string, data: { name: string; display_name: string; password?: string; role: string; active: boolean }) => apiClient.put(`/members/${id}`, data),
  delete: (id: string) => apiClient.delete(`/members/${id}`),
};
export const depositsApi = { getAll: () => apiClient.get<Deposit[]>('/deposits'), create: (data: any) => apiClient.post('/deposits', data), update: (id: string, data: any) => apiClient.put(`/deposits/${id}`, data), delete: (id: string) => apiClient.delete(`/deposits/${id}`) };
export const withdrawalsApi = { getAll: () => apiClient.get<Withdrawal[]>('/withdrawals'), create: (data: any) => apiClient.post('/withdrawals', data), update: (id: string, data: any) => apiClient.put(`/withdrawals/${id}`, data), delete: (id: string) => apiClient.delete(`/withdrawals/${id}`) };
export const profileApi = {
  get: () => apiClient.get<User>('/profile'),
  changePassword: (data: { current_password: string; new_password: string }) => apiClient.put('/profile/password', data),
};
