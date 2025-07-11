import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  LayoutDashboard, 
  MessageSquare, 
  QrCode, 
  Brain, 
  Users, 
  Settings,
  Sparkles,
  Menu,
  X,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/components/users/UserRoleUtils';
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
    permission: 'conversas'
  },
  {
    title: 'Conectar WhatsApp',
    icon: QrCode,
    href: '/conectar-whatsapp',
    permission: 'conectar_whatsapp'
  },
  {
    title: 'Agentes de IA',
    icon: Brain,
    href: '/agentes',
    permission: 'agentes'
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
    title: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
    permission: 'configuracoes'
  }
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { userPermissions, userRole, loading } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Filtrar itens do menu baseado nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item => {
    return hasPermission(userRole, item.permission);
  });

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 bg-white shadow-lg flex items-center justify-center transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          {!isCollapsed && <p className="text-sm text-gray-600">Carregando...</p>}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
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

        {/* Desktop toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed top-4 left-4 z-50 bg-white shadow-md border"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0",
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn(
              "flex items-center gap-2 p-6 border-b transition-all duration-300",
              isCollapsed ? "justify-center p-4" : "p-6"
            )}>
              <Sparkles className="h-8 w-8 text-orange-500 flex-shrink-0" />
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
              "flex-1 space-y-2 transition-all duration-300",
              isCollapsed ? "p-2" : "p-4"
            )}>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                const menuItem = (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 border border-orange-200"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                );

                // Se colapsado, mostrar tooltip
                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        {menuItem}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return menuItem;
              })}
            </nav>

            {/* User info */}
            <div className={cn(
              "border-t bg-gray-50 transition-all duration-300",
              isCollapsed ? "p-2" : "p-4"
            )}>
              {!isCollapsed ? (
                <div className="text-xs text-gray-600">
                  <div>Role: {userRole || 'N/A'}</div>
                  <div>Módulos: {filteredMenuItems.length}</div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">
                      {userRole?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
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
    </TooltipProvider>
  );
};

export default Sidebar;
