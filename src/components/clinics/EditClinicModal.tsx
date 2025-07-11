import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { canEditClinics } from '@/components/users/UserRoleUtils';

interface EditClinicModalProps {
  clinic: Clinic | null;
  isOpen: boolean;
  onClose: () => void;
  onClinicUpdated: () => void;
}

const EditClinicModal = ({ clinic, isOpen, onClose, onClinicUpdated }: EditClinicModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    timezone: '',
    language: 'pt-BR'
  });
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || '',
        email: typeof clinic.email === 'string' ? clinic.email : '',
        phone: typeof clinic.phone === 'string' ? clinic.phone : '',
        address: typeof clinic.address === 'string' ? clinic.address : '',
        timezone: clinic.timezone || '',
        language: clinic.language || 'pt-BR'
      });
    }
  }, [clinic]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateClinic = async () => {
    if (!clinic || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da clínica é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Debug: Verificar permissões do usuário
    console.log('🔍 Debug - Editando clínica:');
    console.log('👤 User ID:', user?.id);
    console.log('👑 User Role:', userRole);
    console.log('📋 Form Data:', formData);

    setIsLoading(true);
    try {
      // Verificar se o usuário tem permissão para editar clínicas
      if (!canEditClinics(userRole)) {
        console.error('❌ Usuário não tem permissão para editar clínicas');
        toast({
          title: "Erro de Permissão",
          description: "Você não tem permissão para editar clínicas. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Permissão verificada, atualizando clínica...');

      const updateData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        timezone: formData.timezone || null,
        language: formData.language || 'pt-BR'
      };

      console.log('📊 Dados da clínica a serem atualizados:', updateData);

      const { data, error } = await supabase
        .from('clinics')
        .update(updateData)
        .eq('id', clinic.id)
        .select();

      console.log('📡 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Clínica atualizada com sucesso:', data);

      toast({
        title: "Clínica atualizada",
        description: "A clínica foi atualizada com sucesso.",
      });

      onClinicUpdated();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro completo ao atualizar clínica:', error);
      
      let errorMessage = "Não foi possível atualizar a clínica.";
      
      if (error.code === '42501') {
        errorMessage = "Você não tem permissão para editar clínicas. Entre em contato com o administrador.";
      } else if (error.code === '23505') {
        errorMessage = "Já existe uma clínica com este nome.";
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Clínica</DialogTitle>
        </DialogHeader>
        
        {/* Debug Info - Remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-3 bg-gray-100 rounded text-xs">
            <div><strong>Debug:</strong></div>
            <div>Role: {userRole}</div>
            <div>Can edit: {canEditClinics(userRole) ? '✅' : '❌'}</div>
            <div>Clinic ID: {clinic.id}</div>
          </div>
        )}
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Nome da Clínica *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome da clínica"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@clinica.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Endereço</label>
            <Input
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Endereço completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Fuso Horário</label>
              <Input
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                placeholder="America/Sao_Paulo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Idioma</label>
              <Input
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                placeholder="pt-BR"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateClinic} 
              disabled={isLoading || !formData.name.trim()}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Clínica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClinicModal;
