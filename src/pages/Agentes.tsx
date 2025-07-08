import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Bot, Settings, Phone, Building2, MessageSquare, QrCode } from 'lucide-react';
import AgentWhatsAppManager from '@/components/agentes/AgentWhatsAppManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClinic } from '@/contexts/ClinicContext';

interface Agent {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  temperature: number | null;
  clinic_id: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  context_json?: any | null;
  whatsapp_number?: any | null;
  is_whatsapp_connected?: boolean | null;
  clinics?: {
    name: string;
  };
}

interface Clinic {
  id: string;
  name: string;
}

const Agentes = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrAgent, setQrAgent] = useState<Agent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const { userRole, userPermissions } = useAuth();
  const { selectedClinicId, selectedClinic } = useClinic();

  // Verificar se o usuário pode criar agentes
  const canCreateAgents = userRole === 'admin_lify' || userRole === 'suporte_lify' || userPermissions?.includes('agentes');

  useEffect(() => {
    loadAgents();
    loadClinics();
  }, [selectedClinicId]);

  const loadAgents = async () => {
    try {
      let query = supabase
        .from('agents')
        .select(`
          *,
          clinics(name)
        `)
        .order('created_at', { ascending: false });

      // Sempre filtrar pela clínica selecionada, se houver
      if (selectedClinicId) {
        query = query.eq('clinic_id', selectedClinicId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agentes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          "missao": "Missão da clínica",
          "valores": ["Valor 1", "Valor 2"],
          "diferenciais": ["Diferencial 1", "Diferencial 2"]
        },
        "localizacao": {
          "endereco_principal": {
            "logradouro": "Rua Exemplo",
            "numero": "123",
            "complemento": "Sala 1",
            "bairro": "Centro",
            "cidade": "Cidade",
            "estado": "UF",
            "cep": "00000-000",
            "pais": "Brasil",
            "coordenadas": {
              "latitude": 0,
              "longitude": 0
            }
          }
        },
        "contatos": {
          "telefone_principal": "(00) 0000-0000",
          "whatsapp": "(00) 00000-0000",
          "email_principal": "contato@clinica.com",
          "emails_departamentos": {
            "agendamento": "agendamento@clinica.com",
            "resultados": "resultados@clinica.com"
          },
          "website": "https://www.clinica.com"
        },
        "horario_funcionamento": {
          "segunda": {"abertura": "08:00", "fechamento": "18:00"},
          "terca": {"abertura": "08:00", "fechamento": "18:00"},
          "quarta": {"abertura": "08:00", "fechamento": "18:00"},
          "quinta": {"abertura": "08:00", "fechamento": "18:00"},
          "sexta": {"abertura": "08:00", "fechamento": "18:00"},
          "sabado": {"abertura": "08:00", "fechamento": "12:00"},
          "domingo": {"abertura": null, "fechamento": null}
        }
      },
      "agente_ia": {
        "configuracao": {
          "nome": "Nome do Agente",
          "personalidade": "Personalidade do agente",
          "tom_comunicacao": "Tom de comunicação",
          "nivel_formalidade": "Médio",
          "idiomas": ["português"],
          "saudacao_inicial": "Olá! Como posso ajudá-lo?",
          "mensagem_despedida": "Obrigado! Até breve!",
          "mensagem_fora_horario": "Estamos fora do horário de atendimento."
        },
        "comportamento": {
          "proativo": true,
          "oferece_sugestoes": true,
          "solicita_feedback": true,
          "escalacao_automatica": true,
          "limite_tentativas": 3,
          "contexto_conversa": true
        }
      },
      "profissionais": [],
      "servicos": {
        "consultas": [],
        "exames": []
      },
      "convenios": [],
      "formas_pagamento": {
        "dinheiro": true,
        "cartao_credito": true,
        "cartao_debito": true,
        "pix": true,
        "parcelamento": {
          "disponivel": true,
          "max_parcelas": 12,
          "valor_minimo_parcela": 50
        },
        "desconto_a_vista": {
          "disponivel": true,
          "percentual": 5
        }
      },
      "politicas": {
        "agendamento": {
          "antecedencia_minima_horas": 24,
          "antecedencia_maxima_dias": 30,
          "reagendamento_permitido": true,
          "cancelamento_antecedencia_horas": 24,
          "confirmacao_necessaria": true
        },
        "atendimento": {
          "tolerancia_atraso_minutos": 15,
          "acompanhante_permitido": true,
          "documentos_obrigatorios": ["RG", "CPF"]
        }
      },
      "informacoes_adicionais": {
        "parcerias": []
      },
      "metadados": {
        "versao_schema": "1.0",
        "data_criacao": "${new Date().toISOString()}",
        "status": "ativo"
      }
    }`;
    return templateJSON;
  };

  const validateJSON = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (error) {
      return false;
    }
  };

  const createAgent = async () => {
    try {
      // Determinar a clínica a ser usada
      const clinicIdToUse = userRole === 'admin_lify' || userRole === 'suporte_lify' 
        ? newAgent.clinic_id 
        : selectedClinicId;

      if (!newAgent.name || !clinicIdToUse) {
        toast({
          title: "Erro",
          description: "Nome e clínica são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      if (newAgent.context_json && !validateJSON(newAgent.context_json)) {
        toast({
          title: "Erro",
          description: "JSON de contextualização inválido",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('agents')
        .insert([{
          name: newAgent.name,
          description: newAgent.description || null,
          personality: newAgent.personality,
          temperature: newAgent.temperature,
          clinic_id: clinicIdToUse,
          context_json: newAgent.context_json || null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agente criado com sucesso",
      });

      setShowCreateDialog(false);
      setNewAgent({
        name: '',
        description: '',
        personality: 'profissional e acolhedor',
        temperature: 0.7,
        clinic_id: '',
        context_json: ''
      });
      loadAgents();
    } catch (error) {
      console.error('Erro ao criar agente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o agente",
        variant: "destructive",
      });
    }
  };

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean | null) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: !currentStatus })
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do agente atualizado",
      });

      loadAgents();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agentes de IA</h1>
          <p className="text-gray-600 mt-2">Gerencie os agentes de atendimento da sua clínica</p>
        </div>
        
        {canCreateAgents && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Novo Agente
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Agente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Agente</label>
                <Input
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="Ex: Assistente Principal"
                />
              </div>
              
              {userRole === 'admin_lify' || userRole === 'suporte_lify' ? (
                <div>
                  <label className="text-sm font-medium">Clínica</label>
                  <Select 
                    value={newAgent.clinic_id} 
                    onValueChange={(value) => setNewAgent({ ...newAgent, clinic_id: value })}
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
              ) : (
                <div>
                  <label className="text-sm font-medium">Clínica</label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <span className="text-sm font-medium">{selectedClinic?.name}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newAgent.description}
                  onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                  placeholder="Descreva o papel deste agente..."
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Personalidade</label>
                <Select 
                  value={newAgent.personality} 
                  onValueChange={(value) => setNewAgent({ ...newAgent, personality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional e acolhedor">Profissional e Acolhedor</SelectItem>
                    <SelectItem value="empático e carinhoso">Empático e Carinhoso</SelectItem>
                    <SelectItem value="objetivo e direto">Objetivo e Direto</SelectItem>
                    <SelectItem value="amigável e descontraído">Amigável e Descontraído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Criatividade (Temperature: {newAgent.temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={newAgent.temperature}
                  onChange={(e) => setNewAgent({ ...newAgent, temperature: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Conservador</span>
                  <span>Criativo</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">JSON de Contextualização</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewAgent({ ...newAgent, context_json: loadTemplateJSON() })}
                  >
                    Carregar Template
                  </Button>
                </div>
                <Textarea
                  value={newAgent.context_json}
                  onChange={(e) => setNewAgent({ ...newAgent, context_json: e.target.value })}
                  placeholder="Cole aqui o JSON de contextualização..."
                  rows={8}
                  className="font-mono text-xs"
                />
                {newAgent.context_json && !validateJSON(newAgent.context_json) && (
                  <p className="text-xs text-red-500 mt-1">JSON inválido</p>
                )}
              </div>

              <Button onClick={createAgent} className="w-full">
                Criar Agente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Bot className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600">{agent.clinics?.name}</span>
                    </div>
                  </div>
                </div>
                <Badge variant={agent.is_active ? "default" : "secondary"}>
                  {agent.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {agent.description && (
                <p className="text-sm text-gray-600">{agent.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Personalidade:</span>
                  <span className="font-medium">{agent.personality}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Criatividade:</span>
                  <span className="font-medium">{agent.temperature}</span>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAgentStatus(agent.id, agent.is_active)}
                  className="flex-1"
                >
                  {agent.is_active ? "Desativar" : "Ativar"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingAgent(agent);
                  setEditAgentData({
                    name: agent.name,
                    description: agent.description || '',
                    personality: agent.personality || 'profissional e acolhedor',
                    temperature: agent.temperature || 0.7,
                    clinic_id: agent.clinic_id,
                    context_json: agent.context_json || ''
                  });
                  setShowEditDialog(true);
                }}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setQrAgent(agent);
                  setShowQRDialog(true);
                }}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {agents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agente encontrado</h3>
            <p className="text-gray-600 mb-4">Crie seu primeiro agente de IA para começar</p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Agente</label>
              <Input
                value={editAgentData.name}
                onChange={(e) => setEditAgentData({ ...editAgentData, name: e.target.value })}
                placeholder="Ex: Assistente Principal"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Clínica</label>
              <Select
                value={editAgentData.clinic_id}
                onValueChange={(value) => setEditAgentData({ ...editAgentData, clinic_id: value })}
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
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={editAgentData.description}
                onChange={(e) => setEditAgentData({ ...editAgentData, description: e.target.value })}
                placeholder="Descreva o papel deste agente..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Personalidade</label>
              <Select
                value={editAgentData.personality}
                onValueChange={(value) => setEditAgentData({ ...editAgentData, personality: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profissional e acolhedor">Profissional e Acolhedor</SelectItem>
                  <SelectItem value="empático e carinhoso">Empático e Carinhoso</SelectItem>
                  <SelectItem value="objetivo e direto">Objetivo e Direto</SelectItem>
                  <SelectItem value="amigável e descontraído">Amigável e Descontraído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Criatividade (Temperature: {editAgentData.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editAgentData.temperature}
                onChange={(e) => setEditAgentData({ ...editAgentData, temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Conservador</span>
                <span>Criativo</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">JSON de Contextualização</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditAgentData({ ...editAgentData, context_json: loadTemplateJSON() })}
                >
                  Carregar Template
                </Button>
              </div>
              <Textarea
                value={editAgentData.context_json}
                onChange={(e) => setEditAgentData({ ...editAgentData, context_json: e.target.value })}
                placeholder="Cole aqui o JSON de contextualização..."
                rows={8}
                className="font-mono text-xs"
              />
              {editAgentData.context_json && !validateJSON(editAgentData.context_json) && (
                <p className="text-xs text-red-500 mt-1">JSON inválido</p>
              )}
            </div>
            <Button
              onClick={async () => {
                if (!editingAgent) return;
                setIsEditing(true);
                try {
                  if (!editAgentData.name || !editAgentData.clinic_id) {
                    toast({
                      title: "Erro",
                      description: "Nome e clínica são obrigatórios",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (editAgentData.context_json && !validateJSON(editAgentData.context_json)) {
                    toast({
                      title: "Erro",
                      description: "JSON de contextualização inválido",
                      variant: "destructive",
                    });
                    return;
                  }
                  const { error } = await supabase
                    .from('agents')
                    .update({
                      name: editAgentData.name,
                      description: editAgentData.description || null,
                      personality: editAgentData.personality,
                      temperature: editAgentData.temperature,
                      clinic_id: editAgentData.clinic_id,
                      context_json: editAgentData.context_json || null
                    })
                    .eq('id', editingAgent.id);
                  if (error) throw error;
                  toast({
                    title: "Sucesso",
                    description: "Agente atualizado com sucesso",
                  });
                  setShowEditDialog(false);
                  setEditingAgent(null);
                  loadAgents();
                } catch (error) {
                  console.error('Erro ao editar agente:', error);
                  toast({
                    title: "Erro",
                    description: "Não foi possível editar o agente",
                    variant: "destructive",
                  });
                } finally {
                  setIsEditing(false);
                }
              }}
              disabled={isEditing}
              className="w-full"
            >
              {isEditing ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code de Conexão WhatsApp</DialogTitle>
          </DialogHeader>
          {qrAgent && (
            <AgentWhatsAppManager agentId={qrAgent.id} agentName={qrAgent.name} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agentes;
