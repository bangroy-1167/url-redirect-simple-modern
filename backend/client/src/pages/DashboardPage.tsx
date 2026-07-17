import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminStatsApi } from '../api/client';
import { Stats } from '../types/api';
import Layout from '../components/Layout';
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
  const { user } = useAuth();
  const { settings } = useSettings();
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
      setError('Gagal memuat statistik');
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
    <Layout activePage="dashboard">
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total URLs" value={stats.totalUrls?.toLocaleString() || 0} icon={Link2} color="bg-blue-100 text-blue-600" />
            <StatCard title="Total Hits" value={stats.totalHits?.toLocaleString() || 0} icon={MousePointerClick} color="bg-green-100 text-green-600" />
            <StatCard title="Active URLs" value={stats.activeUrls?.toLocaleString() || 0} icon={TrendingUp} color="bg-indigo-100 text-indigo-600" />
            <StatCard title="Total Users" value={stats.totalUsers?.toLocaleString() || 0} icon={Users} color="bg-purple-100 text-purple-600" />
          </div>

          {stats.topUrls && stats.topUrls.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Top URLs by Hits</h3>
              </div>
              <div className="space-y-3">
                {stats.topUrls.slice(0, 5).map((url, i) => (
                  <div key={url.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 text-indigo-600 text-sm font-medium rounded-full">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{url.shortUrl}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{url.title || '-'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {url.hitCounter?.toLocaleString() || 0} hits
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
