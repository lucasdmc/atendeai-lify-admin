import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';


type UserRole = 'atendente' | 'gestor' | 'admin' | 'suporte_lify' | 'admin_lify';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
  created_at: string;
}

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
}

const DeleteUserModal = ({ user, isOpen, onClose, onUserDeleted }: DeleteUserModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, userPermissions, userId } = useAuth();

  const canDeleteUser = () => {
    // Apenas Administradores, Suporte Lify e Administrador Lify podem deletar usuários
    if (userRole === 'admin_lify') return true;
    if (userRole === 'suporte_lify') return true;
    if (userRole === 'admin') return true;
    
    return false;
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    // Verificar permissões
    if (!canDeleteUser()) {
      toast({
        title: "Erro de Permissão",
        description: "Apenas Administradores, Suporte Lify e Administrador Lify podem deletar usuários.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se está tentando deletar a si mesmo
    if (user.id === userId) {
      toast({
        title: "Erro",
        description: "Você não pode deletar sua própria conta.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é o último admin_lify
    if (user.role === 'admin_lify') {
      const { data: adminLifyUsers, error: countError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'admin_lify')
        .eq('status', true);

      if (countError) {
        console.error('Erro ao verificar usuários admin_lify:', countError);
      } else if (adminLifyUsers && adminLifyUsers.length <= 1) {
        toast({
          title: "Erro",
          description: "Não é possível deletar o último Administrador Lify do sistema.",
          variant: "destructive",
        });
        return;
      }
    }

    console.log('🗑️ Deletando usuário:', user);
    console.log('👤 Permissões do usuário:', userPermissions);
    console.log('👤 Role do usuário:', userRole);

    setIsLoading(true);
    try {
      // Deletar o usuário da tabela user_profiles
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('❌ Erro ao deletar usuário:', deleteError);
        throw deleteError;
      }

      console.log('✅ Usuário deletado com sucesso');

      toast({
        title: "Usuário deletado",
        description: `O usuário ${user.name} foi deletado com sucesso.`,
      });

      onUserDeleted();
      onClose();
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível deletar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Deletar Usuário
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja deletar o usuário <strong>"{user.name}"</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Esta ação não pode ser desfeita.</p>
                <p className="mt-1">
                  O usuário será excluído permanentemente do sistema.
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• Dados do perfil</li>
                  <li>• Configurações pessoais</li>
                  <li>• Histórico de atividades</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-700">
              <p className="font-medium">Informações do usuário:</p>
              <div className="mt-2 space-y-1">
                <p><strong>Nome:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Função:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.status ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
          </div>

          {!canDeleteUser() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Permissão Insuficiente</p>
                  <p className="mt-1">
                    Apenas Administradores, Suporte Lify e Administrador Lify podem deletar usuários.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteUser}
            disabled={isLoading || !canDeleteUser()}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? 'Deletando...' : 'Deletar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteUserModal; 