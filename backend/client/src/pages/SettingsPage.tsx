import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import Layout from '../components/Layout';
import Tooltip from '../components/Tooltip';
import { Settings, Info, Check, AlertTriangle } from 'lucide-react';

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

function SettingCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Tooltip content={description}>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 cursor-help">
              <Info className="w-4 h-4" /><span>Info</span>
            </div>
          </Tooltip>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings: contextSettings, refreshSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<AppSettings>(contextSettings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch('/api8url/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(localSettings),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        refreshSettings();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.message || 'Gagal menyimpan');
      }
    } catch { setError('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleChange = (field: keyof AppSettings, value: string | number | boolean) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout activePage="settings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Pengaturan Aplikasi</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan aplikasi.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5" /><span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <Check className="w-5 h-5" /><span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      <div className="space-y-6">
        <SettingCard
          title="Nama Aplikasi"
          description="Atur nama aplikasi yang ditampilkan di header dan judul browser."
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Aplikasi</label>
            <input type="text" value={localSettings.appName}
              onChange={e => handleChange('appName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input type="text" value={localSettings.appSubtitle}
              onChange={e => handleChange('appSubtitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Versi Aplikasi</label>
            <input type="text" value={localSettings.appVersion}
              onChange={e => handleChange('appVersion', e.target.value)}
              placeholder="v.2.09"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono" />
            <p className="text-xs text-gray-500 mt-1">Versi aplikasi yang ditampilkan di halaman publik.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bahasa Default</label>
            <select
              value={localSettings.defaultLanguage || 'id'}
              onChange={e => handleChange('defaultLanguage', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="id">Indonesia 🇮🇩</option>
              <option value="en">English 🇬🇧</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Bahasa default untuk halaman publik.</p>
          </div>
        </SettingCard>

        <SettingCard
          title="Auto-Redirect"
          description="Aktifkan untuk tampilkan halaman info sebelum redirect. Waktu countdown bisa diatur."
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Aktifkan Auto-Redirect</p>
              <p className="text-sm text-gray-500">Tampilkan halaman info sebelum redirect</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.autoRedirect}
                onChange={e => handleChange('autoRedirect', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          {localSettings.autoRedirect && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Redirect (detik)</label>
              <input type="number" min="1" max="10" value={localSettings.autoRedirectDelay}
                onChange={e => handleChange('autoRedirectDelay', parseInt(e.target.value) || 2)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-500 mt-1">1-10 detik</p>
            </div>
          )}
        </SettingCard>

        <SettingCard
          title="Rate Limit"
          description="Batasi request per menit untuk mencegah penyalahgunaan."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit Publik (req/menit)</label>
              <input type="number" min="1" max="1000" value={localSettings.rateLimitPublic}
                onChange={e => handleChange('rateLimitPublic', parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-500 mt-1">Default: 20</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Limit Auth (req/menit)</label>
              <input type="number" min="1" max="10000" value={localSettings.rateLimitAuth}
                onChange={e => handleChange('rateLimitAuth', parseInt(e.target.value) || 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <p className="text-xs text-gray-500 mt-1">Default: 100</p>
            </div>
          </div>
        </SettingCard>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Menyimpan...</> ) : (
              <><Check className="w-4 h-4" />Simpan</>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
