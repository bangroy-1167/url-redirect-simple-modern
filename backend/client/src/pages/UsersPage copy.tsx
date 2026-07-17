import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { adminUserApi } from '../api/client';
import { User } from '../types/api';
import Layout from '../components/Layout';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { settings } = useSettings();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'USER',
    isActive: true,
  });
  const [originalData, setOriginalData] = useState(formData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const fetchUsers = useCallback(async () => {
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

      const response = await adminUserApi.list(params);
      setUsers(response.data.data || []);
      if (response.data.meta) {
        setPagination((p) => ({ ...p, ...response.data.meta }));
      }
    } catch {
      setError('Gagal memuat users');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.per_page, search, sortBy, sortDir]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(s => s === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
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
    }
  };

  const openCreateModal = () => {
    const empty = { username: '', email: '', password: '', role: 'USER' as const, isActive: true };
    setFormData(empty);
    setOriginalData(empty);
    setFormError('');
    setSelectedUser(null);
    setShowModal(true);
    setShowConfirmClose(false);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    const data = {
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
    };
    setFormData(data);
    setOriginalData(data);
    setFormError('');
    setShowModal(true);
    setShowConfirmClose(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const data: Record<string, unknown> = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
      };
      if (formData.password) data.password = formData.password;
      if (modalMode === 'edit') data.isActive = formData.isActive;

      if (modalMode === 'create') {
        await adminUserApi.create(data);
      } else if (selectedUser) {
        await adminUserApi.update(selectedUser.id, data);
      }

      setShowModal(false);
      fetchUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        setFormError(Object.values(errors).flat().join(', '));
      } else {
        setFormError(error.response?.data?.message || 'Gagal menyimpan user');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus user ini? Semua URL miliknya juga akan dihapus.')) return;

    try {
      await adminUserApi.delete(id);
      fetchUsers();
    } catch {
      alert('Gagal menghapus user');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await adminUserApi.update(user.id, { isActive: !user.isActive });
      fetchUsers();
    } catch {
      alert('Gagal update user');
    }
  };

  // Get changed fields for preview
  const getChangedFields = () => {
    const changes: string[] = [];
    if (formData.username !== originalData.username) changes.push('Username');
    if (formData.email !== originalData.email) changes.push('Email');
    if (formData.password && formData.password !== originalData.password) changes.push('Password');
    if (formData.role !== originalData.role) changes.push('Role');
    if (formData.isActive !== originalData.isActive) changes.push('Status');
    return changes;
  };

  return (
    <>
      <Layout activePage="users">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Manajemen User</h2>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah User
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari username atau email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-3 font-medium">
                    <button onClick={() => handleSort('username')} className="flex items-center gap-1 hover:text-gray-700">
                      User {sortBy === 'username' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-gray-700">
                      Email {sortBy === 'email' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <button onClick={() => handleSort('role')} className="flex items-center gap-1 hover:text-gray-700">
                      Role {sortBy === 'role' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <button onClick={() => handleSort('isActive')} className="flex items-center gap-1 hover:text-gray-700">
                      Status {sortBy === 'isActive' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 font-medium">
                    <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 hover:text-gray-700">
                      Dibuat {sortBy === 'createdAt' ? (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />) : null}
                    </button>
                  </th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Tidak ada user ditemukan.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            {u.role === 'ADMIN' ? <Shield className="w-4 h-4 text-purple-600" /> : <UserIcon className="w-4 h-4 text-gray-600" />}
                          </div>
                          <span className="font-medium text-gray-900">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : null}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.isActive ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditModal(u)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          {currentUser?.id !== u.id && (
                            <>
                              <button onClick={() => handleToggleActive(u)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title={u.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                                {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-100 rounded text-red-600" title="Hapus">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Halaman {pagination.page} dari {pagination.total_pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.total_pages}
                  className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Layout>

      {/* Main Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">{modalMode === 'create' ? '✨ Tambah User' : '✏️ Edit User'}</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {modalMode === 'create' ? '*' : '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required={modalMode === 'create'}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'USER' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {modalMode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={String(formData.isActive)}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                  Batal
                </button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowConfirmClose(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Perubahan Belum Tersimpan</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Anda telah membuat perubahan. Apakah Anda yakin ingin menutup tanpa menyimpan?
                </p>
              </div>
            </div>

            {getChangedFields().length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Perubahan yang akan dibatalkan:</p>
                <div className="flex flex-wrap gap-1">
                  {getChangedFields().map(field => (
                    <span key={field} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
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
    </>
  );
}
