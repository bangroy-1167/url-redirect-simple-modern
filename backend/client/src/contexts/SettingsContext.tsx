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
  autoRedirectDelay: 2,
  rateLimitPublic: 20,
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
      let url = '/api8url/settings'; // Public endpoint
      
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
            setLoading(false);
            return;
          }
        } catch (err) {
          console.log('Admin settings fetch failed, using public settings');
        }
      }
      
      // Fallback to public endpoint
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
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
