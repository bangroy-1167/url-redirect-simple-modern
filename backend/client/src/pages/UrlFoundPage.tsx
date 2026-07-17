import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { CheckCircle, ExternalLink, Clock, AlertCircle } from 'lucide-react';

interface UrlInfo {
  id: number;
  shortUrl: string;
  targetUrl: string;
  title?: string;
  keterangan?: string;
  description?: string;
}

export default function UrlFoundPage() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const { settings } = useSettings();
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const baseUrl = window.location.origin;

  // Sync countdown with settings when settings loads
  useEffect(() => {
    setCountdown(settings.autoRedirectDelay || 2);
  }, [settings.autoRedirectDelay]);

  useEffect(() => {
    const fetchUrlInfo = async () => {
      if (!shortUrl) {
        setError('Short URL tidak ditemukan');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api8url/f/${shortUrl}`);
        const data = await response.json();
        
        console.log('[DEBUG fetchUrlInfo] Full API response:', data);
        console.log('[DEBUG fetchUrlInfo] data.data.shortUrl:', data.data?.shortUrl);
        console.log('[DEBUG fetchUrlInfo] data.data.title:', data.data?.title);
        console.log('[DEBUG fetchUrlInfo] data.data.keterangan:', data.data?.keterangan);
        
        if (data.success && data.data) {
          setUrlInfo(data.data);
          setTimeout(() => {
            setIsRedirecting(true);
          }, 500);
        } else {
          setError(data.message || 'URL tidak ditemukan');
        }
      } catch (err) {
        console.error('[DEBUG fetchUrlInfo] Fetch error:', err);
        setError('Gagal memuat informasi URL');
      } finally {
        setLoading(false);
      }
    };

    fetchUrlInfo();
  }, [shortUrl]);

  // Countdown timer
  useEffect(() => {
    if (loading || error || !urlInfo || !settings.autoRedirect) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = urlInfo.targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, urlInfo, settings.autoRedirect]);

  const manualRedirect = () => {
    if (urlInfo) {
      window.location.href = urlInfo.targetUrl;
    }
  };

  // Mask URL showing only protocol://host/
  const getMaskedUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol + '//' + parsed.host + '/...';
    } catch {
      return url.substring(0, 40) + '...';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">URL Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/kelola" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 28;
  const progress = settings.autoRedirectDelay > 0 && countdown > 0 ? (settings.autoRedirectDelay - countdown) / settings.autoRedirectDelay : 0;
  
  // Debug logging
  console.log('[DEBUG UrlFoundPage] urlInfo:', urlInfo);
  console.log('[DEBUG UrlFoundPage] countdown:', countdown);
  console.log('[DEBUG UrlFoundPage] isRedirecting:', isRedirecting);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-500 ${
            isRedirecting ? 'bg-green-500 scale-110' : 'bg-indigo-100'
          }`}>
            {isRedirecting ? (
              <ExternalLink className="w-10 h-10 text-white" />
            ) : (
              <CheckCircle className="w-10 h-10 text-indigo-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isRedirecting ? 'Redirect dalam...' : 'URL Ditemukan!'}
          </h1>
          {settings.autoRedirect && (
            <div className="flex justify-center gap-4 mt-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="6" fill="none" />
                  <circle
                    cx="40" cy="40" r="36" stroke="#10b981" strokeWidth="6" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    className="transition-all duration-1000" strokeLinecap="round"
                  />
                  <g transform="rotate(90 40 40)">
                    <text x="40" y="46" textAnchor="middle" className="text-3xl font-bold fill-gray-700" dominantBaseline="middle">
                      {countdown}
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* URL Info Card */}
        {urlInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="mb-3">
              <span className="text-sm text-gray-500 block mb-2">Short URL</span>
              <code className="text-sm font-mono text-gray-800 bg-white px-3 py-2 rounded border block overflow-x-auto">
                {/* Use shortUrl from API, fallback to URL param */}
                {baseUrl}/{(urlInfo as any).shortUrl || shortUrl}
              </code>
            </div>
            
            {(urlInfo.title || urlInfo.keterangan || urlInfo.description) && (
              <div className="mb-3">
                <span className="text-sm text-gray-500 block mb-2">Judul | Deskripsi</span>
                <p className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-white px-3 py-2 rounded border min-h-[60px]">
                  {urlInfo.title}
                  {urlInfo.title && (urlInfo.keterangan || urlInfo.description) ? ' | ' : ''}
                  {urlInfo.keterangan || urlInfo.description}
                </p>
              </div>
            )}
            
            <div className="border-t pt-3">
              <span className="text-sm text-gray-500 block mb-2">Target URL</span>
              <p className="text-sm text-indigo-600 bg-white px-3 py-2 rounded border font-mono break-all">
                {getMaskedUrl(urlInfo.targetUrl)}
              </p>
            </div>
          </div>
        )}

        {/* Countdown & Redirect Info */}
        <div className="text-center mb-6">
          {settings.autoRedirect ? (
            isRedirecting ? (
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                Mengalihkan ke halaman tujuan dalam {countdown} detik...
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Mempersiapkan redirect...
              </p>
            )
          ) : (
            <p className="text-sm text-gray-500">
              Auto-redirect dinonaktifkan. Klik tombol untuk redirect.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to="/kelola" className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center transition-colors">
            Batal
          </Link>
          <button onClick={manualRedirect} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Redirect Sekarang
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Anda akan diarahkan ke: {urlInfo?.targetUrl ? getMaskedUrl(urlInfo.targetUrl) : '...'}
        </p>
      </div>
    </div>
  );
}
