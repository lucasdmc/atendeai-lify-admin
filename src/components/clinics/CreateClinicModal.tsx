import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { AddressInput } from '@/components/ui/address-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { WhatsAppPhoneNumberField } from '@/components/whatsapp/WhatsAppPhoneNumberField';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClinicCreated: () => void;
}

const CreateClinicModal = ({ isOpen, onClose, onClinicCreated }: CreateClinicModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: '',
    whatsappIntegrationType: 'meta_api' as 'meta_api',
    whatsappPhoneNumber: ''
  });
  const { toast } = useToast();
  const { user, userRole, userPermissions } = useAuth();

  const handleInputChange = (field: string, value: string | 'meta_api') => {
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

    // Validação para Meta API
    if (formData.whatsappIntegrationType === 'meta_api' && !formData.whatsappPhoneNumber.trim()) {
      toast({
        title: "Erro",
        description: "Número de telefone WhatsApp é obrigatório para integração com Meta API.",
        variant: "destructive",
      });
      return;
    }

    if (!userPermissions.includes('clinicas') && userRole !== 'admin_lify') {
      toast({
        title: "Erro de Permissão",
        description: "Você não tem permissão para criar clínicas. Entre em contato com o administrador.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const clinicData = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        created_by: user?.id || '',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        whatsapp_integration_type: formData.whatsappIntegrationType,
        whatsapp_phone_number: formData.whatsappPhoneNumber.trim() || null,
        whatsapp_phone_number_verified: false,
        whatsapp_phone_number_verification_status: 'pending'
      };

      const { error } = await supabase
        .from('clinics')
        .insert([clinicData])
        .select();

      if (error) throw error;

      toast({
        title: "Clínica criada",
        description: "A clínica foi criada com sucesso.",
      });

      // Reset form
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        website: '',
        whatsappIntegrationType: 'meta_api',
        whatsappPhoneNumber: ''
      });

      onClinicCreated();
      onClose();
    } catch (error: unknown) {
      console.error('Erro ao criar clínica:', error);
      
      let errorMessage = "Não foi possível criar a clínica.";
      
      if (error && typeof error === 'object' && 'code' in error && error.code === '42501') {
        errorMessage = "Você não tem permissão para criar clínicas. Entre em contato com o administrador.";
      } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
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
              <PhoneInput
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Endereço</label>
            <AddressInput
              value={formData.address}
              onChange={(value) => handleInputChange('address', value)}
              onAddressComplete={(addressData) => {
                handleInputChange('address', addressData.address);
                handleInputChange('city', addressData.city);
                handleInputChange('state', addressData.state);
              }}
              placeholder="Digite o endereço ou CEP"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="text-sm font-medium">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.clinica.com"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Integração WhatsApp</label>
            <div className="flex items-center space-x-3">
              <Switch
                id="whatsapp-integration"
                checked={formData.whatsappIntegrationType === 'meta_api'}
                onCheckedChange={(checked) => 
                  handleInputChange('whatsappIntegrationType', 'meta_api')
                }
              />
              <div className="flex-1">
                <label htmlFor="whatsapp-integration" className="text-sm font-medium">
                  Usar API oficial da Meta (WhatsApp Business)
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.whatsappIntegrationType === 'meta_api' 
                    ? 'Integração empresarial via API oficial da Meta. Sem necessidade de QR Code.'
                    : 'Conexão via WhatsApp Web com QR Code. Ideal para testes e uso pessoal.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Campo de Número de Telefone WhatsApp */}
          <WhatsAppPhoneNumberField
            value={formData.whatsappPhoneNumber}
            onChange={(value) => handleInputChange('whatsappPhoneNumber', value)}
            integrationType={formData.whatsappIntegrationType}
            isVerified={false}
            verificationStatus="pending"
            onVerify={async (phoneNumber) => {
              // TODO: Implementar verificação na Meta API
              // Por enquanto, simula verificação
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve(true);
                }, 1000);
              });
            }}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreateClinic} disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Clínica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClinicModal;
