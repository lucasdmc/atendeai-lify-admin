import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Settings, QrCode, Trash2 } from 'lucide-react';
import AgentWhatsAppManager from '@/components/agentes/AgentWhatsAppManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';
import AgentConnectionStatus from '@/components/agentes/AgentConnectionStatus';
import { useAgents } from '@/hooks/useAgents';

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


interface Clinic {
  id: string;
  name: string;
}

const Agentes = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    personality: 'profissional e acolhedor',
    temperature: 0.7,
    clinic_id: '',
    context_json: ''
  });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editAgentData, setEditAgentData] = useState({
    name: '',
    description: '',
    personality: 'profissional e acolhedor',
    temperature: 0.7,
    clinic_id: '',
    context_json: ''
  });
  const { toast } = useToast();
  const { userRole, userPermissions } = useAuth();
  const { selectedClinicId, selectedClinic } = useClinic();

  // Usar o hook otimizado
  const {
    agents,
    isLoading,
    agentsError,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    isCreating,
    isUpdating,
    canCreateAgents,
  } = useAgents();

  // Debug imediato ao montar componente
  console.log('🚀 [Agentes] Componente montado');
  console.log('🔍 [Agentes] Auth state:', { userRole, userPermissions });
  console.log('🔍 [Agentes] Clinic state:', { selectedClinicId, selectedClinic });

  // Debug: log das permissões
  console.log('🔍 [Agentes] Debug permissões:', {
    userRole,
    userPermissions,
    canCreateAgents,
    selectedClinicId,
    selectedClinic: selectedClinic?.name
  });

  useEffect(() => {
    loadClinics();
  }, [selectedClinicId]);

  const loadClinics = async () => {
    try {
      let query = supabase
        .from('clinics')
        .select('id, name');

      // Se não é admin_lify ou suporte_lify, mostrar apenas a clínica do usuário
      if (userRole !== 'admin_lify' && userRole !== 'suporte_lify' && selectedClinicId) {
        query = query.eq('id', selectedClinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
    }
  };

  const loadTemplateJSON = () => {
    const templateJSON = `{
      "clinica": {
        "informacoes_basicas": {
          "nome": "Nome da Clínica",
          "razao_social": "Razão Social da Clínica",
          "cnpj": "00.000.000/0000-00",
          "especialidade_principal": "Especialidade Principal",
          "especialidades_secundarias": ["Especialidade 1", "Especialidade 2"],
          "descricao": "Descrição da clínica",
          "endereco": {
            "rua": "Rua da Clínica",
            "numero": "123",
            "complemento": "Sala 456",
            "bairro": "Centro",
            "cidade": "São Paulo",
            "estado": "SP",
            "cep": "01234-567"
          },
          "contato": {
            "telefone": "(11) 99999-9999",
            "whatsapp": "(11) 99999-9999",
            "email": "contato@clinica.com",
            "site": "www.clinica.com"
          },
          "horario_funcionamento": {
            "segunda": "08:00-18:00",
            "terca": "08:00-18:00",
            "quarta": "08:00-18:00",
            "quinta": "08:00-18:00",
            "sexta": "08:00-18:00",
            "sabado": "08:00-12:00",
            "domingo": "Fechado"
          }
        },
        "servicos": {
          "consultas": [
            "Consulta médica",
            "Consulta de retorno",
            "Consulta de emergência"
          ],
          "exames": [
            "Exame laboratorial",
            "Exame de imagem",
            "Exame cardiológico"
          ],
          "procedimentos": [
            "Procedimento ambulatorial",
            "Procedimento cirúrgico",
            "Procedimento estético"
          ]
        },
        "equipe": {
          "medicos": [
            {
              "nome": "Dr. João Silva",
              "especialidade": "Clínico Geral",
              "crm": "12345-SP"
            },
            {
              "nome": "Dra. Maria Santos",
              "especialidade": "Cardiologia",
              "crm": "67890-SP"
            }
          ],
          "enfermeiros": [
            {
              "nome": "Enf. Pedro Costa",
              "cre": "12345-SP"
            }
          ],
          "recepcionistas": [
            {
              "nome": "Ana Oliveira"
            }
          ]
        },
        "politicas": {
          "agendamento": {
            "antecedencia_minima": "24 horas",
            "cancelamento": "Até 24 horas antes",
            "reagendamento": "Permitido"
          },
          "pagamento": {
            "formas_aceitas": ["Dinheiro", "Cartão de crédito", "Cartão de débito", "PIX"],
            "parcelamento": "Até 12x",
            "desconto": "10% para pagamento à vista"
          },
          "atendimento": {
            "prioridade": "Por ordem de chegada",
            "emergencia": "Atendimento imediato",
            "acompanhante": "Permitido"
          }
        }
      }
    }`;

    setNewAgent(prev => ({
      ...prev,
      context_json: templateJSON
    }));
  };

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do agente é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (newAgent.context_json && !validateJSON(newAgent.context_json)) {
      toast({
        title: "Erro",
        description: "JSON inválido no contexto",
        variant: "destructive",
      });
      return;
    }

    try {
      const agentData = {
        name: newAgent.name.trim(),
        description: newAgent.description.trim() || null,
        personality: newAgent.personality.trim(),
        temperature: newAgent.temperature,
        clinic_id: selectedClinicId || newAgent.clinic_id || null,
        context_json: newAgent.context_json ? JSON.parse(newAgent.context_json) : null,
      };

      await createAgent(agentData);

      setNewAgent({
        name: '',
        description: '',
        personality: 'profissional e acolhedor',
        temperature: 0.7,
        clinic_id: '',
        context_json: ''
      });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Erro ao criar agente:', error);
    }
  };

  const handleToggleAgentStatus = async (agentId: string, currentStatus: boolean | null) => {
    try {
      await toggleAgentStatus({ agentId, currentStatus: currentStatus || false });
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o agente "${agentName}"?`)) {
      return;
    }

    try {
      await deleteAgent(agentId);
    } catch (error) {
      console.error('Erro ao deletar agente:', error);
    }
  };

  const handleDuplicateAgent = async (agent: Agent) => {
    try {
      const duplicatedAgent = {
        name: `${agent.name} (Cópia)`,
        description: agent.description,
        personality: agent.personality,
        temperature: agent.temperature,
        clinic_id: agent.clinic_id,
        context_json: agent.context_json,
      };

      await createAgent(duplicatedAgent);
    } catch (error) {
      console.error('Erro ao duplicar agente:', error);
    }
  };


  // Loading state otimizado
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (agentsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar agentes</h2>
          <p className="text-gray-600">Tente recarregar a página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agentes</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os agentes de IA da sua clínica
            {selectedClinic && (
              <span className="ml-2 text-blue-600">
                - {selectedClinic.name}
              </span>
            )}
          </p>
        </div>

        {canCreateAgents && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Agente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Agente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Agente *
                  </label>
                  <Input
                    value={newAgent.name}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Dr. João Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <Textarea
                    value={newAgent.description}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o papel e especialidade do agente"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personalidade
                  </label>
                  <Input
                    value={newAgent.personality}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, personality: e.target.value }))}
                    placeholder="Ex: Profissional e acolhedor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperatura (Criatividade)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={newAgent.temperature}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    0.0 = Mais determinístico, 2.0 = Mais criativo
                  </p>
                </div>

                {userRole === 'admin_lify' || userRole === 'suporte_lify' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Clínica
                    </label>
                    <Select
                      value={newAgent.clinic_id}
                      onValueChange={(value) => setNewAgent(prev => ({ ...prev, clinic_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma clínica" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinics.map((clinic) => (
                          <SelectItem key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contexto JSON (Opcional)
                  </label>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadTemplateJSON}
                    >
                      Carregar Template
                    </Button>
                    <Textarea
                      value={newAgent.context_json}
                      onChange={(e) => setNewAgent(prev => ({ ...prev, context_json: e.target.value }))}
                      placeholder="Cole aqui o JSON com o contexto da clínica"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateAgent}
                    disabled={isCreating || !newAgent.name.trim()}
                  >
                    {isCreating ? 'Criando...' : 'Criar Agente'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          return (
            <Card key={agent.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={agent.is_active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAgentStatus(agent.id, agent.is_active)}
                    >
                      {agent.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
                {agent.description && (
                  <p className="text-sm text-gray-600 mt-2">{agent.description}</p>
                )}
                {agent.clinics?.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Clínica: {agent.clinics.name}
                  </p>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Status do WhatsApp */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">WhatsApp:</span>
                    <AgentConnectionStatus
                      agentId={agent.id}
                      agentName={agent.name}
                    />
                  </div>

                  {/* Configurações */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Personalidade: {agent.personality}</div>
                    <div>Temperatura: {agent.temperature}</div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <QrCode className="h-3 w-3" />
                          WhatsApp
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Conectar WhatsApp - {agent.name}</DialogTitle>
                        </DialogHeader>
                        <AgentWhatsAppManager
                          agentId={agent.id}
                          agentName={agent.name}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => {
                        setEditingAgent(agent);
                        setEditAgentData({
                          name: agent.name,
                          description: agent.description || '',
                          personality: agent.personality || 'profissional e acolhedor',
                          temperature: agent.temperature || 0.7,
                          clinic_id: agent.clinic_id || '',
                          context_json: typeof agent.context_json === 'string' 
                            ? agent.context_json 
                            : JSON.stringify(agent.context_json, null, 2)
                        });
                        setShowEditDialog(true);
                      }}
                    >
                      <Settings className="h-3 w-3" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleDuplicateAgent(agent)}
                    >
                      <Plus className="h-3 w-3" />
                      Duplicar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAgent(agent.id, agent.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Agente *
              </label>
              <Input
                value={editAgentData.name}
                onChange={(e) => setEditAgentData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Dr. João Silva"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <Textarea
                value={editAgentData.description}
                onChange={(e) => setEditAgentData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o papel e especialidade do agente"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personalidade
              </label>
              <Input
                value={editAgentData.personality}
                onChange={(e) => setEditAgentData(prev => ({ ...prev, personality: e.target.value }))}
                placeholder="Ex: Profissional e acolhedor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura (Criatividade)
              </label>
              <Input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={editAgentData.temperature}
                onChange={(e) => setEditAgentData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                0.0 = Mais determinístico, 2.0 = Mais criativo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contexto JSON (Opcional)
              </label>
              <Textarea
                value={editAgentData.context_json}
                onChange={(e) => setEditAgentData(prev => ({ ...prev, context_json: e.target.value }))}
                placeholder="Cole aqui o JSON com o contexto da clínica"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!editingAgent) return;

                  if (!editAgentData.name.trim()) {
                    toast({
                      title: "Erro",
                      description: "Nome do agente é obrigatório",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (editAgentData.context_json && !validateJSON(editAgentData.context_json)) {
                    toast({
                      title: "Erro",
                      description: "JSON inválido no contexto",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    const updates = {
                      name: editAgentData.name.trim(),
                      description: editAgentData.description.trim() || null,
                      personality: editAgentData.personality.trim(),
                      temperature: editAgentData.temperature,
                      context_json: editAgentData.context_json ? JSON.parse(editAgentData.context_json) : null,
                    };

                    await updateAgent({ id: editingAgent.id, updates });
                    setShowEditDialog(false);
                  } catch (error) {
                    console.error('Erro ao atualizar agente:', error);
                  }
                }}
                disabled={isUpdating || !editAgentData.name.trim()}
              >
                {isUpdating ? 'Atualizando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estado vazio */}
      {agents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agente encontrado</h3>
          <p className="text-gray-600 mb-4">
            {canCreateAgents 
              ? "Crie seu primeiro agente para começar a usar o sistema."
              : "Entre em contato com o administrador para criar agentes."
            }
          </p>
          {canCreateAgents && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Agente
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Agentes;
