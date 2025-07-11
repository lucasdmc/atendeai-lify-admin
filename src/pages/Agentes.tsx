import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Bot, Settings, Phone, Building2, Upload, FileText, CheckCircle, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/hooks/useAuth';
import { canEditAgents } from '@/components/users/UserRoleUtils';

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
  context_json?: string | null;
  whatsapp_number?: string | null;
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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    personality: 'profissional e acolhedor',
    temperature: 0.7,
    clinic_id: '',
    context_json: '',
    whatsapp_number: '',
    is_whatsapp_connected: false
  });
  const [editAgent, setEditAgent] = useState({
    name: '',
    description: '',
    personality: 'profissional e acolhedor',
    temperature: 0.7,
    context_json: '',
    whatsapp_number: '',
    is_whatsapp_connected: false
  });
  const [availableWhatsAppNumbers, setAvailableWhatsAppNumbers] = useState<string[]>([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();
  const { userRole } = useAuth();

  useEffect(() => {
    loadAgents();
    loadClinics();
    loadWhatsAppNumbers();
  }, [selectedClinic]);

  const loadAgents = async () => {
    if (!selectedClinic) {
      setAgents([]);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          clinics(name)
        `)
        .eq('clinic_id', selectedClinic.id)
        .order('created_at', { ascending: false });

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
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name');

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
    }
  };

  const loadWhatsAppNumbers = async () => {
    if (!selectedClinic) return;
    
    setIsLoadingWhatsApp(true);
    try {
      // Buscar números WhatsApp ativos da clínica
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('phone_number, is_active')
        .eq('clinic_id', selectedClinic.id)
        .eq('is_active', true);

      if (error) throw error;
      
      const numbers = data?.map(conn => conn.phone_number).filter(Boolean) || [];
      setAvailableWhatsAppNumbers(numbers);
    } catch (error) {
      console.error('Erro ao carregar números WhatsApp:', error);
      // Se a tabela não existir, usar números mock para demonstração
      setAvailableWhatsAppNumbers(['+55 11 99999-9999', '+55 11 88888-8888']);
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  const createAgent = async () => {
    try {
      if (!newAgent.name || !selectedClinic) {
        toast({
          title: "Erro",
          description: "Nome é obrigatório e clínica deve estar selecionada",
          variant: "destructive",
        });
        return;
      }

      // Validar JSON se fornecido
      if (newAgent.context_json && !validateJSON(newAgent.context_json)) {
        toast({
          title: "Erro",
          description: "JSON de contextualização inválido",
          variant: "destructive",
        });
        return;
      }

      // Validar número WhatsApp se fornecido
      if (newAgent.whatsapp_number && !availableWhatsAppNumbers.includes(newAgent.whatsapp_number)) {
        toast({
          title: "Erro",
          description: "Número WhatsApp deve ser selecionado da lista de números ativos",
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
          clinic_id: selectedClinic.id,
          context_json: newAgent.context_json || null,
          whatsapp_number: newAgent.whatsapp_number || null,
          is_whatsapp_connected: newAgent.is_whatsapp_connected || false
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
        context_json: '',
        whatsapp_number: '',
        is_whatsapp_connected: false
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

  const updateAgent = async () => {
    if (!editingAgent) return;

    try {
      if (!editAgent.name) {
        toast({
          title: "Erro",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Validar JSON se fornecido
      if (editAgent.context_json && !validateJSON(editAgent.context_json)) {
        toast({
          title: "Erro",
          description: "JSON de contextualização inválido",
          variant: "destructive",
        });
        return;
      }

      // Validar número WhatsApp se fornecido
      if (editAgent.whatsapp_number && !availableWhatsAppNumbers.includes(editAgent.whatsapp_number)) {
        toast({
          title: "Erro",
          description: "Número WhatsApp deve ser selecionado da lista de números ativos",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('agents')
        .update({
          name: editAgent.name,
          description: editAgent.description || null,
          personality: editAgent.personality,
          temperature: editAgent.temperature,
          context_json: editAgent.context_json || null,
          whatsapp_number: editAgent.whatsapp_number || null,
          is_whatsapp_connected: editAgent.is_whatsapp_connected || false
        })
        .eq('id', editingAgent.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Agente atualizado com sucesso",
      });

      setShowEditDialog(false);
      setEditingAgent(null);
      setEditAgent({
        name: '',
        description: '',
        personality: 'profissional e acolhedor',
        temperature: 0.7,
        context_json: '',
        whatsapp_number: '',
        is_whatsapp_connected: false
      });
      loadAgents();
    } catch (error) {
      console.error('Erro ao atualizar agente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o agente",
        variant: "destructive",
      });
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgent({
      name: agent.name || '',
      description: agent.description || '',
      personality: agent.personality || 'profissional e acolhedor',
      temperature: agent.temperature || 0.7,
      context_json: agent.context_json || '',
      whatsapp_number: agent.whatsapp_number || '',
      is_whatsapp_connected: agent.is_whatsapp_connected || false
    });
    setShowEditDialog(true);
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
        description: `Agente ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      loadAgents();
    } catch (error) {
      console.error('Erro ao alterar status do agente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do agente",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setNewAgent({ ...newAgent, context_json: content });
      };
      reader.readAsText(file);
    }
  };

  const handleEditFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setEditAgent({ ...editAgent, context_json: content });
      };
      reader.readAsText(file);
    }
  };

  const validateJSON = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agentes de IA</h1>
          <p className="text-gray-600 mt-2">Gerencie os agentes de inteligência artificial</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          disabled={!canEditAgents(userRole)}
          className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {/* Debug Info - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="text-sm">
              <div><strong>Debug Info:</strong></div>
              <div>Role: {userRole}</div>
              <div>Can edit agents: {canEditAgents(userRole) ? '✅' : '❌'}</div>
              <div>Selected Clinic: {selectedClinic?.name || 'Nenhuma'}</div>
              <div>Total agents: {agents.length}</div>
              <div>Available WhatsApp numbers: {availableWhatsAppNumbers.length}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Agente *</label>
              <Input
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                placeholder="Ex: Dr. Silva - Cardiologista"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                placeholder="Descreva o papel e especialidade do agente"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="formal e técnico">Formal e Técnico</SelectItem>
                    <SelectItem value="amigável e casual">Amigável e Casual</SelectItem>
                    <SelectItem value="empático e cuidadoso">Empático e Cuidadoso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Criatividade (0.1 - 1.0)</label>
                <Input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={newAgent.temperature}
                  onChange={(e) => setNewAgent({ ...newAgent, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Contextualização JSON</label>
              <div className="space-y-2">
                <Textarea
                  value={newAgent.context_json}
                  onChange={(e) => setNewAgent({ ...newAgent, context_json: e.target.value })}
                  placeholder='{"servicos": ["consulta", "exame"], "horarios": "8h-18h", "especialidades": ["cardio", "neuro"]}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload JSON
                  </Button>
                  {newAgent.context_json && validateJSON(newAgent.context_json) && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JSON com informações específicas da clínica para contextualizar o agente
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Número WhatsApp</label>
              {isLoadingWhatsApp ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  <span className="text-sm text-gray-500">Carregando números ativos...</span>
                </div>
              ) : availableWhatsAppNumbers.length > 0 ? (
                <Select 
                  value={newAgent.whatsapp_number} 
                  onValueChange={(value) => setNewAgent({ ...newAgent, whatsapp_number: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um número WhatsApp ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWhatsAppNumbers.map((number) => (
                      <SelectItem key={number} value={number}>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          {number}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-yellow-50 rounded border">
                  <p className="text-xs text-yellow-700">
                    Nenhum número WhatsApp ativo encontrado. 
                    Conecte um número na seção "Conectar WhatsApp" primeiro.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selecione um número WhatsApp que já leu o QR Code e está ativo
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="whatsapp-connected"
                checked={newAgent.is_whatsapp_connected}
                onChange={(e) => setNewAgent({ ...newAgent, is_whatsapp_connected: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="whatsapp-connected" className="text-sm font-medium">
                Conectar ao WhatsApp
              </label>
            </div>

            <Button onClick={createAgent} className="w-full">
              Criar Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do Agente *</label>
              <Input
                value={editAgent.name}
                onChange={(e) => setEditAgent({ ...editAgent, name: e.target.value })}
                placeholder="Ex: Dr. Silva - Cardiologista"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={editAgent.description}
                onChange={(e) => setEditAgent({ ...editAgent, description: e.target.value })}
                placeholder="Descreva o papel e especialidade do agente"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Personalidade</label>
                <Select 
                  value={editAgent.personality} 
                  onValueChange={(value) => setEditAgent({ ...editAgent, personality: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional e acolhedor">Profissional e Acolhedor</SelectItem>
                    <SelectItem value="formal e técnico">Formal e Técnico</SelectItem>
                    <SelectItem value="amigável e casual">Amigável e Casual</SelectItem>
                    <SelectItem value="empático e cuidadoso">Empático e Cuidadoso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Criatividade (0.1 - 1.0)</label>
                <Input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={editAgent.temperature}
                  onChange={(e) => setEditAgent({ ...editAgent, temperature: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Contextualização JSON</label>
              <div className="space-y-2">
                <Textarea
                  value={editAgent.context_json}
                  onChange={(e) => setEditAgent({ ...editAgent, context_json: e.target.value })}
                  placeholder='{"servicos": ["consulta", "exame"], "horarios": "8h-18h", "especialidades": ["cardio", "neuro"]}'
                  rows={4}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleEditFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload JSON
                  </Button>
                  {editAgent.context_json && validateJSON(editAgent.context_json) && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JSON com informações específicas da clínica para contextualizar o agente
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Número WhatsApp</label>
              {isLoadingWhatsApp ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  <span className="text-sm text-gray-500">Carregando números ativos...</span>
                </div>
              ) : availableWhatsAppNumbers.length > 0 ? (
                <Select 
                  value={editAgent.whatsapp_number} 
                  onValueChange={(value) => setEditAgent({ ...editAgent, whatsapp_number: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um número WhatsApp ativo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWhatsAppNumbers.map((number) => (
                      <SelectItem key={number} value={number}>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          {number}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-yellow-50 rounded border">
                  <p className="text-xs text-yellow-700">
                    Nenhum número WhatsApp ativo encontrado. 
                    Conecte um número na seção "Conectar WhatsApp" primeiro.
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Selecione um número WhatsApp que já leu o QR Code e está ativo
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-whatsapp-connected"
                checked={editAgent.is_whatsapp_connected}
                onChange={(e) => setEditAgent({ ...editAgent, is_whatsapp_connected: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="edit-whatsapp-connected" className="text-sm font-medium">
                Conectar ao WhatsApp
              </label>
            </div>

            <Button onClick={updateAgent} className="w-full">
              Atualizar Agente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                {agent.whatsapp_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">WhatsApp:</span>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-green-500" />
                      <span className="font-medium">{agent.whatsapp_number}</span>
                      {agent.is_whatsapp_connected && (
                        <Badge variant="default" className="text-xs">Conectado</Badge>
                      )}
                    </div>
                  </div>
                )}
                {agent.context_json && (
                  <div className="text-sm">
                    <span className="text-gray-500">Contexto:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono overflow-hidden">
                      {agent.context_json.length > 100 
                        ? `${agent.context_json.substring(0, 100)}...` 
                        : agent.context_json
                      }
                    </div>
                  </div>
                )}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditAgent(agent)}
                  disabled={!canEditAgents(userRole)}
                  title={!canEditAgents(userRole) ? 'Você não tem permissão para editar agentes' : 'Editar agente'}
                >
                  <Edit className="h-4 w-4" />
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
    </div>
  );
};

export default Agentes;
