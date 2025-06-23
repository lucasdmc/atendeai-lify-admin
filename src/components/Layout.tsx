
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-lify-pink"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
