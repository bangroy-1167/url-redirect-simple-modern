import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppSettings {
  appName: string;
  appSubtitle: string;
  autoRedirect: boolean;
  autoRedirectDelay: number;
  rateLimitPublic: number;
  rateLimitAuth: number;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => void;
}

const defaultSettings: AppSettings = {
  appName: 'modernURL8',
  appSubtitle: 'URL Redirection Service',
  autoRedirect: true,
  autoRedirectDelay: 15,
  rateLimitPublic: 50,
  rateLimitAuth: 100,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      console.log('[SettingsContext] Fetching settings, token present:', !!token);
      
      if (token) {
        // Try admin endpoint first if logged in
        try {
          console.log('[SettingsContext] Trying /api8url/admin/settings');
          const response = await fetch('/api8url/admin/settings', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          console.log('[SettingsContext] Admin settings response status:', response.status);
          const data = await response.json();
          console.log('[SettingsContext] Admin settings response:', data);
          if (data.success && data.data) {
            setSettings(data.data);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.log('[SettingsContext] Admin settings fetch failed, using public settings', err);
        }
      }
      
      // Fallback to public endpoint (no auth required)
      console.log('[SettingsContext] Trying /settings (public)');
      const response = await fetch('/settings');
      console.log('[SettingsContext] Public settings response status:', response.status);
      const data = await response.json();
      console.log('[SettingsContext] Public settings response:', data);
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('[SettingsContext] Failed to load settings:', err);
    } finally {
      setLoading(false);
      console.log('[SettingsContext] Settings loaded:', settings);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
