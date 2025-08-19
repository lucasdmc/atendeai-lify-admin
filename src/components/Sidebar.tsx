import { useState, memo, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Sparkles,
  Menu,
  X,
  Calendar,
  Building2,
  Bot,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/components/users/UserRoleUtils';
import { useClinic } from '@/contexts/ClinicContext';
import { useSidebar } from '@/contexts/SidebarContext';

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    permission: 'dashboard'
  },
  {
    title: 'Conversas',
    icon: MessageSquare,
    href: '/conversas',
    permission: 'conversas',
    showBadge: true // Indicar que este item pode ter badge
  },

  {
    title: 'Agendamentos',
    icon: Calendar,
    href: '/agendamentos',
    permission: 'agendamentos'
  },
  {
    title: 'Clínicas',
    icon: Building2,
    href: '/clinicas',
    permission: 'clinicas'
  },
  {
    title: 'Contextualizar',
    icon: Sparkles,
    href: '/contextualizar',
    permission: 'contextualizar'
  },
  {
    title: 'Gestão de Usuários',
    icon: Users,
    href: '/gestao-usuarios',
    permission: 'gestao_usuarios'
  },
  {
    title: 'Simulador de Atendimento',
    icon: Bot,
    href: '/simulacao',
    permission: 'dashboard'
  }
];

const Sidebar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { userRole, loading } = useAuth();
  const { selectedClinic } = useClinic();
  const location = useLocation();

  // Filtrar itens do menu baseado nas permissões do usuário e configuração da clínica
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      // Verificar permissão básica
      if (!hasPermission(userRole, item.permission)) {
        return false;
      }

      return true;
    });
  }, [userRole, selectedClinic]);

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0",
        isCollapsed ? "w-16" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={cn(
            "flex items-center gap-2 p-6 border-b",
            isCollapsed ? "justify-center p-4" : ""
          )}>
            <Sparkles className="h-8 w-8 text-orange-500" />
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  Lify
                </h1>
                <p className="text-xs text-gray-600">AtendeAÍ</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 space-y-2",
            isCollapsed ? "p-2" : "p-4"
          )}>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              // const showBadge = item.showBadge && unreadCount > 0;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                    isCollapsed ? "justify-center px-2" : "",
                    isActive
                      ? "bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 border border-orange-200"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {/* Temporariamente desabilitado
                    {showBadge && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    */}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span>{item.title}</span>
                      {/* Temporariamente desabilitado
                      {showBadge && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                      */}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse/Expand Button */}
          <div className={cn(
            "p-4 border-t bg-gray-50",
            isCollapsed ? "p-2" : ""
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? "Expandir menu" : "Recuar menu"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            
            {/* User info - only show when not collapsed */}
            {!isCollapsed && (
              <div className="text-xs text-gray-600 mt-2">
                <div>Role: {userRole || 'N/A'}</div>
                <div>Módulos: {filteredMenuItems.length}</div>
                {/* Temporariamente desabilitado
                {unreadCount > 0 && (
                  <div className="text-orange-600 font-medium">
                    {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                  </div>
                )}
                */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
