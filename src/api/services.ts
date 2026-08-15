import { apiClient } from './client';

export interface Trip { id: string; name: string; currency: string; active?: boolean; role?: 'owner' | 'member'; }
export interface User { id: string; name: string; display_name?: string; role: 'owner' | 'member' | 'admin'; trip_id?: string; preferences?: Record<string, string | boolean>; avatar?: string; }
export interface SessionResponse { user: User; trips: Trip[]; requires_trip_selection: boolean; token?: string; selected_trip?: Trip; }
export interface Member { id: string; name: string; display_name: string; avatar?: string; role: string; active: boolean; created_at: string; }
export interface Deposit { id: string; trip_id: string; member_id: string; member_name: string; member_display_name?: string; amount: number; note: string; date?: string; created_at: string; }
export interface Beneficiary { withdrawal_id: string; member_id: string; member_name?: string; member_display_name?: string; member_avatar?: string; share: number; }
export interface Withdrawal { id: string; trip_id: string; description: string; category: string; amount: number; paid_by?: string | null; paid_by_name?: string | null; paid_by_avatar?: string | null; date?: string; created_at: string; beneficiaries: Beneficiary[]; }
export interface Settlement { from: string; fromName: string; to: string; toName: string; amount: number; }
export interface SettlementRecord { id: string; trip_id: string; member_id: string; member_name: string; amount: number; note: string; date?: string; created_at: string; }
export interface DashboardData { currentBankBalance: number; totalDeposits: number; totalWithdrawals: number; totalMemberPaid: number; totalSettled: number; members: { member_id: string; name: string; display_name?: string; avatar?: string; total_deposited: number; total_expenses: number; balance: number; }[]; categories: { category: string; total: number; }[]; settlements: Settlement[]; }
export interface TelegramEventSetting { enabled: boolean; message: string; }
export interface TelegramSettings { telegram_enabled: boolean; telegram_chat_id?: string; events: Record<string, TelegramEventSetting>; }
export type TelegramEventKey = 'trip_created' | 'trip_updated' | 'member_added' | 'deposit_created' | 'expense_created' | 'rating_submitted' | 'settlement_recorded' | 'members_report' | 'bank_stats_report' | 'settlements_report' | 'ratings_report';

export interface Ratee {
  id: string;
  display_name: string;
  avatar?: string;
  ethics: number | null;
  participation: number | null;
  flexibility: number | null;
  rated: boolean;
}

export interface RatingAggregate {
  ratee_id: string;
  display_name: string;
  avatar: string | null;
  ethics_avg: number;
  participation_avg: number;
  flexibility_avg: number;
  overall_avg: number;
  rated_by_count: number;
}

export interface RaterStatus {
  id: string;
  display_name: string;
  avatar: string | null;
  submitted: boolean;
}

export interface AllRating {
  rater_id: string;
  rater_name: string;
  rater_avatar: string | null;
  ratee_id: string;
  ratee_name: string;
  ratee_avatar: string | null;
  ethics: number;
  participation: number;
  flexibility: number;
  created_at: string;
}

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
  update: (id: string, data: { name: string; currency: string }) => apiClient.put<Trip>(`/trip/${id}`, data),
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
  updatePreferences: (data: Record<string, string | boolean>) => apiClient.put('/profile/preferences', data),
  uploadAvatar: (data: { avatar: string }) => apiClient.put('/profile/avatar', data),
  updateDisplayName: (data: { display_name: string }) => apiClient.put('/profile', data),
};
export const notificationsApi = {
  getSettings: () => apiClient.get<TelegramSettings>('/notifications/settings'),
  updateSettings: (data: { telegram_enabled: boolean; telegram_chat_id?: string; events?: Record<string, Partial<TelegramEventSetting>> }) => apiClient.put('/notifications/settings', data),
  sendTest: (data: { chat_id: string; title?: string; message: string }) => apiClient.post<{ delivered: boolean }>('/notifications/telegram/test', data),
  sendCustom: (data: { message: string }) => apiClient.post<{ delivered: boolean }>('/notifications/telegram/send', data),
  sendMembers: () => apiClient.post<{ delivered: boolean }>('/notifications/telegram/members'),
  sendBankStats: () => apiClient.post<{ delivered: boolean }>('/notifications/telegram/bank-stats'),
  sendSettlements: () => apiClient.post<{ delivered: boolean }>('/notifications/telegram/settlements'),
  sendRatings: () => apiClient.post<{ delivered: boolean }>('/notifications/telegram/ratings'),
};

export const ratingsApi = {
  getRatees: () => apiClient.get<Ratee[]>('/ratings/ratees'),
  submit: (data: { ratee_id: string; ethics: number; participation: number; flexibility: number }) => apiClient.post('/ratings', data),
  getResults: () => apiClient.get<RatingAggregate[]>('/ratings/results'),
  getStatus: () => apiClient.get<RaterStatus[]>('/ratings/status'),
  getAll: () => apiClient.get<AllRating[]>('/ratings/all'),
};

export const settlementsApi = {
  getAll: () => apiClient.get<SettlementRecord[]>('/settlements'),
  create: (data: { member_id: string; amount: number; note?: string; date?: string }) => apiClient.post('/settlements', data),
  update: (id: string, data: { member_id: string; amount: number; note?: string; date?: string }) => apiClient.put(`/settlements/${id}`, data),
  delete: (id: string) => apiClient.delete(`/settlements/${id}`),
};
