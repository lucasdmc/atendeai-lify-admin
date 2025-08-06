import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <MainContent>
          <Header />
          <main className="p-6">
            {children}
          </main>
        </MainContent>
      </div>
    </SidebarProvider>
  );
};

// Componente separado para o conteúdo principal que usa o contexto
const MainContent = ({ children }: { children: ReactNode }) => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className={isCollapsed ? "lg:ml-16" : "lg:ml-64"}>
      {children}
    </div>
  );
};

export default Layout;
