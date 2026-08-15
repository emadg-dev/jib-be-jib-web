import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { dashboardApi, ratingsApi } from '../api/services';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut, Languages, Moon, Sun, Map, User, Settings, Star } from 'lucide-react';
import Avatar from '../components/Avatar';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [permissionNotice, setPermissionNotice] = useState(false);
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const location = useLocation();
  const fa = language === 'fa';
  useEffect(() => { const show = () => setPermissionNotice(true); window.addEventListener('owner-permission-required', show); return () => window.removeEventListener('owner-permission-required', show); }, []);

  const { data: ratingsStatusRes } = useQuery({
    queryKey: ['ratings', 'status'],
    queryFn: ratingsApi.getStatus,
  });

  const ratingsStatus = ratingsStatusRes?.data || [];
  const myStatus = ratingsStatus.find((m: any) => m.id === user?.id);
  const isAdminOrOwner = user?.role === 'owner' || user?.role === 'admin';
  const showRatingsTab = isAdminOrOwner || !myStatus?.submitted;

  const nav = [
    { name: fa ? 'داشبورد' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'owner', 'member'] },
    { name: fa ? 'اعضا' : 'Members', path: '/members', icon: Users, roles: ['admin', 'owner'] },
    { name: fa ? 'واریزها' : 'Deposits', path: '/deposits', icon: ArrowDownToLine, roles: ['admin', 'owner', 'member'] },
    { name: fa ? 'هزینه‌ها' : 'Expenses', path: '/withdrawals', icon: ArrowUpFromLine, roles: ['admin', 'owner', 'member'] },
    { name: fa ? 'ارزیابی' : 'Ratings', path: '/ratings', icon: Star, roles: ['admin', 'owner', 'member'], hidden: !showRatingsTab },
    { name: fa ? 'سفرها' : 'Trips', path: '/trips', icon: Map, roles: ['admin', 'owner', 'member'] },
    { name: fa ? 'تنظیمات' : 'Settings', path: '/settings', icon: Settings, roles: ['admin', 'owner'] },
  ];
  const controls = { language, theme, toggleLanguage, toggleTheme, logout, fa };

  const filteredNav = nav.filter(x => x.roles.includes(String(user?.role)) && !x.hidden);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass-panel hidden w-72 flex-col border-y-0 border-l-0 rounded-none lg:fixed lg:inset-y-0 lg:flex">
        <Brand />
        <Navigation
          nav={filteredNav}
          pathname={location.pathname}
        />
        <UserMenu name={user?.display_name} avatar={user?.avatar} {...controls} />
        <div className="px-4 py-4 text-center text-xs text-muted-foreground/60">
          Made with <span className="inline-block text-red-500 animate-pulse">♥</span> by Emzi and MiMo
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:ml-72 rtl:lg:mr-72 rtl:lg:ml-0">
        <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:hidden">
          <div className="glass-panel rounded-2xl px-5 py-2">
            <Brand compact />
          </div>
          <div className="glass-panel rounded-2xl px-2 py-1.5">
            <HeaderControls {...controls} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 pt-20 pb-28 sm:px-6 sm:pt-20 sm:pb-28 lg:p-8 lg:pb-8 lg:pt-8">
          {permissionNotice && (
            <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Owner permission required
              <button onClick={() => setPermissionNotice(false)} className="ms-4 underline">Dismiss</button>
            </div>
          )}
          <Outlet />
          <footer className="mt-12 pb-4 text-center text-xs text-muted-foreground/60">
            Made with <span className="inline-block text-red-500 animate-pulse">♥</span> by Emzi and MiMo
          </footer>
        </main>
      </div>
      <BottomDock nav={filteredNav} pathname={location.pathname} />
    </div>
  );
}

function BottomDock({ nav, pathname }: { nav: any[]; pathname: string }) {
  const dockItems = [
    ...nav.map(item => ({ ...item, type: 'nav' as const })),
    { name: 'Profile', path: '/profile', icon: User, type: 'profile' as const },
  ];

  return (
    <nav
      className="liquid-dock lg:hidden"
      aria-label="Bottom navigation"
    >
      <div className="liquid-dock__track">
        {dockItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`liquid-dock__item ${active ? 'liquid-dock__item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const { data: dashRes } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get, enabled: !!user });
  const myBalance = dashRes?.data?.members?.find((m: any) => m.member_id === user?.id)?.balance;
  const fmt = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className={compact ? 'flex items-center gap-2 text-lg font-bold text-slate-900' : 'flex items-center gap-3 px-7 py-8 text-xl font-bold text-slate-900'}>
      <span className="grid place-items-center">
        <img
          src="/jbj_icon.webp"
          alt="Jib-be-Jib logo"
          className="object-contain h-10"
        />
      </span>
      <div >
      <p className="text-xs text-muted-foreground">{language == "fa" ? 'مانده شما' : 'Your Balance'}</p>

      {myBalance !== undefined && (
        <span dir="ltr" className={`text-sm font-semibold whitespace-nowrap ${myBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {myBalance >= 0 ? '+' : ''}{fmt(myBalance)}
        </span>
      )}
      </div>
    </div>
  );
}

function Navigation({ nav, pathname, mobile = false }: any) {
  return (
    <nav className={mobile ? 'mt-3 -mx-1 flex gap-1 overflow-x-auto pb-0.5' : 'flex flex-1 flex-col gap-1 px-4'} aria-label="Main navigation">
      {nav.map((item: any) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.path);
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`${mobile ? 'shrink-0 px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} flex items-center gap-2.5 rounded-xl font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-indigo-200' : 'text-slate-500 hover:bg-white/65 hover:text-indigo-700'}`}
          >
            <Icon size={mobile ? 16 : 19} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderControls({
  language,
  theme,
  toggleLanguage,
  toggleTheme,
  logout,
  fa,
}: any) {
  return (
    <div className="flex items-center gap-2">
      <ControlButton
        label={language === 'en' ? 'فارسی' : 'English'}
        onClick={toggleLanguage}
      >
        <Languages size={18} />
        <span className="hidden sm:inline">
          {language === 'en' ? 'فا' : 'EN'}
        </span>
      </ControlButton>

      <ControlButton
        label={
          theme === 'light'
            ? (fa ? 'حالت تیره' : 'Dark mode')
            : (fa ? 'حالت روشن' : 'Light mode')
        }
        onClick={toggleTheme}
      >
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </ControlButton>

      <ControlButton
        label={fa ? 'خروج' : 'Log out'}
        onClick={logout}
      >
        <LogOut size={19} />
      </ControlButton>
    </div>
  );
}

function ControlButton({ children, label, onClick, loading = false, disabled = false }: any) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled || loading}
      className="
        flex min-h-10 items-center gap-1 rounded-xl p-2
        text-muted-foreground
        transition-colors
        hover:bg-accent
        hover:text-accent-foreground
      "
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}

function UserMenu({ name, avatar, ...controls }: any) {
  return (
    <div className="m-4 rounded-2xl border border-border bg-card/60 backdrop-blur p-3">
      <Link
        to="/profile"
        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-accent"
      >
        <Avatar src={avatar} name={name} size={36} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {name}
        </span>
      </Link>
      <div className="mt-3 border-t border-border pt-2">
        <HeaderControls {...controls} />
      </div>
    </div>
  );
}
