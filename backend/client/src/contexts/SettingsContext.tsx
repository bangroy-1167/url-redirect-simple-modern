import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AppSettings {
  appName: string;
  appSubtitle: string;
  appVersion: string;
  defaultLanguage: string;
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
  appVersion: 'v.2.09',
  defaultLanguage: 'id',
  autoRedirect: true,
  autoRedirectDelay: 7,
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
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Try admin endpoint first if logged in
        try {
          const response = await fetch('/api8url/admin/settings', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success && data.data) {
            setSettings(data.data);
            return; // Exit early - no need for fallback
          }
        } catch (err) {
          console.error('[SettingsContext] Admin settings fetch failed:', err);
        }
      }
      
      // Fallback to public endpoint (no auth required)
      const response = await fetch('/settings');
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        // Use default settings if both endpoints fail
        setSettings(defaultSettings);
      }
    } catch (err) {
      console.error('[SettingsContext] Failed to load settings:', err);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
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
