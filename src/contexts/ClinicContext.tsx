import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Clinic {
  id: string;
  name: string;
  address?: unknown | null;
  phone?: unknown | null;
  email?: unknown | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  working_hours?: unknown | null;
  specialties?: unknown | null;
  payment_methods?: unknown | null;
  insurance_accepted?: unknown | null;
  emergency_contact?: unknown | null;
  admin_notes?: unknown | null;
  logo_url?: unknown | null;
  primary_color?: unknown | null;
  secondary_color?: unknown | null;
  timezone: string | null;
  language: string | null;
  whatsapp_integration_type?: 'meta_api';
  whatsapp_meta_config?: unknown;
  whatsapp_connection_status?: 'disconnected' | 'connecting' | 'connected' | 'error';
  whatsapp_last_connection?: string | null;
  whatsapp_phone_number?: string | null;
  whatsapp_phone_number_verified?: boolean;
  whatsapp_phone_number_verification_date?: string | null;
  whatsapp_phone_number_verification_status?: 'pending' | 'verified' | 'failed' | 'unverified';
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

  // Buscar a clínica associada ao usuário com cache
  const fetchUserClinic = useCallback(async () => {
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

        if (!error && userProfile?.clinic_id) {
          setUserClinicId(userProfile.clinic_id);
          setSelectedClinicIdState(userProfile.clinic_id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar clínica do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    fetchUserClinic();
  }, [fetchUserClinic]);

  // Buscar dados da clínica selecionada com cache
  const fetchClinicData = useCallback(async () => {
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

      if (!error && data) {
        setSelectedClinic(data);
      } else {
        setSelectedClinic(null);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da clínica:', error);
      setSelectedClinic(null);
    }
  }, [selectedClinicId]);

  useEffect(() => {
    fetchClinicData();
  }, [fetchClinicData]);

  const setSelectedClinicId = useCallback((clinicId: string) => {
    setSelectedClinicIdState(clinicId);
  }, []);

  const value = useMemo(() => ({
    selectedClinicId,
    selectedClinic,
    setSelectedClinicId,
    userClinicId,
    isLoading,
  }), [selectedClinicId, selectedClinic, setSelectedClinicId, userClinicId, isLoading]);

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