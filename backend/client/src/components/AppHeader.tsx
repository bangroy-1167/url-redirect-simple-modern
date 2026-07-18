import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link2, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AppHeaderProps {
  className?: string;
  showLoginLink?: boolean;
}

export default function AppHeader({ className = '', showLoginLink = false }: AppHeaderProps) {
  const { settings } = useSettings();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  return (
    <header className={`bg-white/80 backdrop-blur-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and App Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-tight">
                {settings.appName}
              </span>
              {settings.appSubtitle && (
                <span className="text-xs text-gray-500 leading-tight hidden sm:block">
                  {settings.appSubtitle}
                </span>
              )}
            </div>
          </Link>
          
          {/* Version, Language Toggle, and Login Link */}
          <div className="flex items-center gap-3">
            {/* Version Badge */}
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full border border-gray-200">
              {settings.appVersion}
            </span>
            
            {/* Language Toggle */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg border border-indigo-200 transition-colors"
                title={t('changeLanguage') || 'Change Language'}
              >
                <Globe className="w-4 h-4" />
                <span>{currentLang.flag}</span>
                <span className="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
              </button>
              
              {/* Language Dropdown */}
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn max-h-64 overflow-y-auto">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                        language === lang.code ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="font-medium">{lang.label}</span>
                      {language === lang.code && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Login Link */}
            {showLoginLink && (
              <Link 
                to="/kelola/login" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </header>
  );
}
