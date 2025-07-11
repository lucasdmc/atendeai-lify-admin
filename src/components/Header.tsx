import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClinicSelector } from './layout/ClinicSelector';

const Header = () => {
  const { user, signOut, userRole } = useAuth();
  const { selectedClinic, setSelectedClinic, availableClinics } = useClinic();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const getUserInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      suporte_lify: 'Suporte Lify',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const handleClinicChange = (clinicId: string) => {
    const clinic = availableClinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Botão de toggle da sidebar (apenas desktop) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex"
            title={isCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Botão de menu mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">
              Painel Administrativo
            </h2>
            {selectedClinic && (
              <p className="text-sm text-gray-600 mt-1">
                Clínica: {selectedClinic.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Seletor de Clínica */}
          <ClinicSelector 
            selectedClinic={selectedClinic?.id}
            onClinicChange={handleClinicChange}
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-pink-400 text-white">
                    {user?.email ? getUserInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userRole ? getRoleLabel(userRole) : 'Carregando...'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
