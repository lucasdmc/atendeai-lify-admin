
import { useAuth } from '@/hooks/useAuth';
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
import { LogOut, User } from 'lucide-react';

const Header = () => {
  const { user, signOut, userRole } = useAuth();

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

  return (
    <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-gray-200/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">
            Painel Administrativo
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-lify-pink/10 text-lify-pink border border-lify-pink/20">
                    {user?.email ? getUserInitials(user.email) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-md border border-gray-200/50" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-800">{user?.email}</p>
                  <p className="text-xs leading-none text-gray-600">
                    {userRole ? getRoleLabel(userRole) : 'Carregando...'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-50">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="hover:bg-red-50">
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
