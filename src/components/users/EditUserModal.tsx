
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
    { id: 'agendamentos', label: 'Agendamentos' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  // Define permissões por função
  const rolePermissions = {
    atendente: ['dashboard', 'conversas', 'conectar_whatsapp', 'agendamentos'],
    admin: ['dashboard', 'conversas', 'conectar_whatsapp', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'configuracoes'],
    suporte_lify: ['dashboard', 'conversas', 'conectar_whatsapp', 'contextualizar', 'gestao_usuarios', 'agendamentos', 'configuracoes']
  };

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

  const updateUserPermissions = async (userId: string, role: 'admin' | 'suporte_lify' | 'atendente') => {
    const allowedPermissions = rolePermissions[role];

    // Atualizar todas as permissões baseadas na função
    for (const permission of permissions) {
      const hasAccess = allowedPermissions.includes(permission.id);
      
      const { error } = await supabase
        .from('user_permissions')
        .update({ can_access: hasAccess })
        .eq('user_id', userId)
        .eq('module_name', permission.id);

      if (error) {
        console.error(`Error updating permission ${permission.id}:`, error);
        throw error;
      }
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

      // Atualizar permissões baseadas na função
      await updateUserPermissions(user.id, editingUser.role);

      // Atualizar estado local das permissões
      const allowedPermissions = rolePermissions[editingUser.role];
      setUserPermissions(permissions.map(p => ({
        module_name: p.id,
        can_access: allowedPermissions.includes(p.id)
      })));

      toast({
        title: "Usuário atualizado",
        description: "As informações e permissões do usuário foram atualizadas com sucesso.",
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

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      admin: 'Administrador',
      suporte_lify: 'Suporte Lify',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRolePermissionDescription = (role: 'admin' | 'suporte_lify' | 'atendente') => {
    switch (role) {
      case 'atendente':
        return 'Acesso a: Dashboard, Conversas, Conectar WhatsApp e Agendamentos';
      case 'admin':
      case 'suporte_lify':
        return 'Acesso completo a todos os módulos';
      default:
        return '';
    }
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
              <p className="text-xs text-gray-600 mt-1">
                {getRolePermissionDescription(editingUser.role)}
              </p>
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
            <label className="text-sm font-medium mb-3 block">Permissões (configuradas automaticamente pela função)</label>
            <div className="grid grid-cols-2 gap-3">
              {permissions.map((permission) => {
                const allowedPermissions = rolePermissions[editingUser.role];
                const hasAccess = allowedPermissions.includes(permission.id);
                
                return (
                  <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <span className="text-sm font-medium">{permission.label}</span>
                    <Switch
                      checked={hasAccess}
                      disabled={true}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * As permissões são configuradas automaticamente baseadas na função selecionada
            </p>
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
