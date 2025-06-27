import { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Clinic {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  is_active: boolean;
  created_at: string;
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
    cnpj: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    website: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    if (clinic && isOpen) {
      setFormData({
        name: clinic.name,
        cnpj: clinic.cnpj || '',
        email: clinic.email || '',
        phone: clinic.phone || '',
        address: clinic.address || '',
        city: clinic.city || '',
        state: clinic.state || '',
        website: clinic.website || '',
        is_active: clinic.is_active
      });
    }
  }, [clinic, isOpen]);

  const handleInputChange = (field: string, value: string | boolean) => {
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
          cnpj: formData.cnpj || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          website: formData.website || null,
          is_active: formData.is_active
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
      console.error('Error updating clinic:', error);
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

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Status</label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
            <span className="text-sm text-gray-600">
              {formData.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateClinic}
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

export default EditClinicModal;
