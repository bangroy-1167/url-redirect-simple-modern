import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Perform logout and redirect
    const doLogout = async () => {
      await logout();
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/kelola/login');
      }, 1000);
    };
    doLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Link2 className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Logging out...</h1>
        <p className="text-gray-500 mb-6">Please wait while we log you out.</p>
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
    </div>
  );
}
