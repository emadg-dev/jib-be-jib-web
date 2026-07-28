import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const nav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Deposits', path: '/deposits', icon: ArrowDownToLine },
    { name: 'Withdrawals', path: '/withdrawals', icon: ArrowUpFromLine },
  ];

  return (
    <div className="flex h-screen bg-muted/20">
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 text-xl font-bold text-primary flex items-center gap-2">
          Jib-be-Jib ✈️
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.name} to={item.path} 
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                <Icon size={20} /> {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t flex justify-between items-center">
          <span className="text-sm font-medium">{user?.name}</span>
          <button onClick={logout} className="text-muted-foreground hover:text-destructive"><LogOut size={20} /></button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}