import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Clock, 
  User, 
  Stethoscope, 
  CreditCard, 
  FileText,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import contextualizacaoService, { ContextualizacaoClinica } from '@/services/contextualizacaoService';

export default function Contextualizar() {
  const [contextualizacao, setContextualizacao] = useState<ContextualizacaoClinica | null>(null);
  const [contextoChatbot, setContextoChatbot] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadContextualizacao();
  }, []);

  const loadContextualizacao = () => {
    try {
      const data = contextualizacaoService.getContextualizacao();
      setContextualizacao(data);
      setContextoChatbot(contextualizacaoService.gerarContextoChatbot());
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar contextualização:', error);
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      // Aqui você pode implementar a lógica para salvar no banco de dados
      // Por enquanto, apenas simulamos o salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = () => {
    loadContextualizacao();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando contextualização...</span>
        </div>
      </div>
    );
  }

  if (!contextualizacao) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar a contextualização da clínica.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { clinica, agente_ia, profissionais, servicos, convenios } = contextualizacao;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contextualização da Clínica</h1>
          <p className="text-muted-foreground">
            Configure as informações que serão usadas pelo chatbot para responder aos pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isSaving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {saveStatus === 'success' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Contextualização salva com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao salvar a contextualização. Tente novamente.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="clinica" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="clinica">Clínica</TabsTrigger>
          <TabsTrigger value="agente">Agente IA</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="convenios">Convênios</TabsTrigger>
          <TabsTrigger value="contexto">Contexto Chatbot</TabsTrigger>
        </TabsList>

        <TabsContent value="clinica" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Clínica</Label>
                  <Input value={clinica.informacoes_basicas.nome} readOnly />
                </div>
                <div>
                  <Label>Razão Social</Label>
                  <Input value={clinica.informacoes_basicas.razao_social} readOnly />
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <Input value={clinica.informacoes_basicas.cnpj} readOnly />
                </div>
                <div>
                  <Label>Especialidade Principal</Label>
                  <Input value={clinica.informacoes_basicas.especialidade_principal} readOnly />
                </div>
              </div>
              
              <div>
                <Label>Especialidades Secundárias</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {clinica.informacoes_basicas.especialidades_secundarias.map((esp, index) => (
                    <Badge key={index} variant="secondary">{esp}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea value={clinica.informacoes_basicas.descricao} readOnly rows={3} />
              </div>

              <div>
                <Label>Missão</Label>
                <Textarea value={clinica.informacoes_basicas.missao} readOnly rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {clinica.localizacao.endereco_principal.logradouro}, {clinica.localizacao.endereco_principal.numero}
                </p>
                <p className="text-muted-foreground">
                  {clinica.localizacao.endereco_principal.complemento}
                </p>
                <p className="text-muted-foreground">
                  {clinica.localizacao.endereco_principal.bairro}, {clinica.localizacao.endereco_principal.cidade} - {clinica.localizacao.endereco_principal.estado}
                </p>
                <p className="text-muted-foreground">
                  CEP: {clinica.localizacao.endereco_principal.cep}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Telefone Principal</Label>
                  <Input value={clinica.contatos.telefone_principal} readOnly />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={clinica.contatos.whatsapp} readOnly />
                </div>
                <div>
                  <Label>Email Principal</Label>
                  <Input value={clinica.contatos.email_principal} readOnly />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={clinica.contatos.website} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(clinica.horario_funcionamento).map(([dia, horario]) => (
                  <div key={dia} className="flex justify-between items-center p-2 border rounded">
                    <span className="capitalize font-medium">{dia}</span>
                    <span className="text-muted-foreground">
                      {horario.abertura && horario.fechamento 
                        ? `${horario.abertura} - ${horario.fechamento}`
                        : 'Fechado'
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agente" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Configuração do Agente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={agente_ia.configuracao.nome} readOnly />
                </div>
                <div>
                  <Label>Nível de Formalidade</Label>
                  <Input value={agente_ia.configuracao.nivel_formalidade} readOnly />
                </div>
              </div>

              <div>
                <Label>Personalidade</Label>
                <Textarea value={agente_ia.configuracao.personalidade} readOnly rows={3} />
              </div>

              <div>
                <Label>Tom de Comunicação</Label>
                <Textarea value={agente_ia.configuracao.tom_comunicacao} readOnly rows={2} />
              </div>

              <div>
                <Label>Saudação Inicial</Label>
                <Textarea value={agente_ia.configuracao.saudacao_inicial} readOnly rows={2} />
              </div>

              <div>
                <Label>Mensagem de Despedida</Label>
                <Textarea value={agente_ia.configuracao.mensagem_despedida} readOnly rows={2} />
              </div>

              <div>
                <Label>Mensagem Fora do Horário</Label>
                <Textarea value={agente_ia.configuracao.mensagem_fora_horario} readOnly rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Profissionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profissionais.map((prof) => (
                  <div key={prof.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{prof.nome_completo}</h3>
                        <p className="text-sm text-muted-foreground">{prof.crm}</p>
                        <p className="text-sm">{prof.experiencia}</p>
                        <div className="flex flex-wrap gap-1">
                          {prof.especialidades.map((esp, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {esp}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge variant={prof.ativo ? "default" : "secondary"}>
                        {prof.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicos.consultas.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{consulta.nome}</h3>
                        <p className="text-sm text-muted-foreground">{consulta.descricao}</p>
                        <p className="text-sm">Duração: {consulta.duracao_minutos} minutos</p>
                        <p className="text-sm font-medium">R$ {consulta.preco_particular.toFixed(2)}</p>
                      </div>
                      <Badge variant={consulta.ativo ? "default" : "secondary"}>
                        {consulta.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exames</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicos.exames.map((exame) => (
                  <div key={exame.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{exame.nome}</h3>
                        <p className="text-sm text-muted-foreground">{exame.descricao}</p>
                        <p className="text-sm">Categoria: {exame.categoria}</p>
                        <p className="text-sm">Duração: {exame.duracao_minutos} minutos</p>
                        <p className="text-sm font-medium">R$ {exame.preco_particular.toFixed(2)}</p>
                        <p className="text-sm">Prazo resultado: {exame.resultado_prazo_dias} dias</p>
                      </div>
                      <Badge variant={exame.ativo ? "default" : "secondary"}>
                        {exame.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convenios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Convênios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {convenios.map((convenio) => (
                  <div key={convenio.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{convenio.nome}</h3>
                        <div className="flex gap-2">
                          <Badge variant={convenio.copagamento ? "outline" : "default"}>
                            {convenio.copagamento ? `Copagamento R$ ${convenio.valor_copagamento}` : "Sem copagamento"}
                          </Badge>
                          <Badge variant={convenio.autorizacao_necessaria ? "outline" : "default"}>
                            {convenio.autorizacao_necessaria ? "Autorização necessária" : "Sem autorização"}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant={convenio.ativo ? "default" : "secondary"}>
                        {convenio.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contexto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contexto do Chatbot
              </CardTitle>
              <CardDescription>
                Este é o contexto que será enviado para o chatbot da ESADI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Contexto Atual</Label>
                  <Textarea 
                    value={contextoChatbot} 
                    readOnly 
                    rows={20} 
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Este contexto é usado automaticamente pelo chatbot para responder aos pacientes com informações precisas sobre a ESADI.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
