import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'suporte_lify' | 'atendente';
  status: boolean;
  created_at: string;
}

interface Permission {
  module_name: string;
  can_access: boolean;
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserModal = ({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) => {
  const [editingUser, setEditingUser] = useState<{
    name: string;
    role: 'admin' | 'suporte_lify' | 'atendente';
    status: boolean;
  }>({
    name: '',
    role: 'atendente',
    status: true
  });
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const permissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'conversas', label: 'Conversas' },
    { id: 'conectar_whatsapp', label: 'Conectar WhatsApp' },
    { id: 'contextualizar', label: 'Contextualizar' },
    { id: 'gestao_usuarios', label: 'Gestão de Usuários' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  useEffect(() => {
    if (user && isOpen) {
      setEditingUser({
        name: user.name,
        role: user.role,
        status: user.status
      });
      fetchUserPermissions();
    }
  }, [user, isOpen]);

  const fetchUserPermissions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module_name, can_access')
        .eq('user_id', user.id);

      if (error) throw error;

      setUserPermissions(data || []);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: editingUser.name,
          role: editingUser.role,
          status: editingUser.status
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });

      onUserUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePermission = async (moduleId: string) => {
    if (!user) return;

    try {
      const currentPermission = userPermissions.find(p => p.module_name === moduleId);
      const newAccess = !currentPermission?.can_access;

      const { error } = await supabase
        .from('user_permissions')
        .update({ can_access: newAccess })
        .eq('user_id', user.id)
        .eq('module_name', moduleId);

      if (error) throw error;

      setUserPermissions(prev => 
        prev.map(p => 
          p.module_name === moduleId 
            ? { ...p, can_access: newAccess }
            : p
        )
      );

      toast({
        title: "Permissão atualizada",
        description: `Permissão para ${moduleId} foi ${newAccess ? 'concedida' : 'removida'}.`,
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a permissão.",
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      suporte_lify: 'Suporte Lify',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input
                value={editingUser.name}
                onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={user.email}
                disabled
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Função</label>
              <Select 
                value={editingUser.role} 
                onValueChange={(value: 'admin' | 'suporte_lify' | 'atendente') => setEditingUser(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="suporte_lify">Suporte Lify</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Status</label>
              <Switch
                checked={editingUser.status}
                onCheckedChange={(checked) => setEditingUser(prev => ({ ...prev, status: checked }))}
              />
              <span className="text-sm text-gray-600">
                {editingUser.status ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Permissões</label>
            <div className="grid grid-cols-2 gap-3">
              {permissions.map((permission) => {
                const userPermission = userPermissions.find(p => p.module_name === permission.id);
                const hasAccess = userPermission?.can_access || false;
                
                return (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">{permission.label}</span>
                    <Switch
                      checked={hasAccess}
                      onCheckedChange={() => handleTogglePermission(permission.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateUser}
              disabled={isLoading}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
