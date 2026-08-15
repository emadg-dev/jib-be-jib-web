import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { ConfirmProvider } from './components/ConfirmDialog';
import LoadingScreen from './components/LoadingScreen';
import UpdatePrompt from './components/UpdatePrompt';
import AddToHomeScreen from './components/AddToHomeScreen';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Members from './pages/Members';
import Deposits from './pages/Deposits';
import Withdrawals from './pages/Withdrawals';
import TripPicker from './pages/TripPicker';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Ratings from './pages/Ratings';
import Settlements from './pages/Settlements';
import Finance from './pages/Finance';

const queryClient = new QueryClient();

function TripDataReset() {
  const client = useQueryClient();
  useEffect(() => {
    const reset = () => client.clear();
    window.addEventListener('trip-changed', reset);
    return () => window.removeEventListener('trip-changed', reset);
  }, [client]);
  return null;
}

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};


const RoleRoute = ({
  children,
  roles
}: {
  children: JSX.Element;
  roles: string[];
}) => {

  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};


const AppRoutes = () => {
  const { user, loading, selectedTrip, requiresTripSelection } = useAuth();
  const needsTrip = user && !loading && (requiresTripSelection || !selectedTrip);
  return (
  <Routes>
    <Route path="/login" element={user ? <Navigate to={needsTrip ? '/trips' : '/dashboard'} replace /> : <Login />} />
    <Route path="/" element={<ProtectedRoute>{needsTrip ? <Navigate to="/trips" replace /> : <AppLayout />}</ProtectedRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="trips" element={<TripPicker />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="members"element={<RoleRoute roles={['admin', 'owner']}><Members /></RoleRoute>}/>
      <Route path="finance" element={<Finance />} />
      <Route path="deposits" element={<Deposits />} />
      <Route path="withdrawals" element={<Withdrawals />} />
      <Route path="settings" element={<RoleRoute roles={['admin', 'owner']}><Settings /></RoleRoute>} />
      <Route path="settlements" element={<RoleRoute roles={['admin', 'owner']}><Settlements /></RoleRoute>} />
      <Route path="ratings" element={<Ratings />} />
      <Route path="profile" element={<Profile />} />
    </Route>
  </Routes>
  );
};



export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TripDataReset />
      <AuthProvider>
        <PreferencesProvider>
          <ConfirmProvider>
            <UpdatePrompt />
            <AddToHomeScreen />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ConfirmProvider>
        </PreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}