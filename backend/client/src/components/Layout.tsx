import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Link2, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activePage?: 'dashboard' | 'urls' | 'users' | 'settings';
}

export default function Layout({ children, activePage }: LayoutProps) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Link2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{settings.appName}</h1>
                <p className="text-sm text-gray-500">{settings.appSubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.username} <span className="text-gray-400">({user?.role})</span>
              </span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 py-3">
            <Link
              to="/kelola"
              className={`text-sm font-medium pb-3 -mb-px ${
                activePage === 'dashboard'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/kelola/urls"
              className={`text-sm font-medium pb-3 -mb-px ${
                activePage === 'urls'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              URLs
            </Link>
            {user?.role === 'ADMIN' && (
              <>
                <Link
                  to="/kelola/users"
                  className={`text-sm font-medium pb-3 -mb-px ${
                    activePage === 'users'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Users
                </Link>
                <Link
                  to="/kelola/settings"
                  className={`text-sm font-medium pb-3 -mb-px flex items-center gap-1 ${
                    activePage === 'settings'
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
