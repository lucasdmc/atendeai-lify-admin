import { useState, memo, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  MessageSquare, 
  QrCode,
  Users, 
  Sparkles,
  Menu,
  X,
  Calendar,
  Building2,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission } from '@/components/users/UserRoleUtils';
import { useClinic } from '@/contexts/ClinicContext';

// Interface estendida para incluir configuração WhatsApp
interface ClinicWithWhatsApp {
  id: string;
  name: string;
  whatsapp_integration_type?: 'meta_api';
  address?: unknown;
  phone?: unknown;
  email?: unknown;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
  working_hours?: unknown;
  specialties?: unknown;
  payment_methods?: unknown;
  insurance_accepted?: unknown;
  emergency_contact?: unknown;
  admin_notes?: unknown;
  logo_url?: unknown;
  primary_color?: unknown;
  secondary_color?: unknown;
  timezone?: string | null;
  language?: string | null;
}

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
    title: 'Dashboard AI',
    icon: Bot,
    href: '/ai-dashboard',
    permission: 'dashboard'
  }
];

const Sidebar = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
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

      // Se for o item "Conectar WhatsApp", verificar configuração da clínica
      if (item.href === '/conectar-whatsapp') {
        // Se não há clínica selecionada, mostrar (para admin_lify)
        if (!selectedClinic) {
          return true;
        }

        // Se a clínica está configurada para Meta API, não mostrar
        const clinicWithWhatsApp = selectedClinic as ClinicWithWhatsApp;
        const integrationType = clinicWithWhatsApp?.whatsapp_integration_type;
        if (integrationType === 'meta_api') {
          return false;
        }
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
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
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-600">
              <div>Role: {userRole || 'N/A'}</div>
              <div>Módulos: {filteredMenuItems.length}</div>
            </div>
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
