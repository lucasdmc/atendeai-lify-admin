import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Clinic {
  id: string;
  name: string;
  address?: any | null;
  phone?: any | null;
  email?: any | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  working_hours?: any | null;
  specialties?: any | null;
  payment_methods?: any | null;
  insurance_accepted?: any | null;
  emergency_contact?: any | null;
  admin_notes?: any | null;
  logo_url?: any | null;
  primary_color?: any | null;
  secondary_color?: any | null;
  timezone: string | null;
  language: string | null;
}

interface ClinicContextType {
  selectedClinicId: string | null;
  selectedClinic: Clinic | null;
  setSelectedClinicId: (clinicId: string) => void;
  userClinicId: string | null;
  isLoading: boolean;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const [selectedClinicId, setSelectedClinicIdState] = useState<string | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [userClinicId, setUserClinicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userRole } = useAuth();

  // Buscar a clínica associada ao usuário
  useEffect(() => {
    const fetchUserClinic = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Se o usuário não é admin_lify ou suporte_lify, buscar sua clínica específica
        if (userRole !== 'admin_lify' && userRole !== 'suporte_lify') {
          const { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('clinic_id')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Erro ao buscar clínica do usuário:', error);
          } else if (userProfile?.clinic_id) {
            setUserClinicId(userProfile.clinic_id);
            setSelectedClinicIdState(userProfile.clinic_id);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar clínica do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserClinic();
  }, [user, userRole]);

  // Buscar dados da clínica selecionada
  useEffect(() => {
    const fetchClinicData = async () => {
      if (!selectedClinicId) {
        setSelectedClinic(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', selectedClinicId)
          .single();

        if (error) {
          console.error('Erro ao buscar dados da clínica:', error);
          setSelectedClinic(null);
        } else {
          setSelectedClinic(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados da clínica:', error);
        setSelectedClinic(null);
      }
    };

    fetchClinicData();
  }, [selectedClinicId]);

  const setSelectedClinicId = (clinicId: string) => {
    setSelectedClinicIdState(clinicId);
  };

  const value: ClinicContextType = {
    selectedClinicId,
    selectedClinic,
    setSelectedClinicId,
    userClinicId,
    isLoading,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic deve ser usado dentro de um ClinicProvider');
  }
  return context;
}; 