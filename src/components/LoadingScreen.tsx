import { usePreferences } from '../contexts/PreferencesContext';

export default function LoadingScreen() {
  const { theme } = usePreferences();
  const isDark = theme === 'dark';

  return (
    <div className="loading-screen">
      <div className="loading-orbit">
        <div className="loading-orbit__ring loading-orbit__ring--cw" />
        <div className="loading-orbit__ring loading-orbit__ring--ccw" />
        <img
          src={isDark ? '/jbj_icon.webp' : '/jbj_icon.webp'}
          alt="Jib-be-Jib"
          className="loading-logo"
          draggable={false}
        />
      </div>
    </div>
  );
}
