import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { adminStatsApi } from '../api/client';
import { Stats } from '../types/api';
import {
  Link2,
  Users,
  MousePointerClick,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await adminStatsApi.get();
      setStats(response.data.data);
    } catch (err: unknown) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

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
                <h1 className="text-xl font-bold text-gray-900">modernURL8</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
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
              className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 pb-3 -mb-px"
            >
              Dashboard
            </Link>
            <Link
              to="/kelola/urls"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 pb-3 -mb-px"
            >
              URLs
            </Link>
            <Link
              to="/kelola/users"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 pb-3 -mb-px"
            >
              Users
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Overview Statistics</h2>
          <button
            onClick={fetchStats}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total URLs"
            value={stats?.totalUrls ?? '-'}
            icon={Link2}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Active URLs"
            value={stats?.activeUrls ?? '-'}
            icon={TrendingUp}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers ?? '-'}
            icon={Users}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Total Hits"
            value={stats?.totalHits ?? '-'}
            icon={MousePointerClick}
            color="bg-orange-100 text-orange-600"
          />
        </div>

        {/* Top URLs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Top URLs by Hits</h3>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : stats?.topUrls && stats.topUrls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">Short URL</th>
                    <th className="pb-3 font-medium">Title</th>
                    <th className="pb-3 font-medium text-right">Hits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topUrls.map((url) => (
                    <tr key={url.id} className="text-sm">
                      <td className="py-3">
                        <span className="font-mono text-indigo-600">{url.shortUrl}</span>
                      </td>
                      <td className="py-3 text-gray-600">{url.title || '-'}</td>
                      <td className="py-3 text-right font-medium">{url.hitCounter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No URLs found</p>
          )}
        </div>
      </main>
    </div>
  );
}
