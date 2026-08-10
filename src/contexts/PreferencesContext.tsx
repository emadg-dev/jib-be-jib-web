import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { profileApi } from '../api/services';
import { useAuth } from './AuthContext';

type Language = 'en' | 'fa';
type Theme = 'light' | 'dark';

type Preferences = {
  language: Language;
  theme: Theme;
  toggleLanguage: () => void;
  toggleTheme: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'fa');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [initialized, setInitialized] = useState(false);

  // Load from server preferences on login
  useEffect(() => {
    if (!user?.preferences || initialized) return;
    const prefs = user.preferences;
    if (prefs.language && typeof prefs.language === 'string') {
      setLanguage(prefs.language as Language);
    }
    if (prefs.theme && typeof prefs.theme === 'string') {
      setTheme(prefs.theme as Theme);
    }
    setInitialized(true);
  }, [user?.preferences, initialized]);

  // Apply language to DOM + localStorage
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = language === 'fa' ? 'rtl' : 'ltr';
    html.classList.toggle('fa', language === 'fa');
    html.classList.toggle('en', language === 'en');
    localStorage.setItem('language', language);
  }, [language]);

  // Apply theme to DOM + localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const persist = useCallback((key: string, value: string) => {
    const merged = { ...user?.preferences, [key]: value };
    profileApi.updatePreferences(merged as Record<string, string | boolean>).then((res: any) => {
      const updated = res?.data;
      if (updated) updateUser({ preferences: updated });
    }).catch(() => {});
  }, [user?.preferences, updateUser]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'fa' : 'en';
      persist('language', next);
      return next;
    });
  }, [persist]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      persist('theme', next);
      return next;
    });
  }, [persist]);

  return (
    <PreferencesContext.Provider value={{ language, theme, toggleLanguage, toggleTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used within PreferencesProvider');
  return preferences;
}
