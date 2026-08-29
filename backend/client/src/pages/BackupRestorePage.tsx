import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Database, Download, Upload, AlertTriangle, Check, FileJson, Loader2 } from 'lucide-react';

type BackupType = 'urls' | 'users' | 'settings';

interface FilePreview {
  name: string;
  size: number;
  data: any[];
  type: BackupType;
}

export default function BackupRestorePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);

  const fileInputRefs = {
    urls: useRef<HTMLInputElement>(null),
    users: useRef<HTMLInputElement>(null),
    settings: useRef<HTMLInputElement>(null),
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const getFormattedDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleExport = async (type: BackupType) => {
    setLoading(prev => ({ ...prev, [`export_${type}`]: true }));
    setMessage(null);

    try {
      const response = await fetch(`/api8url/backup/${type}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();

      if (data.success) {
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;

        const fileName = `${type.charAt(0).toUpperCase() + type.slice(1)}_Backup_${getFormattedDate()}.json`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);

        showMessage(`Successfully exported ${type}`, 'success');
      } else {
        showMessage(`Failed to export ${type}: ${data.message}`, 'error');
      }
    } catch (err) {
      showMessage(`Error exporting ${type}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [`export_${type}`]: false }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: BackupType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showMessage('Please select a valid JSON file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(jsonData)) {
          showMessage('Invalid backup file format. Expected an array of records.', 'error');
          return;
        }

        setPreview({
          name: file.name,
          size: file.size,
          data: jsonData,
          type
        });
      } catch (err) {
        showMessage('Error reading JSON file', 'error');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRefs[type].current) {
      fileInputRefs[type].current!.value = '';
    }
  };

  const handleRestore = async () => {
    if (!preview) return;

    setLoading(prev => ({ ...prev, [`restore_${preview.type}`]: true }));
    setMessage(null);

    try {
      const response = await fetch(`/api8url/backup/${preview.type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ data: preview.data })
      });

      const result = await response.json();

      if (result.success) {
        showMessage(`Successfully restored ${result.data.count} records for ${preview.type}`, 'success');
        setPreview(null);
      } else {
        showMessage(`Failed to restore ${preview.type}: ${result.message}`, 'error');
      }
    } catch (err) {
      showMessage(`Error restoring ${preview.type}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [`restore_${preview.type}`]: false }));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <Layout activePage="backup">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Backup & Restore</h2>
        <p className="text-sm text-gray-500 mt-1">Export and import your data in JSON format.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 border rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Preview Modal for Restore */}
      {preview && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setPreview(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Database className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Confirm Restore: {preview.type.toUpperCase()}
                    </h3>
                    <div className="mt-4 bg-gray-50 p-3 rounded border text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500">File:</span>
                        <span className="font-medium truncate max-w-[200px]" title={preview.name}>{preview.name}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-500">Size:</span>
                        <span className="font-medium">{formatSize(preview.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Records to import:</span>
                        <span className="font-medium text-blue-600">{preview.data.length}</span>
                      </div>
                    </div>
                    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 flex gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-yellow-700">
                        This action will update existing records that match and create new ones. Existing data might be overwritten.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleRestore}
                  disabled={loading[`restore_${preview.type}`]}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading[`restore_${preview.type}`] ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : 'Confirm Restore'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  disabled={loading[`restore_${preview.type}`]}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* URLs Backup Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">URLs Data</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 flex-grow">
            Backup and restore URL records. {user?.role === 'ADMIN' ? 'As admin, you export/import all URLs.' : 'You will only export/import your own URLs.'}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleExport('urls')}
              disabled={loading.export_urls}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium border border-indigo-200 disabled:opacity-50"
            >
              {loading.export_urls ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export URLs
            </button>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRefs.urls}
                accept=".json,application/json"
                onChange={(e) => handleFileChange(e, 'urls')}
                className="hidden"
                id="import-urls"
              />
              <label
                htmlFor="import-urls"
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Import URLs
              </label>
            </div>
          </div>
        </div>

        {/* Users Backup Card (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <FileJson className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Users Data</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 flex-grow">
              Backup and restore user accounts, roles, and passwords. Admin access required.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExport('users')}
                disabled={loading.export_users}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium border border-emerald-200 disabled:opacity-50"
              >
                {loading.export_users ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Users
              </button>

              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRefs.users}
                  accept=".json,application/json"
                  onChange={(e) => handleFileChange(e, 'users')}
                  className="hidden"
                  id="import-users"
                />
                <label
                  htmlFor="import-users"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Import Users
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Settings Backup Card (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileJson className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Settings Data</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6 flex-grow">
              Backup and restore application settings and configurations. Admin access required.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExport('settings')}
                disabled={loading.export_settings}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors font-medium border border-orange-200 disabled:opacity-50"
              >
                {loading.export_settings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Settings
              </button>

              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRefs.settings}
                  accept=".json,application/json"
                  onChange={(e) => handleFileChange(e, 'settings')}
                  className="hidden"
                  id="import-settings"
                />
                <label
                  htmlFor="import-settings"
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium border border-gray-300 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Import Settings
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
