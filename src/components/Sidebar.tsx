
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
  Calendar
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
    title: 'Agendamentos',
    icon: Calendar,
    href: '/agendamentos',
    permission: 'agendamentos'
  },
  {
    title: 'Contextualizar',
    icon: Brain,
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
  const { userPermissions } = useAuth();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(item => {
    return userPermissions.includes(item.permission);
  });

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50 text-white hover:bg-white/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md shadow-2xl border-r border-white/20 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-gray-100">
            <Sparkles className="h-8 w-8 text-lify-orange" />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-lify-orange to-lify-pink bg-clip-text text-transparent">
                Lify
              </h1>
              <p className="text-xs text-gray-600">AtendeAÍ</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                Nenhum módulo disponível
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
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-lify-orange to-lify-pink text-white shadow-lg shadow-lify-orange/30"
                        : "text-gray-700 hover:bg-gray-50 hover:text-lify-orange"
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
