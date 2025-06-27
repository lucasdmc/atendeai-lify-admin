import { useState } from 'react';
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

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClinicCreated: () => void;
}

const CreateClinicModal = ({ isOpen, onClose, onClinicCreated }: CreateClinicModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    website: ''
  });
  const { toast } = useToast();
  const { user, userRole, userPermissions } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateClinic = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da clínica é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    // Debug: Verificar permissões do usuário
    console.log('🔍 Debug - Criando clínica:');
    console.log('👤 User ID:', user?.id);
    console.log('👑 User Role:', userRole);
    console.log('🔐 User Permissions:', userPermissions);
    console.log('📋 Form Data:', formData);

    setIsLoading(true);
    try {
      // Verificar se o usuário tem permissão para criar clínicas
      if (!userPermissions.includes('criar_clinicas') && userRole !== 'admin_lify') {
        console.error('❌ Usuário não tem permissão para criar clínicas');
        toast({
          title: "Erro de Permissão",
          description: "Você não tem permissão para criar clínicas. Entre em contato com o administrador.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Permissão verificada, inserindo clínica...');

      const clinicData = {
        name: formData.name,
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        website: formData.website || null,
        is_active: true
      };

      console.log('📊 Dados da clínica a serem inseridos:', clinicData);

      const { data, error } = await supabase
        .from('clinics')
        .insert([clinicData])
        .select();

      console.log('📡 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro do Supabase:', error);
        throw error;
      }

      console.log('✅ Clínica criada com sucesso:', data);

      toast({
        title: "Clínica criada",
        description: "A clínica foi criada com sucesso.",
      });

      // Reset form
      setFormData({
        name: '',
        cnpj: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        website: ''
      });

      onClinicCreated();
      onClose();
    } catch (error: any) {
      console.error('❌ Erro completo ao criar clínica:', error);
      
      let errorMessage = "Não foi possível criar a clínica.";
      
      if (error.code === '42501') {
        errorMessage = "Você não tem permissão para criar clínicas. Entre em contato com o administrador.";
      } else if (error.code === '23505') {
        errorMessage = "Já existe uma clínica com este CNPJ.";
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Clínica</DialogTitle>
        </DialogHeader>
        
        {/* Debug Info - Remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-3 bg-gray-100 rounded text-xs">
            <div><strong>Debug:</strong></div>
            <div>Role: {userRole}</div>
            <div>Permissions: {userPermissions.join(', ')}</div>
            <div>Can create: {userPermissions.includes('criar_clinicas') ? '✅' : '❌'}</div>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome da Clínica *</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome da clínica"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CNPJ</label>
              <Input
                value={formData.cnpj}
                onChange={(e) => handleInputChange('cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
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
              placeholder="Rua, número, bairro"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Cidade</label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Input
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://clinica.com"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClinic}
              disabled={isLoading || !userPermissions.includes('criar_clinicas')}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              {isLoading ? 'Criando...' : 'Criar Clínica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClinicModal;
