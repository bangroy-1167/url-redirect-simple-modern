import { ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link2, Settings, Sun, Moon, Monitor, Menu, X, Globe } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
  activePage?: 'dashboard' | 'urls' | 'users' | 'settings';
}

export default function Layout({ children, activePage }: LayoutProps) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, availableLanguages } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close language menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  const navItems = [
    { to: '/kelola', label: 'Dashboard', page: 'dashboard' as const },
    { to: '/kelola/urls', label: 'URLs', page: 'urls' as const },
    ...(user?.role === 'ADMIN' ? [
      { to: '/kelola/users', label: 'Users', page: 'users' as const },
      { to: '/kelola/settings', label: 'Settings', page: 'settings' as const, icon: Settings },
    ] : []),
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'system': return <Monitor className="w-4 h-4" />;
    }
  };

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Link2 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white leading-tight">{settings.appName}</h1>
                <p className="text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 leading-tight">{settings.appSubtitle}</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Version Badge */}
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-mono rounded-full transition-all">
                {settings.appVersion}
              </span>

              {/* Language Toggle */}
              <div className="relative" ref={langMenuRef}>
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
                  title="Change Language"
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{currentLang.flag}</span>
                  <span className="text-xs font-medium">{currentLang.code.toUpperCase()}</span>
                </button>
                
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fadeIn max-h-64 overflow-y-auto">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          language === lang.code ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
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

              {/* Theme Toggle */}
              <button
                onClick={cycleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title={`Tema: ${theme === 'light' ? 'Terang' : theme === 'dark' ? 'Gelap' : 'System'} (klik untuk ganti)`}
              >
                {getThemeIcon()}
              </button>
               
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.username} <span className="text-gray-400 dark:text-gray-500">({user?.role})</span>
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={cycleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {getThemeIcon()}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile User Info */}
          <div className="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.username} <span className="text-gray-400 dark:text-gray-500">({user?.role})</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activePage === item.page
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 lg:gap-6 py-2 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.page}
                to={item.to}
                className={`text-sm font-medium pb-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${
                  activePage === item.page
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
