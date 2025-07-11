import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Clinic } from '@/types/clinic';
import { canDeleteClinics } from '@/components/users/UserRoleUtils';

interface DeleteClinicModalProps {
  clinic: Clinic | null;
  isOpen: boolean;
  onClose: () => void;
  onClinicDeleted: () => void;
}

const DeleteClinicModal = ({ clinic, isOpen, onClose, onClinicDeleted }: DeleteClinicModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const handleDeleteClinic = async () => {
    if (!clinic) return;

    // Debug: Verificar permissões do usuário
    console.log('🔍 Debug - Excluindo clínica:');
    console.log('👤 User ID:', user?.id);
    console.log('👑 User Role:', userRole);
    console.log('🏥 Clinic ID:', clinic.id);

    setIsLoading(true);
    try {
      // Verificar se o usuário tem permissão para deletar clínicas
      if (!canDeleteClinics(userRole)) {
        console.error('❌ Usuário não tem permissão para deletar clínicas');
        toast({
          title: "Erro de Permissão",
          description: "Você não tem permissão para deletar clínicas. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      // Verificar se é a clínica Admin Lify (não pode ser excluída)
      if (clinic.id === '00000000-0000-0000-0000-000000000001') {
        console.error('❌ Tentativa de excluir Admin Lify');
        toast({
          title: "Erro",
          description: "A clínica Admin Lify não pode ser excluída.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Permissão verificada, excluindo clínica...');

      const { error } = await supabase
        .from('clinics')
        .delete()
        .eq('id', clinic.id);

      console.log('📡 Resposta do Supabase:', { error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Clínica excluída com sucesso');

      toast({
        title: "Clínica excluída",
        description: "A clínica foi excluída com sucesso.",
      });

      onClinicDeleted();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro completo ao excluir clínica:', error);
      
      let errorMessage = "Não foi possível excluir a clínica.";
      
      if (error.code === '42501') {
        errorMessage = "Você não tem permissão para excluir clínicas. Entre em contato com o administrador.";
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
          <DialogTitle>Excluir Clínica</DialogTitle>
        </DialogHeader>
        
        {/* Debug Info - Remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-3 bg-gray-100 rounded text-xs">
            <div><strong>Debug:</strong></div>
            <div>Role: {userRole}</div>
            <div>Can delete: {canDeleteClinics(userRole) ? '✅' : '❌'}</div>
            <div>Clinic ID: {clinic.id}</div>
            <div>Is Admin Lify: {clinic.id === '00000000-0000-0000-0000-000000000001' ? '✅' : '❌'}</div>
          </div>
        )}
        
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir a clínica <strong>{clinic.name}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta ação não pode ser desfeita. Todos os dados associados à clínica serão perdidos.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteClinic} 
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading ? 'Excluindo...' : 'Excluir Clínica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteClinicModal; 