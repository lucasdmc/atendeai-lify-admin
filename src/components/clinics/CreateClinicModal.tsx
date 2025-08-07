import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressInput } from '@/components/ui/address-input';
import { BrazilianPhoneInput } from '@/components/ui/brazilian-phone-input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CreateClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClinicCreated: () => void;
}

interface FormData {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  whatsappIntegrationType: 'meta_api' | 'none';
  whatsappPhoneNumber: string;
}

export const CreateClinicModal: React.FC<CreateClinicModalProps> = ({
  isOpen,
  onClose,
  onClinicCreated
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
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

  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da clínica é obrigatório.",
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
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
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
              <BrazilianPhoneInput
                value={formData.phone}
                onChange={(value) => handleInputChange('phone', value)}
                placeholder="Digite o telefone"
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
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Estado</label>
              <Input
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Estado"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://clinica.com"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Integração WhatsApp</label>
              <select
                value={formData.whatsappIntegrationType}
                onChange={(e) => handleInputChange('whatsappIntegrationType', e.target.value as 'meta_api' | 'none')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="meta_api">Meta API (Recomendado)</option>
                <option value="none">Sem integração</option>
              </select>
            </div>

            {formData.whatsappIntegrationType === 'meta_api' && (
              <div>
                <label className="text-sm font-medium">Número WhatsApp *</label>
                <BrazilianPhoneInput
                  value={formData.whatsappPhoneNumber}
                  onChange={(value) => handleInputChange('whatsappPhoneNumber', value)}
                  placeholder="(47) 9999-9999"
                  required
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleCreateClinic}
              disabled={isLoading}
            >
              {isLoading ? 'Criando...' : 'Criar Clínica'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
