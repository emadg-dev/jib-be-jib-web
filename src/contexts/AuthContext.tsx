import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { SessionResponse, Trip, User } from '../api/services';
import { authApi, tripsApi } from '../api/services';

const MEMBER_DEFAULT_PERMISSIONS = [
  'dashboard.view',
  'member.view',
  'deposit.view',
  'withdrawal.create',
  'withdrawal.view',
  'settlement.view',
  'ratings.view',
  'ratings.submit',
];

type AuthContextType = {
  user: User | null; trips: Trip[]; selectedTrip: Trip | null; requiresTripSelection: boolean; loading: boolean;
  permissions: string[];
  login: (session: SessionResponse) => void;
  selectTrip: (id: string) => Promise<void>;
  createTrip: (data: { name: string; currency: string }) => Promise<string>;
  updateTrip: (id: string, data: { name: string; currency: string }) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshPermissions: () => Promise<void>;
  isAdmin: boolean; isOwner: boolean; isMember: boolean;
};
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
const payload = <T,>(response: any): T => response?.data ?? response;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [requiresTripSelection, setRequiresTripSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  const refreshPermissions = useCallback(async () => {
    if (!user) { setPermissions([]); return; }
    if (user.role === 'admin' || selectedTrip?.role === 'owner') {
      setPermissions([]);
      return;
    }
    setPermissions(MEMBER_DEFAULT_PERMISSIONS);
  }, [user, selectedTrip]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const applySession = (session: SessionResponse) => {
    setUser(session.user); const available = session.trips || []; setTrips(available);
    const activeTrips = available.filter(trip => trip.active !== false);
    const explicitlySelected = session.selected_trip || activeTrips.find(item => item.id === session.user?.trip_id);
    const trip = explicitlySelected || activeTrips.at(-1) || null;
    setSelectedTrip(trip);
    setRequiresTripSelection(!trip && session.requires_trip_selection);
  };
  useEffect(() => {
    authApi.me().then(async response => {
      const session = payload<SessionResponse>(response);
      applySession(session);
      try {
        const available = payload<Trip[]>(await tripsApi.available());
        setTrips(available);
        const hasSelectedTrip = session.selected_trip || session.user?.trip_id;
        if (!hasSelectedTrip) {
          const latest = available.filter(trip => trip.active !== false).at(-1);
          if (latest) {
            const result = payload<{ token: string; trip?: Trip }>(await tripsApi.select(latest.id));
            if (result.token) localStorage.setItem('token', result.token);
            setSelectedTrip(result.trip || latest);
            setRequiresTripSelection(false);
            window.dispatchEvent(new Event('trip-changed'));
          }
        }
      } catch { /* session trips remain available */ }
    }).catch(() => setUser(null)).finally(() => setLoading(false));
    const requireSelection = () => { setSelectedTrip(null); setRequiresTripSelection(true); };
    const refreshMembership = () => { authApi.me().then(response => applySession(payload<SessionResponse>(response))).catch(() => undefined); };
    window.addEventListener('trip-selection-required', requireSelection);
    window.addEventListener('owner-permission-required', refreshMembership);
    return () => { window.removeEventListener('trip-selection-required', requireSelection); window.removeEventListener('owner-permission-required', refreshMembership); };
  }, []);
  const activateLatestTrip = async (available: Trip[], session: SessionResponse) => {
    const hasSelectedTrip = session.selected_trip || session.user?.trip_id;
    const latest = available.filter(trip => trip.active !== false).at(-1);
    if (!hasSelectedTrip && latest) await selectTrip(latest.id);
  };
  const login = async (session: SessionResponse) => {
    applySession(session);
    try {
      const available = payload<Trip[]>(await tripsApi.available());
      setTrips(available);
      if (session.requires_trip_selection) {
        const latest = available.filter(trip => trip.active !== false).at(-1);
        if (latest) {
          const result = payload<{ token: string; trip?: Trip }>(await tripsApi.select(latest.id));
          if (result.token) localStorage.setItem('token', result.token);
          setSelectedTrip(result.trip || latest);
          setRequiresTripSelection(false);
          window.dispatchEvent(new Event('trip-changed'));
        }
      } else {
        await activateLatestTrip(available, session);
      }
    } catch { /* session trips remain available */ }
  };
  const selectTrip = async (id: string) => {
    const result = payload<{ token: string; trip?: Trip }>(await tripsApi.select(id));
    if (result.token) localStorage.setItem('token', result.token);
    setSelectedTrip(result.trip || trips.find(trip => trip.id === id) || null); setRequiresTripSelection(false);
    window.dispatchEvent(new Event('trip-changed'));
  };
  const createTrip = async (data: { name: string; currency: string }): Promise<string> => {
    const trip = payload<Trip>(await tripsApi.create(data));
    setTrips(current => [...current, trip]);
    return trip.id;
  };
  const updateTrip = async (id: string, data: { name: string; currency: string }) => {
    const updated = payload<Trip>(await tripsApi.update(id, data));
    setSelectedTrip(current => current ? { ...current, ...updated } : updated); setTrips(current => current.map(trip => trip.id === updated.id ? { ...trip, ...updated } : trip));
  };
  const deleteTrip = async (id: string) => {
    await tripsApi.delete(id);
    setTrips(current => current.filter(trip => trip.id !== id));
  };
  const logout = async () => { try { await authApi.logout(); } finally { localStorage.removeItem('token'); setUser(null); setTrips([]); setSelectedTrip(null); setRequiresTripSelection(false); setPermissions([]); } };
  const updateUser = (partial: Partial<User>) => setUser(u => u ? { ...u, ...partial } : u);
  const isAdmin = user?.role === 'admin';
  return <AuthContext.Provider value={{
    user, trips, selectedTrip, requiresTripSelection, loading, login,
    selectTrip, createTrip, updateTrip, deleteTrip, logout, updateUser,
    permissions, refreshPermissions,
    isAdmin,
    isOwner: isAdmin || selectedTrip?.role === 'owner',
    isMember: isAdmin || selectedTrip?.role === 'member'
  }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
