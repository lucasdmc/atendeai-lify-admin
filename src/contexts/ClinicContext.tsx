import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CalendarMigrationService } from '@/services/calendarMigrationService';

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

  // Função para obter a chave do localStorage específica do usuário
  const getLocalStorageKey = useCallback((userId: string) => {
    return `last_selected_clinic_${userId}`;
  }, []);

  // Função para carregar a última clínica selecionada do localStorage
  const loadLastSelectedClinic = useCallback((userId: string) => {
    if (typeof window === 'undefined') return null;
    const key = getLocalStorageKey(userId);
    return localStorage.getItem(key);
  }, [getLocalStorageKey]);

  // Função para salvar a última clínica selecionada no localStorage
  const saveLastSelectedClinic = useCallback((userId: string, clinicId: string) => {
    if (typeof window === 'undefined') return;
    const key = getLocalStorageKey(userId);
    localStorage.setItem(key, clinicId);
  }, [getLocalStorageKey]);

  // Função para carregar a primeira clínica disponível como fallback
  const loadFirstAvailableClinic = useCallback(async () => {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('id')
        .order('name', { ascending: true })
        .limit(1);

      if (!error && clinics && clinics.length > 0) {
        return clinics[0].id;
      }
    } catch (error) {
      console.error('Erro ao carregar primeira clínica:', error);
    }
    return null;
  }, []);

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
      } else {
        // Para usuários admin_lify e suporte_lify, carregar última clínica selecionada
        const lastSelectedClinicId = loadLastSelectedClinic(user.id);
        
        if (lastSelectedClinicId) {
          // Verificar se a clínica ainda existe
          const { data: clinicExists, error } = await supabase
            .from('clinics')
            .select('id')
            .eq('id', lastSelectedClinicId)
            .single();

          if (!error && clinicExists) {
            setSelectedClinicIdState(lastSelectedClinicId);
          } else {
            // Se a clínica não existe mais, carregar primeira disponível
            const firstClinicId = await loadFirstAvailableClinic();
            if (firstClinicId) {
              setSelectedClinicIdState(firstClinicId);
              saveLastSelectedClinic(user.id, firstClinicId);
            }
          }
        } else {
          // Se não há última clínica salva, carregar primeira disponível
          const firstClinicId = await loadFirstAvailableClinic();
          if (firstClinicId) {
            setSelectedClinicIdState(firstClinicId);
            saveLastSelectedClinic(user.id, firstClinicId);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar clínica do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole, loadLastSelectedClinic, saveLastSelectedClinic, loadFirstAvailableClinic]);

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

  const setSelectedClinicId = useCallback(async (clinicId: string) => {
    setSelectedClinicIdState(clinicId);
    
    // Salvar a seleção no localStorage para usuários admin_lify e suporte_lify
    if (user && (userRole === 'admin_lify' || userRole === 'suporte_lify')) {
      saveLastSelectedClinic(user.id, clinicId);
    }

    // Migrar automaticamente calendários se necessário
    if (user) {
      try {
        console.log('🔄 Verificando necessidade de migração de calendários...');
        const migrationResult = await CalendarMigrationService.autoMigrateCalendars(user.id, clinicId);
        
        if (migrationResult) {
          console.log('✅ Migração automática concluída:', migrationResult);
        }
      } catch (error) {
        console.error('❌ Erro na migração automática:', error);
        // Não bloquear a seleção da clínica por erro na migração
      }
    }
  }, [user, userRole, saveLastSelectedClinic]);

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