import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Clinic } from '@/types/clinic';

interface ClinicSelectorProps {
  selectedClinic?: string;
  onClinicChange?: (clinicId: string) => void;
  className?: string;
}

export const ClinicSelector = ({ selectedClinic, onClinicChange, className }: ClinicSelectorProps) => {
  const { user, userRole } = useAuth();
  const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserClinics();
  }, [user, userRole]);

  const loadUserClinics = async () => {
    try {
      setIsLoading(true);
      
      if (userRole === 'admin_lify' || userRole === 'suporte_lify') {
        // Admins veem todas as clínicas
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setAvailableClinics(data || []);
      } else {
        // Usuários veem apenas suas clínicas
        const { data, error } = await supabase
          .from('clinic_users')
          .select('clinics(id, name)')
          .eq('user_id', user?.id);
          
        if (error) throw error;
        
        // Mapear corretamente os dados das clínicas
        const clinics: Clinic[] = [];
        if (data) {
          for (const item of data) {
            if (item.clinics && item.clinics.id && item.clinics.name) {
              clinics.push({
                id: item.clinics.id,
                name: item.clinics.name
              } as Clinic);
            }
          }
        }
        setAvailableClinics(clinics);
      }
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
      setAvailableClinics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClinicChange = (clinicId: string) => {
    if (onClinicChange) {
      onClinicChange(clinicId);
    }
  };

  // Se não há clínicas disponíveis, não mostrar o seletor
  if (availableClinics.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Building2 className="h-4 w-4 text-gray-500" />
      <Select 
        value={selectedClinic || availableClinics[0]?.id || ''} 
        onValueChange={handleClinicChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a clínica"} />
        </SelectTrigger>
        <SelectContent>
          {availableClinics.map(clinic => (
            <SelectItem key={clinic.id} value={clinic.id}>
              {clinic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 