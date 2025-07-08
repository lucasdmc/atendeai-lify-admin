import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

// Tipo local para os roles disponíveis no sistema
type UserRole = 'admin_lify' | 'suporte_lify' | 'admin' | 'gestor' | 'atendente';

interface Clinic {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: boolean;
  created_at: string;
  clinic_id?: string;
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

const EditUserModal = ({ user, isOpen, onClose, onUserUpdated }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    role: 'atendente' as UserRole,
    status: true,
    clinicId: ''
  });
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar clínicas quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadClinics();
    }
  }, [isOpen]);

  const loadClinics = async () => {
    setIsLoadingClinics(true);
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as clínicas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingClinics(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        role: user.role,
        status: user.status,
        clinicId: user.clinic_id || ''
      });
    }
  }, [user]);

  // Verificar se o usuário precisa de associação a clínica
  const requiresClinicAssociation = (role: UserRole) => {
    return role !== 'admin_lify' && role !== 'suporte_lify';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Verificar se precisa de clínica e se foi selecionada
    if (requiresClinicAssociation(formData.role) && !formData.clinicId) {
      toast({
        title: "Erro",
        description: "Selecione uma clínica para este usuário.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar perfil do usuário
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          role: formData.role,
          status: formData.status,
          clinic_id: requiresClinicAssociation(formData.role) ? formData.clinicId : null
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Se o usuário precisa de clínica, atualizar/inserir na tabela clinic_users
      if (requiresClinicAssociation(formData.role) && formData.clinicId) {
        // Remover associações antigas
        await supabase
          .from('clinic_users')
          .delete()
          .eq('user_id', user.id);

        // Inserir nova associação
        const { error: clinicUserError } = await supabase
          .from('clinic_users')
          .insert({
            user_id: user.id,
            clinic_id: formData.clinicId,
            role: formData.role,
            is_active: formData.status
          });

        if (clinicUserError) throw clinicUserError;
      } else if (!requiresClinicAssociation(formData.role)) {
        // Se não precisa de clínica, remover associações existentes
        await supabase
          .from('clinic_users')
          .delete()
          .eq('user_id', user.id);
      }

      toast({
        title: "Usuário atualizado",
        description: "As informações do usuário foram atualizadas com sucesso.",
      });

      onUserUpdated();
      onClose();
    } catch (error) {
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
      admin_lify: 'Administrador Lify',
      suporte_lify: 'Suporte Lify',
      admin: 'Administrador',
      gestor: 'Gestor',
      atendente: 'Atendente'
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRolePermissionDescription = (role: UserRole) => {
    const descriptions = {
      atendente: 'Acesso a: Dashboard, Conversas e Agendamentos',
      gestor: 'Acesso a: Dashboard, Conversas, WhatsApp, Agentes, Agendamentos, Contextualizar e Configurações',
      admin: 'Acesso completo a uma clínica específica',
      suporte_lify: 'Acesso total exceto criação de clínicas',
      admin_lify: 'Acesso total incluindo criação de clínicas'
    };
    return descriptions[role] || '';
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500">O email não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={(value: UserRole) => {
              setFormData(prev => ({ 
                ...prev, 
                role: value,
                // Limpar clínica se não precisar mais
                clinicId: requiresClinicAssociation(value) ? prev.clinicId : ''
              }));
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atendente">Atendente</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="suporte_lify">Suporte Lify</SelectItem>
                <SelectItem value="admin_lify">Administrador Lify</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-600">
              {getRolePermissionDescription(formData.role)}
            </p>
          </div>

          {/* Seleção de clínica - apenas para usuários que precisam */}
          {requiresClinicAssociation(formData.role) && (
            <div className="space-y-2">
              <Label htmlFor="clinic">Clínica</Label>
              <Select 
                value={formData.clinicId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, clinicId: value }))}
                disabled={isLoadingClinics}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingClinics ? "Carregando..." : "Selecione uma clínica"} />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Usuários com esta função devem estar associados a uma clínica específica.
              </p>
            </div>
          )}

          {/* Informação para usuários mestres */}
          {!requiresClinicAssociation(formData.role) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Usuário Mestre:</strong> Este usuário terá acesso global a todas as clínicas do sistema.
              </p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
            />
            <Label htmlFor="status">Usuário ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
