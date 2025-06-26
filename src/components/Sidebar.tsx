
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { userPermissions, userRole } = useAuth();
  const location = useLocation();

  console.log('Sidebar Debug - User permissions:', userPermissions);
  console.log('Sidebar Debug - User role:', userRole);
  console.log('Sidebar Debug - All menu items:', menuItems.map(item => item.permission));

  // Se não há permissões carregadas ainda ou se é admin, mostrar todos os itens
  const filteredMenuItems = userPermissions.length === 0 && userRole === 'admin' 
    ? menuItems 
    : menuItems.filter(item => {
        const hasPermission = userPermissions.includes(item.permission);
        console.log(`Permission check for ${item.title} (${item.permission}):`, hasPermission);
        return hasPermission;
      });

  console.log('Sidebar Debug - Filtered menu items:', filteredMenuItems.length);

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
        "fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b">
            <Sparkles className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Lify
              </h1>
              <p className="text-xs text-gray-600">AtendeAÍ</p>
            </div>
          </div>

          {/* Debug info - remover após resolver o problema */}
          <div className="p-2 bg-gray-50 text-xs">
            <div>Role: {userRole || 'Carregando...'}</div>
            <div>Permissions: {userPermissions.length} módulos</div>
            <div>Visible items: {filteredMenuItems.length}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                <div>Carregando permissões...</div>
                <div className="text-xs mt-2">
                  Role: {userRole || 'indefinido'}<br/>
                  Permissions: {JSON.stringify(userPermissions)}
                </div>
              </div>
            ) : (
              filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
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
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })
            )}
          </nav>
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
};

export default Sidebar;
