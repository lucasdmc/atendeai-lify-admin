import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/hooks/useAuth';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  temperature: number | null;
  clinic_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  context_json?: string | Record<string, unknown> | null;
  whatsapp_number?: string | null;
  is_whatsapp_connected?: boolean | null;
  clinics?: {
    name: string;
  } | null;
}

interface AgentWhatsAppConnection {
  id: string;
  agent_id: string;
  whatsapp_number: string;
  whatsapp_name: string;
  connection_status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qr_code: string | null;
  client_info: Record<string, unknown>;
  last_connection_at: string | null;
  created_at: string;
  updated_at: string;
}

// Função para carregar agentes com cache
const loadAgents = async (selectedClinicId: string | null) => {
  let query = supabase
    .from('agents')
    .select(`
      *,
      clinics(name)
    `)
    .order('created_at', { ascending: false });

  if (selectedClinicId) {
    query = query.eq('clinic_id', selectedClinicId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

// Função para carregar conexões WhatsApp de um agente
const loadAgentConnections = async (agentId: string) => {
  const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/connections', {
    body: { agentId }
  });

  if (error) throw error;
  return data.connections || [];
};

// Função para carregar todas as conexões em paralelo
const loadAllAgentConnections = async (agents: Agent[]) => {
  const connectionPromises = agents.map(agent => 
    loadAgentConnections(agent.id)
  );
  
  const results = await Promise.all(connectionPromises);
  
  // Criar um objeto com as conexões por agente
  const connectionsMap: Record<string, AgentWhatsAppConnection[]> = {};
  agents.forEach((agent, index) => {
    connectionsMap[agent.id] = results[index];
  });
  
  return connectionsMap;
};

export const useAgents = () => {
  const { selectedClinicId } = useClinic();
  const { userRole, userPermissions } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para agentes com cache otimizado
  const {
    data: agents = [],
    isLoading: agentsLoading,
    error: agentsError,
    refetch: refetchAgents
  } = useQuery({
    queryKey: ['agents', selectedClinicId],
    queryFn: () => loadAgents(selectedClinicId),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Query para conexões WhatsApp com cache separado
  const {
    data: agentConnections = {},
    isLoading: connectionsLoading,
    error: connectionsError,
    refetch: refetchConnections
  } = useQuery({
    queryKey: ['agent-connections', agents.map(a => a.id)],
    queryFn: () => loadAllAgentConnections(agents),
    enabled: agents.length > 0, // Só executa se há agentes
    staleTime: 30 * 1000, // 30 segundos (mais frequente)
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Mutation para criar agente
  const createAgentMutation = useMutation({
    mutationFn: async (newAgent: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase
        .from('agents')
        .insert(newAgent)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Sucesso",
        description: "Agente criado com sucesso!",
      });
    },
    onError: (_error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o agente",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar agente
  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Sucesso",
        description: "Agente atualizado com sucesso!",
      });
    },
    onError: (_error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agente",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar agente
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent-connections'] });
      toast({
        title: "Sucesso",
        description: "Agente deletado com sucesso!",
      });
    },
    onError: (_error) => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o agente",
        variant: "destructive",
      });
    },
  });

  // Mutation para toggle de status
  const toggleAgentStatusMutation = useMutation({
    mutationFn: async ({ agentId, currentStatus }: { agentId: string; currentStatus: boolean }) => {
      const { data, error } = await supabase
        .from('agents')
        .update({ is_active: !currentStatus })
        .eq('id', agentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
    onError: (_error) => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do agente",
        variant: "destructive",
      });
    },
  });

  // Verificar permissões memoizada
  const canCreateAgents = userRole === 'admin_lify' || 
                         userRole === 'suporte_lify' || 
                         userRole === 'admin' || 
                         userRole === 'gestor' || 
                         userRole === 'atendente' ||
                         userPermissions?.includes('agentes') ||
                         true;

  return {
    // Dados
    agents,
    agentConnections,
    
    // Estados de loading
    isLoading: agentsLoading || connectionsLoading,
    agentsLoading,
    connectionsLoading,
    
    // Estados de erro
    agentsError,
    connectionsError,
    
    // Funções de refetch
    refetchAgents,
    refetchConnections,
    
    // Mutations
    createAgent: createAgentMutation.mutate,
    updateAgent: updateAgentMutation.mutate,
    deleteAgent: deleteAgentMutation.mutate,
    toggleAgentStatus: toggleAgentStatusMutation.mutate,
    
    // Estados das mutations
    isCreating: createAgentMutation.isPending,
    isUpdating: updateAgentMutation.isPending,
    isDeleting: deleteAgentMutation.isPending,
    isTogglingStatus: toggleAgentStatusMutation.isPending,
    
    // Permissões
    canCreateAgents,
    
    // Utilitários
    getAgentConnections: (agentId: string) => agentConnections[agentId] || [],
    getActiveConnection: (agentId: string) => {
      const connections = agentConnections[agentId] || [];
      return connections.find(conn => conn.connection_status === 'connected') || null;
    },
  };
}; 