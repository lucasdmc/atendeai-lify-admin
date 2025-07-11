import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Clinic } from '@/types/clinic';

interface ClinicContextType {
  selectedClinic: Clinic | null;
  availableClinics: Clinic[];
  isLoading: boolean;
  setSelectedClinic: (clinic: Clinic | null) => void;
  refreshClinics: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const { user, userRole } = useAuth();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [availableClinics, setAvailableClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserClinics = async () => {
    try {
      setIsLoading(true);
      
      if (userRole === 'admin_lify' || userRole === 'suporte_lify') {
        // Admins veem todas as clínicas
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setAvailableClinics(data || []);
        
        // Selecionar primeira clínica por padrão
        if (data && data.length > 0 && !selectedClinic) {
          setSelectedClinic(data[0]);
        }
      } else if (user) {
        // Usuários veem apenas suas clínicas
        const { data, error } = await supabase
          .from('clinic_users')
          .select('clinics(*)')
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Mapear corretamente os dados das clínicas
        const clinics: Clinic[] = [];
        if (data) {
          for (const item of data) {
            if (item.clinics && item.clinics.id && item.clinics.name) {
              clinics.push(item.clinics as Clinic);
            }
          }
        }
        setAvailableClinics(clinics);
        
        // Selecionar primeira clínica por padrão
        if (clinics.length > 0 && !selectedClinic) {
          setSelectedClinic(clinics[0]);
        }
      } else {
        // Usuário não logado
        setAvailableClinics([]);
      }
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
      setAvailableClinics([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshClinics = async () => {
    await loadUserClinics();
  };

  useEffect(() => {
    if (user) {
      loadUserClinics();
    }
  }, [user, userRole]);

  const value: ClinicContextType = {
    selectedClinic,
    availableClinics,
    isLoading,
    setSelectedClinic,
    refreshClinics,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = (): ClinicContextType => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic deve ser usado dentro de um ClinicProvider');
  }
  return context;
}; 