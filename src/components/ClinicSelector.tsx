import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';

interface Clinic {
  id: string;
  name: string;
  address?: any | null;
  phone?: any | null;
  email?: any | null;
  created_by: string;
  created_at?: string | null;
  updated_at?: string | null;
  working_hours?: any | null;
  specialties?: any | null;
  payment_methods?: any | null;
  insurance_accepted?: any | null;
  emergency_contact?: any | null;
  admin_notes?: any | null;
  logo_url?: any | null;
  primary_color?: any | null;
  secondary_color?: any | null;
  timezone?: string | null;
  language?: string | null;
}

const ClinicSelector = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { selectedClinicId, setSelectedClinicId } = useClinic();

  // Verificar se o usuário tem acesso global às clínicas
  const hasGlobalClinicAccess = userRole === 'admin_lify' || userRole === 'suporte_lify';

  useEffect(() => {
    if (hasGlobalClinicAccess) {
      fetchClinics();
    } else {
      setIsLoading(false);
    }
  }, [hasGlobalClinicAccess]);

  const fetchClinics = async () => {
    try {
      const { data, error } = await supabase
        .from('clinics')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro ao buscar clínicas:', error);
        throw error;
      }

      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as clínicas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    toast({
      title: "Clínica alterada",
      description: `Alterado para: ${clinics.find(c => c.id === clinicId)?.name}`,
    });
  };

  // Se o usuário não tem acesso global, não mostrar o seletor
  if (!hasGlobalClinicAccess) {
    return null;
  }

  // Se está carregando, mostrar um placeholder
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedClinicId || ''} onValueChange={handleClinicChange}>
        <SelectTrigger className="w-[200px] h-8 text-xs">
          <SelectValue placeholder="Selecionar clínica" />
        </SelectTrigger>
        <SelectContent>
          {clinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              <div className="flex flex-col">
                <span className="font-medium">{clinic.name}</span>
                {clinic.email && (
                  <span className="text-xs text-muted-foreground">
                    {clinic.email}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClinicSelector; 