import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminUrlApi, urlApi } from '../api/client';
import { Url8 } from '../types/api';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import {
  Plus, Search, X, Copy, Check, ExternalLink, Pencil, Trash2, AlertCircle, AlertTriangle, Sparkles, Lightbulb,
  ChevronUp, ChevronDown, Link2, Calendar, MessageSquare, FileText, Users, Presentation, Share2, Lock,
  RotateCcw, BarChart3, Globe, Monitor, Smartphone, Tablet, Clock, MapPin, TrendingUp
} from 'lucide-react';

// Safe characters for short URL - human-friendly mix
const SHORTURL_SAFE_CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SHORTURL_ALL_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

// Generate random short URL using safe chars
function generateShortUrl(): string {
  let result = '';
  for (let i = 0; i < 8; i++) {
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
  const [removePassword, setRemovePassword] = useState(false);
  const [originalHasPassword, setOriginalHasPassword] = useState(false);
  const [originalData, setOriginalData] = useState(formData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showCharInfo, setShowCharInfo] = useState(false);
  const [showDescInfo, setShowDescInfo] = useState(false);
  
  // Duplicate shortURL dialog state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateShortUrl, setDuplicateShortUrl] = useState<{
    existingId: number;
    existingShortUrl: string;
    newShortUrl: string;
    newData: Record<string, unknown>;
  } | null>(null);
  
  // WhatsApp share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrlData, setShareUrlData] = useState<Url8 | null>(null);
  const [shareLinkType, setShareLinkType] = useState<'Acara' | 'Rapat' | 'Dokumen' | 'Grup' | 'Custom'>('Custom');
  const [shareCustomType, setShareCustomType] = useState('');
  const [shareDate, setShareDate] = useState(new Date().toISOString().split('T')[0]);
  const [shareInfoCopied, setShareInfoCopied] = useState(false);
  
  // Copy target URL state
  const [copiedTargetId, setCopiedTargetId] = useState<number | null>(null);
  
  // Hit Analysis Modal state
  const [showHitAnalysis, setShowHitAnalysis] = useState(false);
  const [hitAnalysisUrl, setHitAnalysisUrl] = useState<Url8 | null>(null);
  const [hitAnalysisData, setHitAnalysisData] = useState<any>(null);
  const [hitAnalysisLoading, setHitAnalysisLoading] = useState(false);
  
  // Format date to Indonesian
  const formatDateIndonesian = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  // Generate WhatsApp share text
  const getWhatsAppShareText = () => {
    if (!shareUrlData) return '';
    const typeLabel = shareLinkType === 'Custom' ? shareCustomType : shareLinkType;
    const fullUrl = `${window.location.origin}/${shareUrlData.shortUrl}`;
    return `Tautan ${typeLabel} telah berhasil dibuat ✅

${formatDateIndonesian(shareDate)}
${fullUrl}
✅`;
  };

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
    setModalMode('create');
    setFormData(empty);
    setOriginalData(empty);
    setSelectedUrl(null);
    setFormError('');
    setShowModal(true);
    setShowConfirmClose(false);
    setShowCharInfo(false);
    setShowDescInfo(false);
    setRemovePassword(false);
    setOriginalHasPassword(false);
    // Clear duplicate dialog states
    setShowDuplicateDialog(false);
    setDuplicateShortUrl(null);
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
    setModalMode('edit');
    setFormData(data);
    setOriginalData(data);
    setSelectedUrl(url);
    setFormError('');
    setShowModal(true);
    setShowConfirmClose(false);
    setShowCharInfo(false);
    setShowDescInfo(false);
    // Track if URL originally had password
    setOriginalHasPassword(!!url.password);
    setRemovePassword(false);
    // Clear duplicate dialog states
    setShowDuplicateDialog(false);
    setDuplicateShortUrl(null);
  };

  // Check if shortUrl changed (case-insensitive)
  const hasShortUrlChanged = () => {
    if (!selectedUrl || !formData.shortUrl) return false;
    return formData.shortUrl.toLowerCase() !== selectedUrl.shortUrl.toLowerCase();
  };

  const handleGenerateShortUrl = () => {
    const generated = generateShortUrl();
    setFormData(prev => ({ ...prev, shortUrl: generated }));
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleShortUrlChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z0-9-_]/g, '');
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
      if (formData.shortUrl) data.shortUrl = formData.shortUrl;
      if (formData.password) data.password = formData.password;
      if (formData.expiresAt) data.expiresAt = new Date(formData.expiresAt).toISOString();
      
      // Handle password removal in edit mode
      if (modalMode === 'edit' && removePassword && originalHasPassword) {
        data.removePassword = true;
      }
      
      // Check if shortUrl changed in edit mode (case-insensitive)
      if (modalMode === 'edit' && selectedUrl && hasShortUrlChanged()) {
        const confirmed = window.confirm(
          `Short URL berubah dari "${selectedUrl.shortUrl}" menjadi "${formData.shortUrl}"\n\n` +
          `Apakah Anda ingin menyimpan sebagai URL baru?\n\n` +
          `• Klik OK untuk buat URL baru\n` +
          `• Klik Batal untuk membatalkan`
        );
        
        if (confirmed) {
          // Create new URL with new shortUrl
          console.log('[DEBUG handleSubmit] Creating new URL with shortUrl:', formData.shortUrl);
          await urlApi.create(data);
          setShowModal(false);
          fetchUrls();
          setFormLoading(false);
          return;
        } else {
          // User cancelled - keep modal open
          setFormLoading(false);
          return;
        }
      }
      
      if (modalMode === 'create') {
        await urlApi.create(data);
      } else if (selectedUrl) {
        await urlApi.update(selectedUrl.id, data);
      }
      
      setShowModal(false);
      fetchUrls();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string; duplicateOf?: number } }; status?: number };
      console.error('[DEBUG handleSubmit] Error:', err);
      
      // Build data object for potential duplicate handling
      const data: Record<string, unknown> = {
        targetUrl: formData.targetUrl,
        title: formData.title,
        description: formData.description || formData.keterangan,
        keterangan: formData.keterangan
      };
      if (formData.shortUrl) data.shortUrl = formData.shortUrl;
      if (formData.password) data.password = formData.password;
      if (formData.expiresAt) data.expiresAt = new Date(formData.expiresAt).toISOString();
      
      // Check for duplicate shortURL error - only match specific duplicate keywords
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
      const isDuplicateError =
        errorMessage.toLowerCase().includes('duplicate') ||
        errorMessage.toLowerCase().includes('sudah ada') ||
        errorMessage.toLowerCase().includes('already exists') ||
        error.response?.data?.error === 'duplicate';
      
      // Try to extract the conflicting shortURL from the error message
      let conflictingUrl = formData.shortUrl;
      const shortUrlMatch = errorMessage.match(/short[uU]rl['"]?\s*[:=]\s*['"]?([a-zA-Z0-9-_]+)/i);
      if (shortUrlMatch) {
        conflictingUrl = shortUrlMatch[1];
      }
      
      if (isDuplicateError && modalMode === 'edit' && selectedUrl && hasShortUrlChanged()) {
        // Show custom duplicate dialog instead of just error
        // Use the duplicateOf ID from the backend response to update the CORRECT URL
        const duplicateOfId = (error.response?.data as any)?.data?.duplicateOf ||
                              (error.response?.data as any)?.duplicateOf ||
                              selectedUrl.id;
        const conflictingShortUrl = (error.response?.data as any)?.data?.conflictingShortUrl || conflictingUrl;
        
        setDuplicateShortUrl({
          existingId: duplicateOfId,
          existingShortUrl: conflictingShortUrl,
          newShortUrl: formData.shortUrl,
          newData: data
        });
        setShowDuplicateDialog(true);
      } else {
        setFormError(errorMessage || 'Gagal menyimpan URL');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus URL ini?')) return;
    try { await urlApi.delete(id); fetchUrls(); } catch { alert('Gagal menghapus'); }
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      console.log('[DEBUG copyToClipboard] Success! Copied:', text);
      
      // Show success feedback with longer duration
      setTimeout(() => setCopiedId(null), 3000);
      
      // Optional: Show a brief tooltip or notification
      const el = document.getElementById(`copy-btn-${id}`);
      if (el) {
        el.title = 'Tersalin!';
        setTimeout(() => {
          if (el) el.title = 'Salin';
        }, 3000);
      }
    } catch (err) {
      console.error('[DEBUG copyToClipboard] Failed to copy:', err);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 3000);
      } catch (fallbackErr) {
        console.error('[DEBUG copyToClipboard] Fallback also failed:', fallbackErr);
        alert('Gagal menyalin. Coba salin manual: ' + text);
      }
    }
  };

  const baseUrl = window.location.origin;

  // Open hit analysis modal
  const openHitAnalysis = async (url: Url8) => {
    setHitAnalysisUrl(url);
    setShowHitAnalysis(true);
    setHitAnalysisLoading(true);
    
    try {
      const response = await fetch(`/api8url/analytics/urls/${url.id}`);
      const data = await response.json();
      setHitAnalysisData(data);
    } catch (err) {
      console.error('Failed to fetch hit analysis:', err);
      setHitAnalysisData({ success: false, message: 'Gagal memuat analisis' });
    } finally {
      setHitAnalysisLoading(false);
    }
  };
  
  // Reset hit counter
  const handleResetHitCounter = async (url: Url8) => {
    if (!confirm(`Reset hit counter untuk "${url.shortUrl}"? Counter akan kembali ke 0.`)) return;
    
    try {
      await urlApi.resetCounter(url.id);
      fetchUrls();
    } catch (err) {
      alert('Gagal reset hit counter');
    }
  };
  
  // Reset all hits (delete UrlHit records)
  const handleResetAllHits = async (url: Url8) => {
    if (!confirm(`Hapus semua data UrlHit untuk "${url.shortUrl}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    try {
      // This would require a new API endpoint or we can use the existing reset-counter
      // For now, just reset the counter
      await urlApi.resetCounter(url.id);
      if (hitAnalysisUrl?.id === url.id) {
        openHitAnalysis(url);
      }
      fetchUrls();
    } catch (err) {
      alert('Gagal reset hits');
    }
  };
  
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar URL</h2>
          <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Buat URL Baru</span><span className="sm:hidden">Baru</span>
          </button>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input type="text" placeholder="Cari URL..." value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500" />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5" />{error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                  <th className="px-4 lg:px-6 py-3 font-medium">
                    <button onClick={() => handleSort('shortUrl')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                      Short URL {sortBy === 'shortUrl' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-4 lg:px-6 py-3 font-medium">
                    <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                      Judul {sortBy === 'title' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-4 lg:px-6 py-3 font-medium">
                    <button onClick={() => handleSort('hitCounter')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                      Hits {sortBy === 'hitCounter' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-4 lg:px-6 py-3 font-medium">
                    <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200">
                      Dibuat {sortBy === 'createdAt' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-4 lg:px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Memuat...</td></tr>
                ) : urls.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Belum ada URL. Buat URL pertama Anda!</td></tr>
                ) : urls.map((url, index) => (
                  <tr
                    key={url.id}
                    className={`${index % 2 === 0
                      ? 'bg-white dark:bg-gray-800'
                      : 'bg-gray-50 dark:bg-gray-900/30'} hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors`}
                  >
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm text-indigo-600 dark:text-indigo-400">{url.shortUrl}</code>
                        <button
                          id={`copy-btn-${url.id}`}
                          onClick={() => copyToClipboard(`${baseUrl}/${url.shortUrl}`, url.id)}
                          className={`p-1.5 rounded transition-all ${
                            copiedId === url.id
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title={copiedId === url.id ? 'Tersalin!' : 'Salin URL'}
                        >
                          {copiedId === url.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          id={`copy-target-btn-${url.id}`}
                          onClick={() => copyToClipboard(url.targetUrl, url.id)}
                          className={`p-1.5 rounded transition-all ${
                            copiedId === url.id
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                          }`}
                          title={copiedId === url.id ? 'URL Target Tersalin!' : 'Salin URL Target'}
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="max-w-[120px] lg:max-w-xs">
                        <div className="flex items-center gap-1.5">
                          {url.password && (
                            <span className="text-red-500 flex-shrink-0" title="Dilindungi Password">
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <span className="truncate" title={url.title || url.keterangan || '-'}>
                            {url.title || url.keterangan || '-'}
                          </span>
                        </div>
                        {url.user && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate" title={`Dibuat oleh: ${url.user.username || url.user.email}`}>
                            @{url.user.username || url.user.email?.split('@')[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {(url.hitCounter ?? 0).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleResetHitCounter(url)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Reset Hit Counter"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openHitAnalysis(url)}
                          className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Analisis Hits"
                        >
                          <BarChart3 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col gap-0.5">
                        <span>{url.createdAt ? new Date(url.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                        {(url as any).tglReset && (
                          <span className="text-xs text-red-500 flex items-center gap-1" title="Tanggal Reset Terakhir">
                            <RotateCcw className="w-3 h-3" />
                            Reset: {new Date((url as any).tglReset).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex gap-1 lg:gap-2">
                        <button onClick={() => openEditModal(url)} className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <a href={`${baseUrl}/${url.shortUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300" title="Buka URL">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            setShareUrlData(url);
                            setShareLinkType('Custom');
                            setShareCustomType(url.title || url.keterangan || 'Tautan');
                            setShareDate(new Date().toISOString().split('T')[0]);
                            setShowShareModal(true);
                          }}
                          className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                          title="Bagikan"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(url.id)} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">Memuat...</div>
            ) : urls.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">Belum ada URL. Buat URL pertama Anda!</div>
            ) : urls.map((url, index) => (
              <div
                key={url.id}
                className={`p-4 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-base text-indigo-600 dark:text-indigo-400">{url.shortUrl}</code>
                    {url.password && <span className="text-red-500" title="Dilindungi Password"><Lock className="w-4 h-4" /></span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(url)} className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-500 dark:text-gray-400" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <a href={`${baseUrl}/${url.shortUrl}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded text-gray-500 dark:text-gray-400" title="Buka URL">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                
                {/* Title & Owner */}
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {url.title || url.keterangan || '-'}
                  </p>
                  {url.user && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      @{url.user.username || url.user.email?.split('@')[0]}
                    </p>
                  )}
                </div>
                
                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>Hits: <span className="font-medium text-gray-700 dark:text-gray-300">{(url.hitCounter ?? 0).toLocaleString()}</span></span>
                  <span>{url.createdAt ? new Date(url.createdAt).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    id={`copy-btn-${url.id}`}
                    onClick={() => copyToClipboard(`${baseUrl}/${url.shortUrl}`, url.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${
                      copiedId === url.id
                        ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {copiedId === url.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === url.id ? 'Tersalin!' : 'Salin URL'}
                  </button>
                  <button
                    onClick={() => {
                      setShareUrlData(url);
                      setShareLinkType('Custom');
                      setShareCustomType(url.title || url.keterangan || 'Tautan');
                      setShareDate(new Date().toISOString().split('T')[0]);
                      setShowShareModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    Bagikan
                  </button>
                  <button
                    onClick={() => handleDelete(url.id)}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-all"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between z-10">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {modalMode === 'create' ? '✨ Buat URL Baru' : '✏️ Edit URL'}
              </h3>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              {/* URL Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Target <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.targetUrl}
                  onChange={e => handleFormChange('targetUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
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
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Allowed karakter :</p>
                    <p className="font-mono">
                      {SHORTURL_ALL_CHARS}
                    </p>
                    <p className="mt-2 text-amber-700 dark:text-amber-400">
                      ⚠️ Short URL akan dipertahankan. KombinasiHuruf besar & kecil bisa digunakan saat memasukkan.
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex flex-1">
                    <span className="inline-flex items-center px-2 sm:px-3 rounded-l-lg border border-r-0 bg-gray-50 dark:bg-gray-700 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {baseUrl}/
                    </span>
                    <input
                      type="text"
                      value={formData.shortUrl}
                      onChange={e => handleShortUrlChange(e.target.value)}
                      className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder="contoh-url"
                      minLength={3}
                      maxLength={50}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateShortUrl}
                    className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 text-sm font-medium"
                    title="Generate otomatis"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  3-50 karakter. Kosongkan untuk auto-generate dengan karakter acak.
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Judul <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Judul singkat untuk URL ini"
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Keterangan / Deskripsi <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDescInfo(!showDescInfo)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    Info
                  </button>
                </div>

                {showDescInfo && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-medium mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Info Keterangan/Deskripsi:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Field ini akan ditampilkan di halaman redirect (/f/shortUrl)</li>
                      <li>Jika contains password, akan di-masking setelah keyword password</li>
                      <li>Contoh: "Undangan rapat | password: abc123" → "Undangan rapat | *****"</li>
                    </ul>
                  </div>
                )}

                <textarea
                  value={formData.description || formData.keterangan}
                  onChange={e => { handleFormChange('description', e.target.value); handleFormChange('keterangan', e.target.value); }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Deskripsi atau keterangan tambahan tentang URL ini"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {originalHasPassword && (
                    <span className="text-red-500 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Berpassword!!
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => handleFormChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder={modalMode === 'edit' && originalHasPassword ? 'Isi password baru hanya bila mengganti password' : 'Biarkan kosong jika tidak perlu password'}
                  disabled={removePassword}
                />
                {/* Remove Password checkbox - only show in edit mode when URL has password */}
                {modalMode === 'edit' && originalHasPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="removePassword"
                      checked={removePassword}
                      onChange={e => setRemovePassword(e.target.checked)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="removePassword" className="text-sm text-red-600">
                      Buang Password (hapus perlindungan password)
                    </label>
                  </div>
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Berlaku hingga <span className="text-gray-400 dark:text-gray-500 font-normal">(opsional)</span>
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={e => handleFormChange('expiresAt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 border border-red-300 dark:border-red-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-red-600 dark:text-red-400"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 bg-indigo-600 dark:bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:opacity-50 font-medium"
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
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowConfirmClose(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Perubahan Belum Tersimpan</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Anda telah membuat perubahan. Apakah Anda yakin ingin menutup tanpa menyimpan?
                </p>
              </div>
            </div>

            {getChangedFields().length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Perubahan yang akan dibatalkan:</p>
                <div className="flex flex-wrap gap-1">
                  {getChangedFields().map(field => (
                    <span key={field} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs rounded">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300"
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

      {/* Duplicate ShortURL Dialog */}
      {showDuplicateDialog && duplicateShortUrl && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-[70]"
          onClick={() => {
            setShowDuplicateDialog(false);
            setDuplicateShortUrl(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-orange-500 dark:bg-orange-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Short URL Sudah Ada!</h3>
                  <p className="text-sm text-white/80">Konflik dengan URL yang sudah ada</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicateShortUrl(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Short URL <code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono text-sm">{duplicateShortUrl.newShortUrl}</code>
                  {' '}sudah digunakan oleh URL lain.
                </p>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        URL Existing: <code className="font-mono">{duplicateShortUrl.existingShortUrl}</code>
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        URL baru ingin menggunakan nama yang sama.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pilih tindakan yang ingin dilakukan:
                </p>
                <div className="space-y-3">
                  {/* Option 1: Keep modal open for user to fix */}
                  <button
                    onClick={() => {
                      setShowDuplicateDialog(false);
                      setDuplicateShortUrl(null);
                      // Keep the modal open - user can change the shortURL manually
                      // The formError will show the warning
                      setFormError(`Short URL "${duplicateShortUrl.newShortUrl}" sudah digunakan. Silakan gunakan nama lain.`);
                    }}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900">
                        <Pencil className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Kembali ke Edit Modal</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Kembali ke form edit dan gunakan short URL berbeda.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Update existing URL Y with new values */}
                  <button
                    onClick={async () => {
                      if (!duplicateShortUrl) return;
                      setFormLoading(true);
                      try {
                        console.log('[DEBUG Duplicate Dialog] Updating URL ID:', duplicateShortUrl.existingId, 'with data:', duplicateShortUrl.newData);
                        
                        // When updating the existing URL, we should NOT update the shortUrl
                        // because:
                        // 1. The existing URL already has its own shortUrl
                        // 2. The shortUrl conflict is because user tried to use a shortUrl that already exists
                        // 3. We keep the existing URL's shortUrl and only update other fields
                        const { shortUrl, ...updateData } = duplicateShortUrl.newData as Record<string, unknown>;
                        console.log('[DEBUG Duplicate Dialog] Update data (keeping existing shortUrl):', updateData);
                        
                        await urlApi.update(duplicateShortUrl.existingId, updateData);
                        setShowDuplicateDialog(false);
                        setDuplicateShortUrl(null);
                        setShowModal(false);
                        fetchUrls();
                      } catch (err) {
                        console.error('[DEBUG Duplicate Dialog] Update failed:', err);
                        setFormError('Gagal mengupdate URL yang sudah ada. Silakan coba lagi.');
                      } finally {
                        setFormLoading(false);
                      }
                    }}
                    className="w-full p-4 border-2 border-orange-200 dark:border-orange-700 rounded-lg hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900">
                        <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Update URL yang Ada</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Timpa data URL existing <code className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded">{duplicateShortUrl.existingShortUrl}</code> dengan data terbaru.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  setDuplicateShortUrl(null);
                }}
                className="w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share Modal */}
      {showShareModal && shareUrlData && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-green-600 dark:bg-green-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-white" />
                <h3 className="text-lg font-semibold text-white">Bagikan ke WhatsApp</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-green-700 dark:hover:bg-green-800 rounded text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Link Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jenis Tautan</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['Acara', 'Rapat', 'Dokumen', 'Grup', 'Custom'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setShareLinkType(type);
                        if (type !== 'Custom') {
                          setShareCustomType('');
                        }
                      }}
                      className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                        shareLinkType === type
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {type === 'Acara' && <Presentation className="w-5 h-5" />}
                      {type === 'Rapat' && <Users className="w-5 h-5" />}
                      {type === 'Dokumen' && <FileText className="w-5 h-5" />}
                      {type === 'Grup' && <Users className="w-5 h-5" />}
                      {type === 'Custom' && <Sparkles className="w-5 h-5" />}
                      <span className="text-xs font-medium">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Type Input */}
              {shareLinkType === 'Custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kustom</label>
                  <input
                    type="text"
                    value={shareCustomType}
                    onChange={e => setShareCustomType(e.target.value)}
                    placeholder="Contoh: Undangan, Meeting, dll"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={shareDate}
                    onChange={e => setShareDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap">
                  {getWhatsAppShareText()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-2.5 border border-red-300 rounded-lg hover:bg-green-50 font-medium text-red-700"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    const textToCopy = getWhatsAppShareText();
                    console.log('[DEBUG WhatsApp Share] Text to copy:', textToCopy);
                    
                    if (!textToCopy) {
                      console.error('[DEBUG WhatsApp Share] No text to copy - shareUrlData might be null');
                      alert('Gagal menyalin. Data tidak tersedia.');
                      return;
                    }
                    
                    // Try navigator.clipboard first
                    try {
                      await navigator.clipboard.writeText(textToCopy);
                      console.log('[DEBUG WhatsApp Share] Success with navigator.clipboard');
                      setShareInfoCopied(true);
                      setTimeout(() => {
                        setShowShareModal(false);
                        setShareInfoCopied(false);
                      }, 1500);
                    } catch (err) {
                      console.error('[DEBUG WhatsApp Share] navigator.clipboard failed:', err);
                      // Fallback for older browsers or restricted environments
                      try {
                        const textArea = document.createElement('textarea');
                        textArea.value = textToCopy;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        textArea.style.top = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        const success = document.execCommand('copy');
                        document.body.removeChild(textArea);
                        console.log('[DEBUG WhatsApp Share] Fallback execCommand success:', success);
                        if (success) {
                          setShareInfoCopied(true);
                          setTimeout(() => {
                            setShowShareModal(false);
                            setShareInfoCopied(false);
                          }, 1500);
                        } else {
                          alert('Gagal menyalin. Coba salin manual:\n\n' + textToCopy);
                        }
                      } catch (fallbackErr) {
                        console.error('[DEBUG WhatsApp Share] Fallback also failed:', fallbackErr);
                        alert('Gagal menyalin. Coba salin manual:\n\n' + textToCopy);
                      }
                    }
                  }}
                  disabled={shareInfoCopied}
                  className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    shareInfoCopied
                      ? 'bg-green-500 text-white'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {shareInfoCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Salin Informasi
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hit Analysis Modal */}
      {showHitAnalysis && hitAnalysisUrl && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setShowHitAnalysis(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Analisis Hit</h3>
                  <p className="text-sm text-white/80">{hitAnalysisUrl.shortUrl}</p>
                </div>
              </div>
              <button onClick={() => setShowHitAnalysis(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {hitAnalysisLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-500">Memuat analisis...</span>
                </div>
              ) : hitAnalysisData?.success === false ? (
                <div className="text-center py-8 text-red-500">
                  {hitAnalysisData?.message || 'Gagal memuat analisis'}
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Total Hits</span>
                      </div>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {(hitAnalysisData?.data?.totalHits || hitAnalysisUrl.hitCounter || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Desktop</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {(hitAnalysisData?.data?.byDevice?.desktop || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Mobile</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {(hitAnalysisData?.data?.byDevice?.mobile || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tablet className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Tablet</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {(hitAnalysisData?.data?.byDevice?.tablet || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Recent Hits Table */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hits Terbaru
                    </h4>
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                            <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                              <th className="px-3 py-2">Waktu</th>
                              <th className="px-3 py-2">Perangkat</th>
                              <th className="px-3 py-2">Browser</th>
                              <th className="px-3 py-2">IP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {hitAnalysisData?.data?.recentHits?.length > 0 ? (
                              hitAnalysisData.data.recentHits.map((hit: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                    {new Date(hit.createdAt).toLocaleString('id-ID')}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                      hit.deviceType === 'desktop' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' :
                                      hit.deviceType === 'mobile' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' :
                                      'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                                    }`}>
                                      {hit.deviceType === 'desktop' && <Monitor className="w-3 h-3" />}
                                      {hit.deviceType === 'mobile' && <Smartphone className="w-3 h-3" />}
                                      {hit.deviceType === 'tablet' && <Tablet className="w-3 h-3" />}
                                      {hit.deviceType}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{hit.browser || '-'}</td>
                                  <td className="px-3 py-2 text-gray-500 dark:text-gray-500 font-mono text-xs">{hit.ipAddress || '-'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                                  Tidak ada data hits
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Referrers */}
                  {hitAnalysisData?.data?.byReferer && Object.keys(hitAnalysisData.data.byReferer).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Sumber Trafic
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(hitAnalysisData.data.byReferer).slice(0, 5).map(([referer, count]: [string, any]) => (
                          <div key={referer} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                              {referer || '(Direct)'}
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {Number(count).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleResetAllHits(hitAnalysisUrl)}
                  className="flex-1 py-2 px-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Semua Hits
                </button>
                <button
                  onClick={() => setShowHitAnalysis(false)}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
