import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { Link2 } from 'lucide-react';

interface AppHeaderProps {
  className?: string;
  showLoginLink?: boolean;
}

export default function AppHeader({ className = '', showLoginLink = false }: AppHeaderProps) {
  const { settings } = useSettings();
  
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
          
          {/* Version and Login Link */}
          <div className="flex items-center gap-4">
            {/* Version Badge */}
            <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded-full border border-gray-200">
              {settings.appVersion}
            </span>
            
            {/* Login Link */}
            {showLoginLink && (
              <Link 
                to="/login" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
