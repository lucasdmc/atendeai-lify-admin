import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  RefreshCw,
  AlertCircle,
  Mail,
  Globe,
  Heart,
  Star,
  Calendar,
  Shield
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { supabase } from '@/integrations/supabase/client';

interface ContextualizacaoData {
  clinica: {
    informacoes_basicas: {
      nome: string;
      razao_social: string;
      cnpj: string;
      especialidade_principal: string;
      especialidades_secundarias: string[];
      descricao: string;
      missao: string;
      valores: string[];
      diferenciais: string[];
    };
    localizacao: {
      endereco_principal: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        estado: string;
        cep: string;
        pais: string;
      };
    };
    contatos: {
      telefone_principal: string;
      whatsapp: string;
      email_principal: string;
      emails_departamentos: {
        agendamento: string;
        resultados: string;
      };
      website: string;
    };
    horario_funcionamento: {
      [key: string]: { abertura: string | null; fechamento: string | null };
    };
  };
  agente_ia: {
    configuracao: {
      nome: string;
      personalidade: string;
      tom_comunicacao: string;
      nivel_formalidade: string;
      idiomas: string[];
      saudacao_inicial: string;
      mensagem_despedida: string;
      mensagem_fora_horario: string;
    };
    comportamento: {
      proativo: boolean;
      oferece_sugestoes: boolean;
      solicita_feedback: boolean;
      escalacao_automatica: boolean;
      limite_tentativas: number;
      contexto_conversa: boolean;
    };
  };
  profissionais: Array<{
    id: string;
    nome_completo: string;
    nome_exibicao: string;
    crm: string;
    especialidades: string[];
    experiencia: string;
    ativo: boolean;
    aceita_novos_pacientes: boolean;
    tempo_consulta_padrao: number;
  }>;
  servicos: {
    consultas: Array<{
      id: string;
      nome: string;
      descricao: string;
      especialidade: string;
      duracao_minutos: number;
      preco_particular: number;
      aceita_convenio: boolean;
      convenios_aceitos: string[];
      ativo: boolean;
    }>;
    exames: Array<{
      id: string;
      nome: string;
      descricao: string;
      categoria: string;
      duracao_minutos: number;
      preco_particular: number;
      aceita_convenio: boolean;
      convenios_aceitos: string[];
      preparacao: {
        jejum_horas: number;
        instrucoes_especiais: string;
      };
      resultado_prazo_dias: number;
      ativo: boolean;
    }>;
  };
  convenios: Array<{
    id: string;
    nome: string;
    ativo: boolean;
    servicos_cobertos: string[];
    copagamento: boolean;
    valor_copagamento?: number;
    autorizacao_necessaria: boolean;
  }>;
  formas_pagamento: {
    dinheiro: boolean;
    cartao_credito: boolean;
    cartao_debito: boolean;
    pix: boolean;
    parcelamento: {
      disponivel: boolean;
      max_parcelas: number;
      valor_minimo_parcela: number;
    };
    desconto_a_vista: {
      disponivel: boolean;
      percentual: number;
    };
  };
  politicas: {
    agendamento: {
      antecedencia_minima_horas: number;
      antecedencia_maxima_dias: number;
      reagendamento_permitido: boolean;
      cancelamento_antecedencia_horas: number;
      confirmacao_necessaria: boolean;
    };
    atendimento: {
      tolerancia_atraso_minutos: number;
      acompanhante_permitido: boolean;
      documentos_obrigatorios: string[];
    };
  };
  informacoes_adicionais: {
    parcerias: Array<{
      nome: string;
      tipo: string;
      descricao: string;
    }>;
  };
  metadados: {
    versao_schema: string;
    data_criacao: string;
    status: string;
  };
}

export default function Contextualizar() {
  const { selectedClinic } = useClinic();
  const [contextualizacao, setContextualizacao] = useState<ContextualizacaoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContextualizacao();
  }, [selectedClinic]);

  const loadContextualizacao = async () => {
    if (!selectedClinic) {
      setError('Nenhuma clínica selecionada');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clinics')
        .select('contextualization_json')
        .eq('id', selectedClinic.id)
        .single();

      if (error) {
        throw new Error('Erro ao carregar contextualização');
      }

      if (data?.contextualization_json) {
        setContextualizacao(data.contextualization_json);
      } else {
        setError(`A clínica "${selectedClinic.name}" não possui contextualização configurada. É necessário configurar as informações da clínica para que o chatbot funcione corretamente.`);
      }
    } catch (error) {
      console.error('Erro ao carregar contextualização:', error);
      setError('Erro ao carregar dados da clínica. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (time: string) => {
    return time.replace(':', 'h');
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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
          
          {error.includes('não possui contextualização configurada') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Como configurar a contextualização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Por que é importante?</h4>
                  <p className="text-sm text-blue-800">
                    A contextualização permite que o chatbot conheça todas as informações da clínica e possa responder adequadamente aos pacientes sobre serviços, horários, profissionais e políticas.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Passos para configurar:</h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside">
                    <li>Acesse a seção de <strong>Clínicas</strong> no menu lateral</li>
                    <li>Selecione a clínica <strong>"{selectedClinic?.name}"</strong></li>
                    <li>Clique em <strong>"Editar"</strong> ou <strong>"Configurar Contextualização"</strong></li>
                    <li>Inserir o JSON de contextualização com todas as informações da clínica</li>
                    <li>Salvar as configurações</li>
                  </ol>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-900 mb-2">Informações necessárias no JSON:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>Informações básicas</strong>: Nome, especialidades, descrição, missão</li>
                    <li>• <strong>Localização</strong>: Endereço completo e contatos</li>
                    <li>• <strong>Horários</strong>: Funcionamento por dia da semana</li>
                    <li>• <strong>Agente IA</strong>: Nome, personalidade, mensagens do chatbot</li>
                    <li>• <strong>Profissionais</strong>: Lista de médicos com CRM e especialidades</li>
                    <li>• <strong>Serviços</strong>: Consultas e exames com preços</li>
                    <li>• <strong>Convênios</strong>: Planos de saúde aceitos</li>
                    <li>• <strong>Políticas</strong>: Formas de pagamento e regras de agendamento</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Exemplo de estrutura JSON:</h4>
                  <pre className="text-xs text-green-800 bg-green-100 p-2 rounded overflow-x-auto">
{`{
  "clinica": {
    "informacoes_basicas": {
      "nome": "Nome da Clínica",
      "especialidade_principal": "Especialidade",
      "descricao": "Descrição da clínica"
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua Exemplo",
        "numero": "123"
      }
    },
    "contatos": {
      "telefone_principal": "(11) 1234-5678"
    }
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Nome do Agente",
      "saudacao_inicial": "Olá! Como posso ajudar?"
    }
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (!selectedClinic) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              Nenhuma clínica selecionada
            </AlertDescription>
          </Alert>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Como selecionar uma clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para visualizar a contextualização de uma clínica, você precisa:
              </p>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Verificar se você está logado com uma conta que tem acesso a clínicas</li>
                <li>Se você é administrador, use o seletor de clínicas no cabeçalho</li>
                <li>Se você é usuário de uma clínica específica, a clínica deve ser selecionada automaticamente</li>
                <li>Certifique-se de que a clínica possui contextualização configurada</li>
              </ol>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Se você não consegue ver nenhuma clínica:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• Verifique se sua conta tem as permissões corretas</li>
                  <li>• Entre em contato com o administrador do sistema</li>
                  <li>• Certifique-se de que existem clínicas cadastradas no sistema</li>
                </ul>
              </div>
            </CardContent>
          </Card>
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
            Nenhuma contextualização encontrada para esta clínica.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificações de segurança para evitar erros
  if (!contextualizacao.clinica || !contextualizacao.agente_ia || !contextualizacao.profissionais || !contextualizacao.servicos || !contextualizacao.convenios || !contextualizacao.formas_pagamento || !contextualizacao.politicas) {
    const missingData = [];
    if (!contextualizacao.clinica) missingData.push('Informações da clínica');
    if (!contextualizacao.agente_ia) missingData.push('Configuração do agente IA');
    if (!contextualizacao.profissionais) missingData.push('Lista de profissionais');
    if (!contextualizacao.servicos) missingData.push('Serviços e exames');
    if (!contextualizacao.convenios) missingData.push('Convênios aceitos');
    if (!contextualizacao.formas_pagamento) missingData.push('Formas de pagamento');
    if (!contextualizacao.politicas) missingData.push('Políticas de agendamento');

    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              A contextualização da clínica está incompleta. Os seguintes dados estão faltando:
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados Faltantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <ul className="space-y-2">
                  {missingData.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Como resolver:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Acesse a seção <strong>Clínicas</strong> no menu lateral</li>
                  <li>Selecione a clínica "{selectedClinic?.name}"</li>
                  <li>Clique em <strong>"Editar"</strong> ou <strong>"Configurar Contextualização"</strong></li>
                  <li>Complete o JSON de contextualização com todas as informações necessárias</li>
                  <li>Salve as configurações</li>
                </ol>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">Informações necessárias no JSON:</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• <strong>clinica</strong>: Nome, especialidades, endereço, contatos, horários</li>
                  <li>• <strong>agente_ia</strong>: Nome, personalidade, mensagens do chatbot</li>
                  <li>• <strong>profissionais</strong>: Lista de médicos com CRM e especialidades</li>
                  <li>• <strong>servicos</strong>: Consultas e exames oferecidos com preços</li>
                  <li>• <strong>convenios</strong>: Planos de saúde aceitos</li>
                  <li>• <strong>formas_pagamento</strong>: Métodos de pagamento disponíveis</li>
                  <li>• <strong>politicas</strong>: Regras de agendamento e atendimento</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { clinica, agente_ia, profissionais, servicos, convenios, formas_pagamento, politicas } = contextualizacao;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contextualização da Clínica</h1>
          <p className="text-muted-foreground">
            Relatório completo das informações configuradas para o chatbot
          </p>
        </div>
        <Button variant="outline" onClick={loadContextualizacao}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="clinica" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="clinica">Clínica</TabsTrigger>
          <TabsTrigger value="agente">Agente IA</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
          <TabsTrigger value="convenios">Convênios</TabsTrigger>
          <TabsTrigger value="politicas">Políticas</TabsTrigger>
        </TabsList>

        <TabsContent value="clinica" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{clinica.informacoes_basicas?.nome || 'Nome não configurado'}</h3>
                  <p className="text-sm text-muted-foreground">{clinica.informacoes_basicas?.razao_social || 'Razão social não configurada'}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {clinica.informacoes_basicas?.cnpj || 'CNPJ não configurado'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium">Especialidade Principal</h4>
                  <Badge variant="secondary">{clinica.informacoes_basicas?.especialidade_principal || 'Não configurada'}</Badge>
                </div>

                <div>
                  <h4 className="font-medium">Especialidades Secundárias</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clinica.informacoes_basicas?.especialidades_secundarias?.map((esp, index) => (
                      <Badge key={index} variant="outline">{esp}</Badge>
                    )) || <p className="text-sm text-muted-foreground">Nenhuma especialidade configurada</p>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Descrição</h4>
                  <p className="text-sm">{clinica.informacoes_basicas?.descricao || 'Descrição não configurada'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Missão</h4>
                  <p className="text-sm">{clinica.informacoes_basicas?.missao || 'Missão não configurada'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Valores</h4>
                  <ul className="text-sm space-y-1">
                    {clinica.informacoes_basicas?.valores?.map((valor, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500" />
                        {valor}
                      </li>
                    )) || <li className="text-muted-foreground">Nenhum valor configurado</li>}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Diferenciais</h4>
                  <ul className="text-sm space-y-1">
                    {clinica.informacoes_basicas?.diferenciais?.map((diferencial, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {diferencial}
                      </li>
                    )) || <li className="text-muted-foreground">Nenhum diferencial configurado</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Localização e Contatos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localização e Contatos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Endereço</h4>
                  <p className="text-sm">
                    {clinica.localizacao?.endereco_principal?.logradouro || 'Logradouro não configurado'}, {clinica.localizacao?.endereco_principal?.numero || 'Número não configurado'}
                  </p>
                  <p className="text-sm">{clinica.localizacao?.endereco_principal?.complemento || 'Complemento não configurado'}</p>
                  <p className="text-sm">
                    {clinica.localizacao?.endereco_principal?.bairro || 'Bairro não configurado'}, {clinica.localizacao?.endereco_principal?.cidade || 'Cidade não configurada'} - {clinica.localizacao?.endereco_principal?.estado || 'Estado não configurado'}
                  </p>
                  <p className="text-sm">CEP: {clinica.localizacao?.endereco_principal?.cep || 'CEP não configurado'}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium">Contatos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{clinica.contatos?.telefone_principal || 'Telefone não configurado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">WhatsApp: {clinica.contatos?.whatsapp || 'WhatsApp não configurado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{clinica.contatos?.email_principal || 'Email não configurado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">{clinica.contatos?.website || 'Website não configurado'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium">Emails por Departamento</h4>
                  <div className="space-y-1">
                    <p className="text-sm"><strong>Agendamento:</strong> {clinica.contatos?.emails_departamentos?.agendamento || 'Email não configurado'}</p>
                    <p className="text-sm"><strong>Resultados:</strong> {clinica.contatos?.emails_departamentos?.resultados || 'Email não configurado'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Funcionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  {clinica.horario_funcionamento ? Object.entries(clinica.horario_funcionamento).map(([dia, horario]) => (
                    <div key={dia} className="text-center p-3 border rounded-lg">
                      <h4 className="font-medium capitalize">{dia}</h4>
                      {horario?.abertura && horario?.fechamento ? (
                        <p className="text-sm text-muted-foreground">
                          {formatTime(horario.abertura)} - {formatTime(horario.fechamento)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Fechado</p>
                      )}
                    </div>
                  )) : (
                    <div className="col-span-7 text-center p-4">
                      <p className="text-muted-foreground">Horários de funcionamento não configurados</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agente" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Configuração do Agente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Nome</h4>
                  <p className="text-lg font-semibold">{agente_ia.configuracao?.nome || 'Nome não configurado'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Personalidade</h4>
                  <p className="text-sm">{agente_ia.configuracao?.personalidade || 'Personalidade não configurada'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Tom de Comunicação</h4>
                  <p className="text-sm">{agente_ia.configuracao?.tom_comunicacao || 'Tom não configurado'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Nível de Formalidade</h4>
                  <Badge>{agente_ia.configuracao?.nivel_formalidade || 'Não configurado'}</Badge>
                </div>

                <div>
                  <h4 className="font-medium">Idiomas</h4>
                  <div className="flex gap-1">
                    {agente_ia.configuracao?.idiomas?.map((idioma, index) => (
                      <Badge key={index} variant="outline">{idioma}</Badge>
                    )) || <Badge variant="outline">Português</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${agente_ia.comportamento?.proativo ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Proativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${agente_ia.comportamento?.oferece_sugestoes ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Oferece Sugestões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${agente_ia.comportamento?.solicita_feedback ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Solicita Feedback</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${agente_ia.comportamento?.escalacao_automatica ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Escalação Automática</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Limite de Tentativas</h4>
                  <p className="text-sm">{agente_ia.comportamento?.limite_tentativas || 3} tentativas</p>
                </div>

                <div>
                  <h4 className="font-medium">Contexto de Conversa</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${agente_ia.comportamento?.contexto_conversa ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Mantém contexto</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Mensagens do Agente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Saudação Inicial</h4>
                  <p className="text-sm bg-muted p-3 rounded">{agente_ia.configuracao?.saudacao_inicial || 'Saudação não configurada'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Mensagem de Despedida</h4>
                  <p className="text-sm bg-muted p-3 rounded">{agente_ia.configuracao?.mensagem_despedida || 'Mensagem de despedida não configurada'}</p>
                </div>

                <div>
                  <h4 className="font-medium">Mensagem Fora do Horário</h4>
                  <p className="text-sm bg-muted p-3 rounded">{agente_ia.configuracao?.mensagem_fora_horario || 'Mensagem fora do horário não configurada'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-4">
          <div className="grid gap-4">
            {profissionais?.filter(p => p?.ativo)?.map((profissional) => (
              <Card key={profissional.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {profissional.nome_exibicao || 'Nome não configurado'}
                  </CardTitle>
                  <CardDescription>{profissional.nome_completo || 'Nome completo não configurado'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">CRM</h4>
                      <p className="text-sm">{profissional.crm || 'CRM não configurado'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Tempo de Consulta</h4>
                      <p className="text-sm">{profissional.tempo_consulta_padrao || 30} minutos</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Especialidades</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {profissional.especialidades?.map((esp, index) => (
                        <Badge key={index} variant="outline">{esp}</Badge>
                      )) || <p className="text-sm text-muted-foreground">Nenhuma especialidade configurada</p>}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium">Experiência</h4>
                    <p className="text-sm">{profissional.experiencia || 'Experiência não configurada'}</p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${profissional.aceita_novos_pacientes ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Aceita novos pacientes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum profissional configurado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Consultas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Consultas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicos.consultas?.filter(c => c?.ativo)?.map((consulta) => (
                  <div key={consulta.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{consulta.nome || 'Nome não configurado'}</h4>
                      <Badge variant="secondary">{formatCurrency(consulta.preco_particular || 0)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{consulta.descricao || 'Descrição não configurada'}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Duração:</strong> {consulta.duracao_minutos || 30} min
                      </div>
                      <div>
                        <strong>Especialidade:</strong> {consulta.especialidade || 'Não configurada'}
                      </div>
                    </div>
                    {consulta.aceita_convenio && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Convênios aceitos:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {consulta.convenios_aceitos?.map((conv, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{conv}</Badge>
                          )) || <p className="text-sm text-muted-foreground">Nenhum convênio configurado</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Nenhuma consulta configurada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exames */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exames
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicos.exames?.filter(e => e?.ativo)?.map((exame) => (
                  <div key={exame.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{exame.nome || 'Nome não configurado'}</h4>
                      <Badge variant="secondary">{formatCurrency(exame.preco_particular || 0)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{exame.descricao || 'Descrição não configurada'}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Duração:</strong> {exame.duracao_minutos || 30} min
                      </div>
                      <div>
                        <strong>Categoria:</strong> {exame.categoria || 'Não configurada'}
                      </div>
                      <div>
                        <strong>Jejum:</strong> {exame.preparacao?.jejum_horas || 0}h
                      </div>
                      <div>
                        <strong>Resultado:</strong> {exame.resultado_prazo_dias || 1} dias
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Preparação:</p>
                      <p className="text-sm text-muted-foreground">{exame.preparacao?.instrucoes_especiais || 'Instruções não configuradas'}</p>
                    </div>
                    {exame.aceita_convenio && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Convênios aceitos:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exame.convenios_aceitos?.map((conv, index) => (
                            <Badge key={index} variant="outline" className="text-xs">{conv}</Badge>
                          )) || <p className="text-sm text-muted-foreground">Nenhum convênio configurado</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center p-4">
                    <p className="text-muted-foreground">Nenhum exame configurado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="convenios" className="space-y-4">
          <div className="grid gap-4">
            {convenios?.filter(c => c?.ativo)?.map((convenio) => (
              <Card key={convenio.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {convenio.nome || 'Nome não configurado'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium">Copagamento</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${convenio.copagamento ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">{convenio.copagamento ? 'Sim' : 'Não'}</span>
                      </div>
                      {convenio.copagamento && convenio.valor_copagamento && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Valor: {formatCurrency(convenio.valor_copagamento)}
                        </p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">Autorização Necessária</h4>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${convenio.autorizacao_necessaria ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">{convenio.autorizacao_necessaria ? 'Sim' : 'Não'}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Serviços Cobertos</h4>
                      <p className="text-sm">{convenio.servicos_cobertos?.length || 0} serviços</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) || (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum convênio configurado</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="politicas" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Formas de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${formas_pagamento?.dinheiro ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Dinheiro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${formas_pagamento?.cartao_credito ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Cartão de Crédito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${formas_pagamento?.cartao_debito ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Cartão de Débito</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${formas_pagamento?.pix ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">PIX</span>
                  </div>
                </div>

                {formas_pagamento?.parcelamento?.disponivel && (
                  <div>
                    <h4 className="font-medium">Parcelamento</h4>
                    <p className="text-sm">
                      Até {formas_pagamento.parcelamento.max_parcelas || 6}x 
                      (mínimo {formatCurrency(formas_pagamento.parcelamento.valor_minimo_parcela || 100)})
                    </p>
                  </div>
                )}

                {formas_pagamento?.desconto_a_vista?.disponivel && (
                  <div>
                    <h4 className="font-medium">Desconto à Vista</h4>
                    <p className="text-sm">{formas_pagamento.desconto_a_vista.percentual || 5}% de desconto</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Políticas de Agendamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Políticas de Agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Antecedência Mínima</h4>
                    <p className="text-sm">{politicas.agendamento?.antecedencia_minima_horas || 24}h</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Antecedência Máxima</h4>
                    <p className="text-sm">{politicas.agendamento?.antecedencia_maxima_dias || 90} dias</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Reagendamento</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${politicas.agendamento?.reagendamento_permitido ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">{politicas.agendamento?.reagendamento_permitido ? 'Permitido' : 'Não permitido'}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Cancelamento</h4>
                    <p className="text-sm">{politicas.agendamento?.cancelamento_antecedencia_horas || 24}h antes</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Confirmação Necessária</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${politicas.agendamento?.confirmacao_necessaria ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">{politicas.agendamento?.confirmacao_necessaria ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Políticas de Atendimento */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Políticas de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium">Tolerância para Atraso</h4>
                    <p className="text-sm">{politicas.atendimento?.tolerancia_atraso_minutos || 15} minutos</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Acompanhante</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${politicas.atendimento?.acompanhante_permitido ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">{politicas.atendimento?.acompanhante_permitido ? 'Permitido' : 'Não permitido'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Documentos Obrigatórios</h4>
                  <ul className="text-sm space-y-1">
                    {politicas.atendimento?.documentos_obrigatorios?.map((doc, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {doc}
                      </li>
                    )) || <li className="text-muted-foreground">Nenhum documento obrigatório configurado</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
