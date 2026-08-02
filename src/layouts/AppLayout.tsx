import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, LogOut, Languages, Moon, Sun, Map } from 'lucide-react';

export default function AppLayout() {
  const { user, logout, trips, selectedTrip, selectTrip } = useAuth();
  const [permissionNotice, setPermissionNotice] = useState(false);
  const { language, theme, toggleLanguage, toggleTheme } = usePreferences();
  const location = useLocation();
  const fa = language === 'fa';
  useEffect(() => { const show = () => setPermissionNotice(true); window.addEventListener('owner-permission-required', show); return () => window.removeEventListener('owner-permission-required', show); }, []);
  const nav = [
    { name: fa ? 'داشبورد' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'member'] },
    { name: fa ? 'اعضا' : 'Members', path: '/members', icon: Users, roles: ['owner'] },
    { name: fa ? 'واریزها' : 'Deposits', path: '/deposits', icon: ArrowDownToLine, roles: ['owner', 'member'] },
    { name: fa ? 'هزینه‌ها' : 'Expenses', path: '/withdrawals', icon: ArrowUpFromLine, roles: ['owner', 'member'] },
    { name: fa ? 'سفرها' : 'Trips', path: '/trips', icon: Map, roles: ['owner', 'member'] },
    // { name: fa ? 'پروفایل' : 'Profile', path: '/profile', icon: User, roles: ['owner', 'member'] },
  ];
  const controls = { language, theme, toggleLanguage, toggleTheme, logout, fa };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass-panel hidden w-72 flex-col border-y-0 border-l-0 rounded-none lg:fixed lg:inset-y-0 lg:flex">
        <Brand fa={fa} />
        {/* <TripSwitcher trips={trips} selectedTrip={selectedTrip} onSelect={selectTrip} /> */}
        <Navigation
          nav={nav.filter(x => x.roles.includes(String(user?.role)))}
          pathname={location.pathname}
        />
        <UserMenu name={user?.name} {...controls} />
      </aside>
      <div className="min-w-0 flex-1 lg:ml-72 rtl:lg:mr-72 rtl:lg:ml-0">
        <header className="glass-panel sticky top-0 z-20 border-x-0 border-t-0 rounded-none px-4 py-3 sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3"><Brand fa={fa} compact /><HeaderControls
              {...controls}
              user={user}
            /></div>
          <TripSwitcher trips={trips} selectedTrip={selectedTrip} onSelect={selectTrip} compact />
          <Navigation
            nav={nav.filter(x => x.roles.includes(String(user?.role)))}
            pathname={location.pathname}
            mobile
          />
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 pb-10 sm:p-6 lg:p-8">{permissionNotice && <div role="alert" className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">Owner permission required<button onClick={() => setPermissionNotice(false)} className="ms-4 underline">Dismiss</button></div>}<Outlet /></main>
      </div>
    </div>
  );
}

function Brand({ compact = false, fa }: { compact?: boolean; fa: boolean }) {
  const { theme, } = usePreferences();
  return <div className={compact ? 'flex items-center gap-2 text-lg font-bold text-slate-900' : 'flex items-center gap-3 px-7 py-8 text-xl font-bold text-slate-900'}>
    {/* <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><Plane size={20} /></span> */}
    <span className="grid pt-1 place-items-center
    ">
      <img
        // place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200

        src={theme === 'light' ? "/jbj_icon.png" : "/jbj_icon_dark.png"}
        alt="Jib-be-Jib logo"
        className="object-contain h-10"
      />
    </span>
    <span>{fa ? 'جیب‌به‌جیب' : 'Jib-be-Jib'}</span></div>;
}

function TripSwitcher({ trips, selectedTrip, onSelect, compact = false }: any) {
  return <div className={compact ? 'mt-3' : 'px-4 pb-3'}><label className="sr-only" htmlFor="trip-switcher">Current trip</label><select id="trip-switcher" value={selectedTrip?.id || ''} onChange={event => onSelect(event.target.value)} className="select-control text-sm"><option value="" disabled>Select a trip</option>{trips.filter((trip: any) => trip.active !== false).map((trip: any) => <option key={trip.id} value={trip.id}>{trip.name} ({trip.currency})</option>)}</select></div>;
}

function Navigation({ nav, pathname, mobile = false }: any) {
  return <nav className={mobile ? 'mt-3 -mx-1 flex gap-1 overflow-x-auto pb-0.5' : 'flex flex-1 flex-col gap-1 px-4'} aria-label="Main navigation">
    {nav.map((item: any) => { const Icon = item.icon; const active = pathname.startsWith(item.path); return <Link key={item.name} to={item.path} className={`${mobile ? 'shrink-0 px-3 py-2 text-xs' : 'px-4 py-3 text-sm'} flex items-center gap-2.5 rounded-xl font-semibold transition ${active ? 'bg-indigo-600 text-white shadow-indigo-200' : 'text-slate-500 hover:bg-white/65 hover:text-indigo-700'}`}><Icon size={mobile ? 16 : 19} /><span>{item.name}</span></Link>; })}
  </nav>;
}

function HeaderControls({
  language,
  theme,
  toggleLanguage,
  toggleTheme,
  logout,
  fa,
  user,
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

      {user && (
        <Link
          to="/profile"
          aria-label={fa ? 'پروفایل' : 'Profile'}
          className="grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-accent"
        >
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
            {user.name?.slice(0, 1).toUpperCase() || 'U'}
          </div>
        </Link>
      )}

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
  return <button
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
  </button>;
}

function LogoutButton({ children, label, logout }: any) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (loading) return;
    try {
      setLoading(true);
      await logout();
    } finally {
      setLoading(false);
    }
  };
  return <ControlButton label={label} onClick={handle} loading={loading}>{children}</ControlButton>;
}
function UserMenu({ name, ...controls }: any) {
  return (
    <div className="m-4 rounded-2xl border border-border bg-card/60 backdrop-blur p-3">
      <Link
        to="/profile"
        className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-accent"
      >
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
          {name?.slice(0, 1).toUpperCase() || 'U'}
        </div>

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