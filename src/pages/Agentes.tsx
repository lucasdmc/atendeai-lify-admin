
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Bot, Settings, Phone, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    clinic_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    loadClinics();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select(`
          *,
          clinics(name)
        `)
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
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Erro ao carregar clínicas:', error);
    }
  };

  const createAgent = async () => {
    try {
      if (!newAgent.name || !newAgent.clinic_id) {
        toast({
          title: "Erro",
          description: "Nome e clínica são obrigatórios",
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
          clinic_id: newAgent.clinic_id
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
        clinic_id: ''
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

              <Button onClick={createAgent} className="w-full">
                Criar Agente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
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
