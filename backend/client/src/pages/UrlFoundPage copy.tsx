import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ExternalLink, Clock, AlertCircle, Copy, Check } from 'lucide-react';

interface UrlInfo {
  id: number;
  shortUrl: string;
  targetUrl: string;
  title?: string;
  keterangan?: string;
}

export default function UrlFoundPage() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [copied, setCopied] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const baseUrl = window.location.origin;

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
        
        if (data.success && data.data) {
          setUrlInfo(data.data);
          
          // Start countdown after info is loaded
          setTimeout(() => {
            setIsRedirecting(true);
          }, 500);
        } else {
          setError(data.message || 'URL tidak ditemukan');
        }
      } catch (err) {
        setError('Gagal memuat informasi URL');
      } finally {
        setLoading(false);
      }
    };

    fetchUrlInfo();
  }, [shortUrl]);

  // Countdown timer
  useEffect(() => {
    if (loading || error || !urlInfo) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to target URL
          window.location.href = urlInfo.targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, urlInfo]);

  const copyToClipboard = async () => {
    if (urlInfo) {
      await navigator.clipboard.writeText(urlInfo.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const manualRedirect = () => {
    if (urlInfo) {
      window.location.href = urlInfo.targetUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
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
          <Link 
            to="/kelola"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
          {isRedirecting && (
            <div className="flex justify-center gap-4 mt-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10b981"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - (2 - countdown) / 2)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gray-700">
                  {countdown}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* URL Info Card */}
        {urlInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Short URL</span>
              <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                {baseUrl}/{urlInfo.shortUrl}
              </code>
            </div>
            {urlInfo.title && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Judul</span>
                <p className="font-medium text-gray-900">{urlInfo.title}</p>
              </div>
            )}
            {urlInfo.keterangan && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Deskripsi</span>
                <p className="text-sm text-gray-700">{urlInfo.keterangan}</p>
              </div>
            )}
            <div className="border-t pt-3">
              <span className="text-sm text-gray-500 block mb-1">Target URL</span>
              <div className="flex items-center gap-2">
                <p className="text-sm text-indigo-600 truncate flex-1" title={urlInfo.targetUrl}>
                  {urlInfo.targetUrl}
                </p>
                <button 
                  onClick={copyToClipboard}
                  className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                  title="Salin URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Countdown & Redirect Info */}
        <div className="text-center mb-6">
          {isRedirecting ? (
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Mengalihkan ke halaman tujuan dalam {countdown} detik...
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Mempersiapkan redirect...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link 
            to="/kelola"
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center transition-colors"
          >
            Batal
          </Link>
          <button 
            onClick={manualRedirect}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Redirect Sekarang
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Anda akan diarahkan ke: <span className="font-mono">{urlInfo?.targetUrl?.substring(0, 50)}...</span>
        </p>
      </div>
    </div>
  );
}
