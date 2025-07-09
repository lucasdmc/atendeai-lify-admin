import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { AddressInput } from '@/components/ui/address-input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Clinic {
  id: string;
  name: string;
  address?: any | null;
  phone?: any | null;
  email?: any | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  working_hours?: any | null;
  specialties?: any | null;
  payment_methods?: any | null;
  insurance_accepted?: any | null;
  emergency_contact?: any | null;
  admin_notes?: any | null;
  logo_url?: any | null;
  primary_color?: any | null;
  secondary_color?: any | null;
  timezone: string;
  language: string;
}

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
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    website: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (clinic && isOpen) {
      setFormData({
        name: clinic.name,
        address: clinic.address?.street || '',
        city: clinic.address?.city || '',
        state: clinic.address?.state || '',
        phone: clinic.phone?.value || '',
        email: clinic.email?.value || '',
        website: ''
      });
    }
  }, [clinic, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateClinic = async () => {
    if (!clinic) return;

    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da clínica é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null
        })
        .eq('id', clinic.id);

      if (error) throw error;

      toast({
        title: "Clínica atualizada",
        description: "As informações da clínica foram atualizadas com sucesso.",
      });

      onClinicUpdated();
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar clínica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a clínica.",
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateClinic} disabled={isLoading}>
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClinicModal;
