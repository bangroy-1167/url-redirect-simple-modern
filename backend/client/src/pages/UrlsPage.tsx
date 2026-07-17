import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminUrlApi, urlApi } from '../api/client';
import { Url8 } from '../types/api';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import {
  Plus, Search, X, Copy, Check, ExternalLink, Pencil, Trash2, AlertCircle, AlertTriangle, Sparkles, Lightbulb,
  ChevronUp, ChevronDown
} from 'lucide-react';

// Safe characters for short URL - human-friendly mix
const SHORTURL_SAFE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SHORTURL_ALL_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';

// Generate random short URL using safe chars
function generateShortUrl(): string {
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += SHORTURL_SAFE_CHARS.charAt(Math.floor(Math.random() * SHORTURL_SAFE_CHARS.length));
  }
  return result;
}

export default function UrlsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [urls, setUrls] = useState<Url8[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, per_page: 50, total: 0, total_pages: 0 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUrl, setSelectedUrl] = useState<Url8 | null>(null);
  const [formData, setFormData] = useState({
    shortUrl: '',
    targetUrl: '',
    title: '',
    keterangan: '',
    description: '',
    password: '',
    expiresAt: ''
  });
  const [originalData, setOriginalData] = useState(formData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showCharInfo, setShowCharInfo] = useState(false);

  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        per_page: pagination.per_page,
        sort_by: sortBy,
        sort_dir: sortDir
      };
      if (search) params.search = search;
      const isAdmin = user?.role === 'ADMIN';
      const api = isAdmin ? adminUrlApi : urlApi;
      const response = await api.list(params);
      
      // Debug: Log the response structure
      console.log('URLs API Response:', response.data);
      
      // Handle multiple response formats
      let urlsData: Url8[] = [];
      if (Array.isArray(response.data)) {
        urlsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        urlsData = response.data.data;
      } else if (response.data?.urls && Array.isArray(response.data.urls)) {
        urlsData = response.data.urls;
      }
      
      setUrls(urlsData);
      
      // Handle pagination
      if (response.data?.meta) {
        setPagination(p => ({ ...p, ...response.data.meta }));
      } else if (response.data?.pagination) {
        setPagination(p => ({ ...p, ...response.data.pagination }));
      } else if (response.data?.total !== undefined) {
        setPagination(p => ({
          ...p,
          total: response.data.total || 0,
          total_pages: response.data.total_pages || Math.ceil((response.data.total || 0) / p.per_page)
        }));
      }
    } catch (err) {
      setError('Gagal memuat URL');
      console.error('Fetch URLs error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.per_page, search, sortBy, sortDir, user?.role]);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(s => s === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const isDirty = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleCloseModal = () => {
    if (isDirty()) {
      setShowConfirmClose(true);
    } else {
      setShowModal(false);
    }
  };

  const confirmClose = (force: boolean = false) => {
    if (force || !isDirty()) {
      setShowModal(false);
      setShowConfirmClose(false);
      setShowCharInfo(false);
    }
  };

  const openCreateModal = () => {
    const empty = {
      shortUrl: '',
      targetUrl: '',
      title: '',
      keterangan: '',
      description: '',
      password: '',
      expiresAt: ''
    };
    setFormData(empty);
    setOriginalData(empty);
    setSelectedUrl(null);
    setFormError('');
    setShowModal(true);
    setShowConfirmClose(false);
    setShowCharInfo(false);
  };

  const openEditModal = (url: Url8) => {
    const data = {
      shortUrl: url.shortUrl,
      targetUrl: url.targetUrl,
      title: url.title || '',
      keterangan: url.keterangan || '',
      description: (url as any).description || '',
      password: '',
      expiresAt: url.expDate ? String(url.expDate).split('T')[0] : ''
    };
    setModalMode('edit'); // <-- THIS WAS MISSING!
    setFormData(data);
    setOriginalData(data);
    setSelectedUrl(url);
    setFormError('');
    setShowModal(true);
    setShowConfirmClose(false);
    setShowCharInfo(false);
  };

  const handleGenerateShortUrl = () => {
    const generated = generateShortUrl();
    setFormData(prev => ({ ...prev, shortUrl: generated }));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleShortUrlChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9-]/g, '');
    setFormData(prev => ({ ...prev, shortUrl: filtered }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const data: Record<string, unknown> = {
        targetUrl: formData.targetUrl,
        title: formData.title,
        description: formData.description || formData.keterangan,
        keterangan: formData.keterangan
      };
      if (formData.shortUrl) data.shortUrl = formData.shortUrl.toLowerCase();
      if (formData.password) data.password = formData.password;
      if (formData.expiresAt) data.expiresAt = new Date(formData.expiresAt).toISOString();
      
      // DEBUG: Log the submission details
      console.log('[DEBUG handleSubmit] modalMode:', modalMode);
      console.log('[DEBUG handleSubmit] selectedUrl:', selectedUrl);
      console.log('[DEBUG handleSubmit] formData.shortUrl:', formData.shortUrl);
      console.log('[DEBUG handleSubmit] data:', data);
      
      if (modalMode === 'create') {
        console.log('[DEBUG handleSubmit] Calling urlApi.create');
        await urlApi.create(data);
      } else if (selectedUrl) {
        console.log('[DEBUG handleSubmit] Calling urlApi.update with id:', selectedUrl.id);
        await urlApi.update(selectedUrl.id, data);
      } else {
        console.error('[DEBUG handleSubmit] ERROR: modalMode is edit but selectedUrl is null!');
      }
      
      setShowModal(false);
      fetchUrls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error('[DEBUG handleSubmit] Error:', error);
      setFormError(error.response?.data?.message || 'Gagal menyimpan URL');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus URL ini?')) return;
    try { await urlApi.delete(id); fetchUrls(); } catch { alert('Gagal menghapus'); }
  };

  const copyToClipboard = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const baseUrl = window.location.origin;

  const getChangedFields = () => {
    const changes: string[] = [];
    if (formData.shortUrl !== originalData.shortUrl) changes.push('Short URL');
    if (formData.targetUrl !== originalData.targetUrl) changes.push('URL Target');
    if (formData.title !== originalData.title) changes.push('Judul');
    if (formData.keterangan !== originalData.keterangan || formData.description !== originalData.description) changes.push('Deskripsi');
    if (formData.password && formData.password !== originalData.password) changes.push('Password');
    if (formData.expiresAt !== originalData.expiresAt) changes.push('Tanggal Kadaluarsa');
    return changes;
  };

  return (
    <>
      <Layout activePage="urls">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Daftar URL</h2>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Buat URL Baru
          </button>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Cari URL..." value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />{error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('shortUrl')} className="flex items-center gap-1 hover:text-gray-700">
                    Short URL {sortBy === 'shortUrl' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-gray-700">
                    Judul {sortBy === 'title' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('hitCounter')} className="flex items-center gap-1 hover:text-gray-700">
                    Hits {sortBy === 'hitCounter' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">
                  <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700">
                    Dibuat {sortBy === 'createdAt' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                  </button>
                </th>
                <th className="px-6 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center">Memuat...</td></tr>
              ) : urls.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Belum ada URL. Buat URL pertama Anda!</td></tr>
              ) : urls.map(url => (
                <tr key={url.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm text-indigo-600">{url.shortUrl}</code>
                      <button onClick={() => copyToClipboard(`${baseUrl}/${url.shortUrl}`, url.id)} className="p-1 hover:bg-gray-200 rounded" title="Salin">
                        {copiedId === url.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={url.title || url.keterangan || '-'}>
                      {url.title || url.keterangan || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-center">
                    {(url.hitCounter ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {url.createdAt ? new Date(url.createdAt).toLocaleDateString('id-ID') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(url)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <a href={`${baseUrl}/${url.shortUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Buka URL">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button onClick={() => handleDelete(url.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.total_pages > 0 && (
          <Pagination
            page={pagination.page}
            perPage={pagination.per_page}
            totalPages={pagination.total_pages}
            total={pagination.total}
            onPageChange={(page) => setPagination(p => ({ ...p, page }))}
            onPerPageChange={(per_page) => setPagination(p => ({ ...p, per_page, page: 1 }))}
          />
        )}
      </Layout>

      {/* Main Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold">
                {modalMode === 'create' ? '✨ Buat URL Baru' : '✏️ Edit URL'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* URL Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Target <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={e => handleFormChange('targetUrl', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://contoh.com/halamanpanjang"
                  required
                />
              </div>

              {/* Short URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Short URL <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCharInfo(!showCharInfo)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    Karakter yang didukung
                  </button>
                </div>

                {showCharInfo && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <p className="font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Rekomendasi karakter (mudah dibaca manusia):
                    </p>
                    <p className="font-mono mb-2">
                      {SHORTURL_SAFE_CHARS}
                    </p>
                    <p className="font-medium mt-2 mb-1">Semua karakter yang didukung:</p>
                    <p className="font-mono">
                      {SHORTURL_ALL_CHARS}
                    </p>
                    <p className="mt-2 text-amber-700">
                      ⚠️ Short URL akan disimpan dalam huruf kecil. Huruf besar & kecil bisa digunakan saat memasukkan.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex flex-1">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 bg-gray-50 text-sm text-gray-500 whitespace-nowrap">
                      {baseUrl}/
                    </span>
                    <input
                      type="text"
                      value={formData.shortUrl}
                      onChange={e => handleShortUrlChange(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                      placeholder="contoh-url"
                      minLength={3}
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateShortUrl}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium"
                    title="Generate otomatis"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  3-50 karakter. Kosongkan untuk auto-generate dengan karakter acak.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Judul singkat untuk URL ini"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  value={formData.description || formData.keterangan}
                  onChange={e => { handleFormChange('description', e.target.value); handleFormChange('keterangan', e.target.value); }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Deskripsi atau keterangan tambahan tentang URL ini"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => handleFormChange('password', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Biarkan kosong jika tidak perlu password"
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Berlaku hingga <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={e => handleFormChange('expiresAt', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Close Dialog */}
      {showConfirmClose && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowConfirmClose(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Perubahan Belum Tersimpan</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Anda telah membuat perubahan. Apakah Anda yakin ingin menutup tanpa menyimpan?
                </p>
              </div>
            </div>

            {getChangedFields().length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Perubahan yang akan dibatalkan:</p>
                <div className="flex flex-wrap gap-1">
                  {getChangedFields().map(field => (
                    <span key={field} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Lanjut Edit
              </button>
              <button
                onClick={() => confirmClose(true)}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Tutup Tanpa Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
