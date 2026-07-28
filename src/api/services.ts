import { apiClient } from './client';


export interface User { 
  id: string; 
  name: string; 
  role: 'owner' | 'member'; 
  trip_id?: string;
}

export interface Member { 
  id: string; 
  trip_id: string;
  name: string; 
  role: string; 
  created_at: string; 
}

export interface Deposit { 
  id: string; 
  trip_id: string;
  member_id: string; 
  member_name: string; 
  amount: number; 
  note: string; 
  created_at: string; 
}

export interface Beneficiary { 
  withdrawal_id: string; 
  member_id: string; 
  member_name?: string; 
  share: number; 
}

export interface Withdrawal { 
  id: string; 
  trip_id: string;
  description: string; 
  category: string; 
  amount: number; 
  created_at: string; 
  beneficiaries: Beneficiary[]; 
}

export interface Settlement { 
  from: string; 
  fromName: string; 
  to: string; 
  toName: string; 
  amount: number; 
}

export interface DashboardData {
  currentBankBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  members: { 
    member_id: string; 
    name: string; 
    total_deposited: number; 
    total_expenses: number; 
    balance: number; 
  }[];
  categories: { 
    category: string; 
    total: number; 
  }[];
  settlements: Settlement[];
}

export const authApi = {
  login: (data: any) => apiClient.post<User>('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get<User>('/auth/me'),
};

export const dashboardApi = {
  get: () => apiClient.get<DashboardData>('/dashboard'),
};

export const membersApi = {
  getAll: () => apiClient.get<Member[]>('/members'),
  create: (data: any) => apiClient.post('/members', data),
  delete: (id: string) => apiClient.delete(`/members/${id}`),
};

export const depositsApi = {
  getAll: () => apiClient.get<Deposit[]>('/deposits'),
  create: (data: any) => apiClient.post('/deposits', data),
  delete: (id: string) => apiClient.delete(`/deposits/${id}`),
};

export const withdrawalsApi = {
  getAll: () => apiClient.get<Withdrawal[]>('/withdrawals'),
  create: (data: any) => apiClient.post('/withdrawals', data),
  delete: (id: string) => apiClient.delete(`/withdrawals/${id}`),
};