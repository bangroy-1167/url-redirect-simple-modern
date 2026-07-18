import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { CheckCircle, ExternalLink, Clock, AlertCircle, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import AppHeader from '../components/AppHeader';

interface UrlInfo {
  id: number;
  shortUrl: string;
  targetUrl: string;
  title?: string;
  keterangan?: string;
  description?: string;
  hasPassword?: boolean;
  isExpired: boolean;
  isAvailable: boolean;
}

export default function UrlFoundPage() {
  const { shortUrl } = useParams<{ shortUrl: string }>();
  const { settings } = useSettings();
  const [urlInfo, setUrlInfo] = useState<UrlInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Password challenge states
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordAttempts, setPasswordAttempts] = useState(0);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  const baseUrl = window.location.origin;
  const MAX_PASSWORD_ATTEMPTS = 3;

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
        console.log('[DEBUG fetchUrlInfo] data.data.password:', data.data?.password);
        console.log('[DEBUG fetchUrlInfo] data.data.hasPassword:', data.data?.hasPassword);
        
        if (data.success && data.data) {
          // Check if URL has password (hasPassword or password field exists)
          const hasPass = data.data.hasPassword || !!data.data.password;
          setUrlInfo({
            ...data.data,
            hasPassword: hasPass,
            password: undefined, // Don't expose password to frontend
          });
          
          // If no password required, proceed to redirect
          if (!hasPass) {
            setIsPasswordVerified(true);
            setTimeout(() => {
              setIsRedirecting(true);
            }, 500);
          }
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

  // Verify password with API
  const verifyPassword = async (password: string) => {
    if (!shortUrl) return false;
    
    try {
      const response = await fetch(`/api8url/f/${shortUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      
      console.log('[DEBUG verifyPassword] Response:', data);
      return data.success === true;
    } catch (err) {
      console.error('[DEBUG verifyPassword] Error:', err);
      return false;
    }
  };

  // Handle password submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordInput.trim()) {
      setPasswordError('Password tidak boleh kosong');
      return;
    }

    setVerifyingPassword(true);
    setPasswordError(null);

    const isValid = await verifyPassword(passwordInput);

    if (isValid) {
      setIsPasswordVerified(true);
      setPasswordError(null);
      setTimeout(() => {
        setIsRedirecting(true);
      }, 500);
    } else {
      const newAttempts = passwordAttempts + 1;
      setPasswordAttempts(newAttempts);
      
      if (newAttempts >= MAX_PASSWORD_ATTEMPTS) {
        setPasswordError('⚠️ Percobaan gagal. Password adalah case-sensitive. Pastikan Caps Lock tidak aktif dan coba lagi nanti.');
      } else {
        const remaining = MAX_PASSWORD_ATTEMPTS - newAttempts;
        setPasswordError(`❌ Password salah. Sisa percobaan: ${remaining}x. Password bersifat case-sensitive (perhatikan huruf besar/kecil).`);
      }
      setPasswordInput('');
    }

    setVerifyingPassword(false);
  };

  // Countdown timer (only if password verified or no password required)
  useEffect(() => {
    if (loading || error || !urlInfo || !settings.autoRedirect || !isPasswordVerified) return;
    
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
  }, [loading, error, urlInfo, settings.autoRedirect, isPasswordVerified]);

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

  // Mask description at password-related keywords - mask FROM keyword to end with #abiyoRF#
  const getProcessedDescription = (text: string): string => {
    if (!text) return '';
    
    // Keywords that indicate password information
    const passwordKeywords = [
      'password', 'passwd', 'pwd', 'pass', 'pw', 'pswd',
      'keyword', 'key', 'kunci', 'kata sandi', 'sandinya',
      'secret', 'token', 'access', 'code', 'pin'
    ];
    
    // Create regex pattern to find keyword (case insensitive)
    const pattern = new RegExp(
      `(${passwordKeywords.join('|')})`,
      'gi'
    );
    
    // Find the first occurrence of a password keyword
    const match = text.match(pattern);
    
    if (match) {
      // Find the position of the keyword
      const keywordIndex = text.toLowerCase().indexOf(match[0].toLowerCase());
      // Return text BEFORE the keyword + #abiyoRF# placeholder
      const beforeKeyword = text.substring(0, keywordIndex);
      return (beforeKeyword + '#abiyoRF#').trim();
    }
    
    // No password keyword found, return full text
    return text;
  };
  
  // Get combined info for "Informasi Link" section
  const getCombinedInfo = (): string => {
    const parts: string[] = [];
    if (urlInfo?.title) parts.push(urlInfo.title);
    const desc = urlInfo?.keterangan || urlInfo?.description || '';
    if (desc) parts.push(getProcessedDescription(desc));
    return parts.join(' - ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-4">
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
      </div>
    );
  }

  // Password Challenge UI
  if (urlInfo?.hasPassword && !isPasswordVerified) {
    const isLocked = passwordAttempts >= MAX_PASSWORD_ATTEMPTS;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          {/* Lock Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-500 ${
              isLocked ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              {isLocked ? (
                <AlertCircle className="w-10 h-10 text-red-600" />
              ) : (
                <Lock className="w-10 h-10 text-amber-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isLocked ? 'Akses Diblokir' : 'URL Dilindungi Password'}
            </h1>
            
            {/* Show shortUrl and Title only */}
            <div className="mt-4 space-y-2">
              <code className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded block break-all word-break-all">
                {baseUrl}/{urlInfo.shortUrl}
              </code>
              {urlInfo.title && (
                <p className="text-lg font-medium text-gray-800 break-words">{urlInfo.title}</p>
              )}
            </div>
          </div>

          {/* Password Form */}
          {!isLocked ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Masukkan Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    disabled={verifyingPassword}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {passwordError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 whitespace-pre-line">{passwordError}</p>
                </div>
              )}

              {/* Attempts Indicator */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Percobaan: {passwordAttempts}/{MAX_PASSWORD_ATTEMPTS}
                </span>
                <span className="text-amber-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Password case-sensitive
                </span>
              </div>

              <button
                type="submit"
                disabled={verifyingPassword || !passwordInput.trim()}
                className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyingPassword ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Buka Kunci
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Locked State */
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 text-center">
                  Anda telah melebihi {MAX_PASSWORD_ATTEMPTS}x percobaan.
                </p>
                <p className="text-sm text-red-700 text-center mt-2 font-medium">
                  💡 Tips: Password bersifat case-sensitive (huruf besar/kecil berbeda). Pastikan Caps Lock tidak aktif.
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Hubungi pemilik tautan untuk mendapatkan password yang benar.
                </p>
                <Link 
                  to="/kelola" 
                  className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Kembali ke Dashboard
                </Link>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-gray-400 text-center mt-6">
            Akses publik • informasi ini dilindungi
          </p>
        </div>
        </div>
      </div>
    );
  }

  // URL Found & Redirect UI (after password verified or no password required)
  const circumference = 2 * Math.PI * 28;
  const progress = settings.autoRedirectDelay > 0 && countdown > 0 ? (settings.autoRedirectDelay - countdown) / settings.autoRedirectDelay : 0;
  
  // Debug logging
  console.log('[DEBUG UrlFoundPage] urlInfo:', urlInfo);
  console.log('[DEBUG UrlFoundPage] countdown:', countdown);
  console.log('[DEBUG UrlFoundPage] isRedirecting:', isRedirecting);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      <AppHeader />
      <div className="flex-1 flex items-center justify-center p-4">
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

        {/* URL Info Card - Merged "Informasi Link" section */}
        {urlInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div>
              <span className="text-sm text-gray-500 block mb-2">Short URL</span>
              <code className="text-sm font-mono text-gray-800 bg-white px-3 py-2 rounded border block break-all word-break-all">
                {baseUrl}/{(urlInfo as any).shortUrl || shortUrl}
              </code>
            </div>
            
            {/* Combined Judul + Keterangan/Deskripsi dengan masking password */}
            {getCombinedInfo() && (
              <div>
                <span className="text-sm text-gray-500 block mb-2">Informasi Link</span>
                <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border min-h-[40px] break-words whitespace-pre-wrap">
                  {getCombinedInfo()}
                </p>
              </div>
            )}
            
            <div className="border-t pt-3">
              <span className="text-sm text-gray-500 block mb-2">Target URL</span>
              <p className="text-sm text-indigo-600 bg-white px-3 py-2 rounded border font-mono break-all word-break-all leading-relaxed">
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
        <p className="text-xs text-gray-400 text-center mt-6 break-words">
          Anda akan diarahkan ke: <span className="font-mono">{urlInfo?.targetUrl ? getMaskedUrl(urlInfo.targetUrl) : '...'}</span>
        </p>
      </div>
      </div>
    </div>
  );
}
