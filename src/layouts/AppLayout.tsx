import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut, Plane } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Deposits', path: '/deposits', icon: ArrowDownToLine },
    { name: 'Expenses', path: '/withdrawals', icon: ArrowUpFromLine },
  ];

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass-panel hidden w-72 flex-col border-y-0 border-l-0 rounded-none lg:fixed lg:inset-y-0 lg:flex">
        <Brand />
        <Navigation nav={nav} pathname={location.pathname} />
        <UserMenu name={user?.name} onLogout={logout} />
      </aside>

      <div className="min-w-0 flex-1 lg:ml-72">
        <header className="glass-panel sticky top-0 z-20 border-x-0 border-t-0 rounded-none px-4 py-3 sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3"><Brand compact /><button aria-label="Log out" onClick={logout} className="rounded-xl p-2 text-slate-500 transition hover:bg-white/70 hover:text-rose-600"><LogOut size={20} /></button></div>
          <Navigation nav={nav} pathname={location.pathname} mobile />
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 pb-10 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? 'flex items-center gap-2 text-lg font-bold text-slate-900' : 'flex items-center gap-3 px-7 py-8 text-xl font-bold text-slate-900'}><span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><Plane size={20} /></span>{!compact && <span>Jib-be-Jib</span>}{compact && <span>Jib-be-Jib</span>}</div>;
}

function Navigation({ nav, pathname, mobile = false }: any) {
  return <nav className={mobile ? 'mt-3 -mx-1 flex gap-1 overflow-x-auto pb-0.5' : 'flex flex-1 flex-col gap-1 px-4'} aria-label="Main navigation">
    {nav.map((item: any) => {
      const Icon = item.icon;
      const active = pathname.startsWith(item.path);
      return <Link key={item.name} to={item.path} className={`${mobile ? 'shrink-0 px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} flex items-center gap-2.5 rounded-xl font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-white/65 hover:text-indigo-700'}`}><Icon size={mobile ? 16 : 19} /><span>{item.name}</span></Link>;
    })}
  </nav>;
}

function UserMenu({ name, onLogout }: { name?: string; onLogout: () => void }) {
  return <div className="m-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/45 p-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700">{name?.slice(0, 1).toUpperCase() || 'U'}</div><span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{name}</span><button aria-label="Log out" onClick={onLogout} className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"><LogOut size={18} /></button></div>;
}
