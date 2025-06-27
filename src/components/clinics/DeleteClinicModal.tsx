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

interface Clinic {
  id: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface DeleteClinicModalProps {
  clinic: Clinic | null;
  isOpen: boolean;
  onClose: () => void;
  onClinicDeleted: () => void;
}

const DeleteClinicModal = ({ clinic, isOpen, onClose, onClinicDeleted }: DeleteClinicModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, userPermissions } = useAuth();

  const handleDeleteClinic = async () => {
    if (!clinic) return;

    // Verificar permissões - admin_lify tem acesso total, ou verificar permissão específica
    if (userRole !== 'admin_lify' && !userPermissions.includes('deletar_clinicas')) {
      toast({
        title: "Erro de Permissão",
        description: "Você não tem permissão para excluir clínicas.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é a clínica padrão
    if (clinic.id === '00000000-0000-0000-0000-000000000001') {
      toast({
        title: "Erro",
        description: "Não é possível excluir a Clínica Principal do sistema.",
        variant: "destructive",
      });
      return;
    }

    console.log('🗑️ Excluindo clínica:', clinic);
    console.log('👤 Permissões do usuário:', userPermissions);
    console.log('👤 Role do usuário:', userRole);

    setIsLoading(true);
    try {
      // 1. Verificar se há usuários associados à clínica
      const { data: clinicUsers, error: usersError } = await supabase
        .from('clinic_users')
        .select('*')
        .eq('clinic_id', clinic.id);

      if (usersError) {
        console.error('❌ Erro ao verificar usuários da clínica:', usersError);
        throw usersError;
      }

      console.log('👥 Usuários associados à clínica:', clinicUsers?.length || 0);

      // 2. Verificar se há agentes associados à clínica
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .eq('clinic_id', clinic.id);

      if (agentsError) {
        console.error('❌ Erro ao verificar agentes da clínica:', agentsError);
        throw agentsError;
      }

      console.log('🤖 Agentes associados à clínica:', agents?.length || 0);

      // 3. Se há usuários ou agentes associados, mostrar aviso
      if ((clinicUsers && clinicUsers.length > 0) || (agents && agents.length > 0)) {
        toast({
          title: "Aviso",
          description: `Esta clínica possui ${clinicUsers?.length || 0} usuários e ${agents?.length || 0} agentes associados. Eles serão desassociados automaticamente.`,
          variant: "default",
        });
      }

      // 4. Excluir associações de usuários
      if (clinicUsers && clinicUsers.length > 0) {
        const { error: deleteUsersError } = await supabase
          .from('clinic_users')
          .delete()
          .eq('clinic_id', clinic.id);

        if (deleteUsersError) {
          console.error('❌ Erro ao excluir associações de usuários:', deleteUsersError);
          throw deleteUsersError;
        }

        console.log('✅ Associações de usuários excluídas');
      }

      // 5. Excluir agentes associados
      if (agents && agents.length > 0) {
        const { error: deleteAgentsError } = await supabase
          .from('agents')
          .delete()
          .eq('clinic_id', clinic.id);

        if (deleteAgentsError) {
          console.error('❌ Erro ao excluir agentes:', deleteAgentsError);
          throw deleteAgentsError;
        }

        console.log('✅ Agentes excluídos');
      }

      // 6. Excluir a clínica
      const { error: deleteClinicError } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinic.id);

      if (deleteClinicError) {
        console.error('❌ Erro ao excluir clínica:', deleteClinicError);
        throw deleteClinicError;
      }

      console.log('✅ Clínica excluída com sucesso');

      toast({
        title: "Clínica excluída",
        description: `A clínica "${clinic.name}" foi excluída com sucesso.`,
      });

      onClinicDeleted();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro completo ao excluir clínica:', error);
      
      let errorMessage = "Não foi possível excluir a clínica.";
      
      if (error.code === '42501') {
        errorMessage = "Você não tem permissão para excluir clínicas.";
      } else if (error.code === '23503') {
        errorMessage = "Não é possível excluir a clínica pois há dados relacionados.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clinic) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Clínica
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a clínica <strong>"{clinic.name}"</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Esta ação não pode ser desfeita.</p>
                <p className="mt-1">
                  Todos os dados relacionados à clínica serão excluídos permanentemente, incluindo:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• Usuários associados à clínica</li>
                  <li>• Agentes da clínica</li>
                  <li>• Configurações específicas</li>
                </ul>
              </div>
            </div>
          </div>

          {clinic.id === '00000000-0000-0000-0000-000000000001' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">Clínica Principal</p>
                  <p className="mt-1">
                    Esta é a clínica principal do sistema e não pode ser excluída.
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
            onClick={handleDeleteClinic}
            disabled={isLoading || clinic.id === '00000000-0000-0000-0000-000000000001'}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Clínica
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteClinicModal; 