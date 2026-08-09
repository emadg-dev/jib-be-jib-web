import { createContext, useContext, useEffect, useState } from 'react';

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
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'fa');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');

  useEffect(() => {
    const html = document.documentElement;
  
    html.lang = language;
    html.dir = language === 'fa' ? 'rtl' : 'ltr';
  
    html.classList.toggle('fa', language === 'fa');
    html.classList.toggle('en', language === 'en');
  
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return <PreferencesContext.Provider value={{ language, theme, toggleLanguage: () => setLanguage(value => value === 'en' ? 'fa' : 'en'), toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error('usePreferences must be used within PreferencesProvider');
  return preferences;
}
