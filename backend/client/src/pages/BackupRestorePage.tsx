import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Database, Download, Upload, AlertTriangle, Check, FileJson, Loader2, Trash2, X, FileWarning, RefreshCw } from 'lucide-react';

type BackupType = 'urls' | 'users' | 'settings';
type RestoreStrategy = 'replace' | 'insert_unique' | 'upsert';

interface FilePreview {
  name: string;
  size: number;
  data: any[];
  type: BackupType;
}

interface RestoreModalProps {
  tableName: string;
  onClose: () => void;
  onRestore: (data: any[], strategy: RestoreStrategy, invalidUserAction: string) => Promise<void>;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: number;
}

// Restore Modal Component
function RestoreModal({ tableName, onClose, onRestore }: RestoreModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [strategy, setStrategy] = useState<RestoreStrategy>('upsert');
  const [preview, setPreview] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setError('Hanya file JSON yang diizinkan');
      return;
    }

    setFile(selectedFile);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!Array.isArray(data)) {
          setError('Format file tidak valid. Expected array.');
          setPreview(null);
        } else {
          setPreview(data);
        }
      } catch {
        setError('Gagal membaca file JSON');
        setPreview(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const [invalidUserAction, setInvalidUserAction] = useState<string>('skip');

  const handleRestore = async () => {
    if (!preview) {
      setError('Pilih file terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      await onRestore(preview, strategy, invalidUserAction);
    } finally {
      setLoading(false);
    }
  };

  const strategyLabels: Record<RestoreStrategy, { title: string; desc: string }> = {
    replace: { title: 'Buang & Insert Baru', desc: 'Hapus semua data lama, lalu insert data baru dari file' },
    insert_unique: { title: 'Pertahankan Lama, Insert Baru (Unique)', desc: 'Hanya insert data baru yang belum ada (berdasarkan unique key)' },
    upsert: { title: 'Update/Insert (Upsert)', desc: 'Update data lama dengan data baru, insert jika belum ada' }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">Restore {tableName}</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* File Upload Area */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Pilih File Backup (.json)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileJson className="w-5 h-5 text-green-600" />
                  <span className="text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">Klik atau drag file ke sini</p>
                </>
              )}
            </div>
          </div>

          {/* Preview Count */}
          {preview && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300">
                File berisi <strong>{preview.length}</strong> record(s)
              </p>
            </div>
          )}

          {tableName === 'URLs' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Resolusi Referensi User (Jika Tidak Ditemukan)</label>
              <select
                value={invalidUserAction}
                onChange={(e) => setInvalidUserAction(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
              >
                <option value="skip">Skip Restore (Abaikan URL)</option>
                <option value="assign_to_me">Tugaskan ke saya (Admin aktif)</option>
                <option value="create_inactive">Buat user baru (NonAktif)</option>
              </select>
            </div>
          )}

          {/* Strategy Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">Strategi Restore</label>
            <div className="space-y-2">
              {(Object.keys(strategyLabels) as RestoreStrategy[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    strategy === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900'
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={key}
                    checked={strategy === key}
                    onChange={() => setStrategy(key)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium text-sm">{strategyLabels[key].title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{strategyLabels[key].desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900"
            >
              Batal
            </button>
            <button
              onClick={handleRestore}
              disabled={!file || loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal Component
function ConfirmModal({
  title,
  message,
  details,
  onConfirm,
  onCancel,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger'
}: {
  title: string;
  message: string;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {variant === 'danger' ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <FileWarning className="w-6 h-6 text-orange-600" />
            )}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300 mb-4">{message}</p>
          {details && details.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 rounded-lg max-h-48 overflow-y-auto">
              <ul className="text-sm space-y-1">
                {details.map((detail, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-200 dark:text-gray-200 dark:text-gray-200">• {detail}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg ${
                variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Result Modal Component
function ResultModal({
  title,
  results,
  onClose
}: {
  title: string;
  results: { label: string; value: string | number; type?: 'success' | 'error' | 'info' }[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Check className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="space-y-2 mb-4">
            {results.map((result, idx) => (
              <div key={idx} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 dark:bg-gray-900 rounded">
                <span className="text-gray-600 dark:text-gray-300 dark:text-gray-300 dark:text-gray-300">{result.label}</span>
                <span className={`font-medium ${
                  result.type === 'success' ? 'text-green-600' :
                  result.type === 'error' ? 'text-red-600' : 'text-gray-900 dark:text-white dark:text-white dark:text-white'
                }`}>
                  {result.value}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BackupRestorePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal states
  const [showRestoreModal, setShowRestoreModal] = useState<{ show: boolean; table: string }>({ show: false, table: '' });
  const [showConfirmModal, setShowConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    details: string[];
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', details: [], onConfirm: () => {} });
  const [showResultModal, setShowResultModal] = useState<{
    show: boolean;
    title: string;
    results: { label: string; value: string | number; type?: 'success' | 'error' | 'info' }[];
  }>({ show: false, title: '', results: [] });

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

  // Export function
  const handleExport = async (type: BackupType) => {
    setLoading(prev => ({ ...prev, [`export_${type}`]: true }));
    setMessage(null);

    try {
      const response = await fetch(`/api8url/backup/${type}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const responseData = await response.json();

      if (responseData.success) {
        const jsonString = JSON.stringify(responseData.data, null, 2);
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

        showMessage(`Berhasil export ${type}`, 'success');
      } else {
        showMessage(`Gagal export ${type}: ${responseData.message}`, 'error');
      }
    } catch (err) {
      showMessage(`Error exporting ${type}`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, [`export_${type}`]: false }));
    }
  };

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: BackupType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showMessage('Pilih file JSON yang valid', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (!Array.isArray(jsonData)) {
          showMessage('Format backup tidak valid. Expected array.', 'error');
          return;
        }
        showMessage(`File ${file.name} siap di-restore (${jsonData.length} records)`, 'success');
      } catch (err) {
        showMessage('Gagal membaca file JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Clear URLs - simple truncate
  const handleClearUrls = () => {
    const details = ['⚠️ Peringatan: Semua data URL akan dihapus permanen!', '• Semua short URL akan dihapus', '• Semua history click akan hilang', '• Tindakan ini tidak dapat dibatalkan'];

    setShowConfirmModal({
      show: true,
      title: 'Konfirmasi Kosongkan URLs',
      message: 'Apakah Anda yakin ingin mengosongkan semua data URLs?',
      details,
      onConfirm: async () => {
        setShowConfirmModal(prev => ({ ...prev, show: false }));
        setLoading(prev => ({ ...prev, clear_urls: true }));

        try {
          const response = await fetch('/api8url/admin/urls/clear', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const responseData = await response.json();

          if (responseData.success) {
            setShowResultModal({
              show: true,
              title: '✅ URLs Berhasil Dikosongkan',
              results: [
                { label: 'Status', value: 'Berhasil', type: 'success' },
                { label: 'URLs dihapus', value: responseData.data?.deleted || 0 },
                { label: 'Hits dihapus', value: responseData.data?.hitsDeleted || 0 }
              ]
            });
          } else {
            showMessage(responseData.message || 'Gagal mengosongkan URLs', 'error');
          }
        } catch {
          showMessage('Error saat mengosongkan URLs', 'error');
        } finally {
          setLoading(prev => ({ ...prev, clear_urls: false }));
        }
      }
    });
  };

  // Clear Users - with admin protection
  const handleClearUsers = async () => {
    setLoading(prev => ({ ...prev, get_users: true }));

    try {
      const response = await fetch('/api8url/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        const users: UserInfo[] = responseData.data;
        const nonAdmins = users.filter(u => u.role !== 'ADMIN' || !u.is_active);
        const admins = users.filter(u => u.role === 'ADMIN' && u.is_active);

        const details = [
          `📊 Total Users: ${users.length}`,
          `👤 Admin Aktif: ${admins.length} (AUTO-PROTECTED)`,
          `⚠️ Akan dihapus: ${nonAdmins.length} user(s)`,
          '',
          '📋 Detail User yang akan dihapus:'
        ];

        nonAdmins.forEach((u, idx) => {
          details.push(`  ${idx + 1}. ${u.username} (${u.email}) - ${u.role}${!u.is_active ? ' [INACTIVE]' : ''}`);
        });

        if (nonAdmins.length === 0) {
          details.push('  ✓ Tidak ada user non-admin untuk dihapus');
        }

        setShowConfirmModal({
          show: true,
          title: 'Konfirmasi Kosongkan Users',
          message: 'Hapus semua user NON-ADMIN? Admin aktif akan dipertahankan.',
          details,
          onConfirm: async () => {
            setShowConfirmModal(prev => ({ ...prev, show: false }));
            setLoading(prev => ({ ...prev, clear_users: true }));

            try {
              const deleteResponse = await fetch('/api8url/admin/users/clear-non-admins', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
              });
              const deleteData = await deleteResponse.json();

              if (deleteData.success) {
                setShowResultModal({
                  show: true,
                  title: '✅ Users Berhasil Dibersihkan',
                  results: [
                    { label: 'Status', value: 'Berhasil', type: 'success' },
                    { label: 'Total Users', value: deleteData.data?.total || 0 },
                    { label: 'Admin Dilindungi', value: deleteData.data?.adminsProtected || 0 },
                    { label: 'Users Dihapus', value: deleteData.data?.deleted || 0, type: 'info' }
                  ]
                });
              } else {
                showMessage(deleteData.message || 'Gagal membersihkan users', 'error');
              }
            } catch {
              showMessage('Error saat membersihkan users', 'error');
            } finally {
              setLoading(prev => ({ ...prev, clear_users: false }));
            }
          }
        });
      }
    } catch {
      showMessage('Gagal mengambil data users', 'error');
    } finally {
      setLoading(prev => ({ ...prev, get_users: false }));
    }
  };

  // Restore handler
  const handleRestore = (type: BackupType) => async (data: any[], strategy: RestoreStrategy, invalidUserAction: string) => {
    setShowRestoreModal({ show: false, table: '' });
    setLoading(prev => ({ ...prev, [`restore_${type}`]: true }));

    try {
      const response = await fetch(`/api8url/backup/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data, strategy, invalidUserAction })
      });

      const responseData = await response.json();

      if (responseData.success) {
        const strategyLabels: Record<RestoreStrategy, string> = {
          replace: 'Replace (Truncate + Insert)',
          insert_unique: 'Insert Unique',
          upsert: 'Upsert (Update/Insert)'
        };

        setShowResultModal({
          show: true,
          title: `✅ ${type.charAt(0).toUpperCase() + type.slice(1)} Berhasil Di-restore`,
          results: [
            { label: 'Strategi', value: strategyLabels[strategy] },
            { label: 'Total Records', value: responseData.data?.total || 0 },
            { label: 'Inserted', value: responseData.data?.inserted || 0, type: 'success' },
            { label: 'Updated', value: responseData.data?.updated || 0, type: 'info' },
            { label: 'Skipped', value: responseData.data?.skipped || 0 }
          ]
        });
      } else {
        showMessage(responseData.message || 'Gagal restore data', 'error');
      }
    } catch {
      showMessage('Error saat restore data', 'error');
    } finally {
      setLoading(prev => ({ ...prev, [`restore_${type}`]: false }));
    }
  };

  return (
    <Layout activePage="backup">
      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Backup Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* URLs Backup Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">URLs Data</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mb-6">
            Backup dan restore data URLs. Backup semua short URLs menjadi file JSON atau restore data.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleExport('urls')}
              disabled={loading.export_urls}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium border border-blue-200 disabled:opacity-50"
            >
              {loading.export_urls ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Backup URLs
            </button>

            <button
              onClick={handleClearUrls}
              disabled={loading.clear_urls}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-200 disabled:opacity-50"
            >
              {loading.clear_urls ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Kosongkan URLs
            </button>

            <button
              onClick={() => setShowRestoreModal({ show: true, table: 'URLs' })}
              disabled={loading.restore_urls}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium border border-green-200 disabled:opacity-50"
            >
              {loading.restore_urls ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Restore URLs
            </button>
          </div>
        </div>

        {/* Users Backup Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">Users Data</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mb-6">
            Backup dan restore data users. Admin aktif akan dipertahankan saat restore.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleExport('users')}
              disabled={loading.export_users}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium border border-emerald-200 disabled:opacity-50"
            >
              {loading.export_users ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Backup Users
            </button>

            <button
              onClick={handleClearUsers}
              disabled={loading.clear_users || loading.get_users}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors font-medium border border-red-200 disabled:opacity-50"
            >
              {(loading.clear_users || loading.get_users) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Kosongkan Non-Admin
            </button>

            <button
              onClick={() => setShowRestoreModal({ show: true, table: 'Users' })}
              disabled={loading.restore_users}
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium border border-green-200 disabled:opacity-50"
            >
              {loading.restore_users ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Restore Users
            </button>
          </div>
        </div>

        {/* Settings Backup Card (Admin Only) */}
        {user?.role === 'ADMIN' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-50 rounded-lg">
                <FileJson className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Settings Data</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 mb-6">
              Backup dan restore pengaturan aplikasi.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleExport('settings')}
                disabled={loading.export_settings}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-lg transition-colors font-medium border border-orange-200 disabled:opacity-50"
              >
                {loading.export_settings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Backup Settings
              </button>

              <button
                onClick={() => setShowRestoreModal({ show: true, table: 'Settings' })}
                disabled={loading.restore_settings}
                className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors font-medium border border-green-200 disabled:opacity-50"
              >
                {loading.restore_settings ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Restore Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRestoreModal.show && (
        <RestoreModal
          tableName={showRestoreModal.table}
          onClose={() => setShowRestoreModal({ show: false, table: '' })}
          onRestore={handleRestore(showRestoreModal.table.toLowerCase() as BackupType)}
        />
      )}

      {showConfirmModal.show && (
        <ConfirmModal
          title={showConfirmModal.title}
          message={showConfirmModal.message}
          details={showConfirmModal.details}
          onConfirm={showConfirmModal.onConfirm}
          onCancel={() => setShowConfirmModal(prev => ({ ...prev, show: false }))}
        />
      )}

      {showResultModal.show && (
        <ResultModal
          title={showResultModal.title}
          results={showResultModal.results}
          onClose={() => setShowResultModal({ show: false, title: '', results: [] })}
        />
      )}
    </Layout>
  );
}
