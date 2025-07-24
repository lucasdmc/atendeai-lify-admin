import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Brain, Code, Download, Upload } from 'lucide-react';

interface ClinicContextualizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}

const ClinicContextualizationModal = ({ 
  isOpen, 
  onClose, 
  clinicId, 
  clinicName 
}: ClinicContextualizationModalProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && clinicId) {
      fetchContextualization();
    }
  }, [isOpen, clinicId]);

  const fetchContextualization = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clinics/${clinicId}/contextualization`);
      const data = await response.json();
      
      if (data.success && data.contextualization) {
        setJsonInput(JSON.stringify(data.contextualization, null, 2));
      } else {
        setJsonInput('{\n  \n}');
      }
    } catch (error) {
      console.error('Erro ao buscar contextualização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a contextualização da clínica.",
        variant: "destructive",
      });
      setJsonInput('{\n  \n}');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      let contextualizationData;
      try {
        contextualizationData = JSON.parse(jsonInput);
      } catch (error) {
        toast({
          title: "Erro",
          description: "JSON inválido. Verifique a sintaxe.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/clinics/${clinicId}/contextualization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextualization: contextualizationData }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Contextualização salva com sucesso!",
        });
        onClose();
      } else {
        throw new Error(data.error || 'Erro ao salvar contextualização');
      }
    } catch (error) {
      console.error('Erro ao salvar contextualização:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a contextualização.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
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
          "diferenciais": ["Diferencial 1", "Diferencial 2"],
          "acreditacoes": [
            {
              "orgao": "Órgão Acreditador",
              "nivel": "Nível da Acreditação",
              "data_validade": "2025-12-31"
            }
          ]
        },
        "localizacao": {
          "endereco_principal": {
            "logradouro": "Rua Exemplo",
            "numero": "123",
            "complemento": "Sala 1",
            "bairro": "Centro",
            "cidade": "Cidade",
            "estado": "Estado",
            "cep": "00000-000",
            "pais": "Brasil",
            "coordenadas": {
              "latitude": -23.5505,
              "longitude": -46.6333
            }
          }
        },
        "contatos": {
          "telefone_principal": "(11) 3333-3333",
          "whatsapp": "(11) 99999-9999",
          "email_principal": "contato@clinica.com",
          "website": "https://clinica.com"
        },
        "horario_funcionamento": {
          "segunda": {"abertura": "08:00", "fechamento": "18:00"},
          "terca": {"abertura": "08:00", "fechamento": "18:00"},
          "quarta": {"abertura": "08:00", "fechamento": "18:00"},
          "quinta": {"abertura": "08:00", "fechamento": "18:00"},
          "sexta": {"abertura": "08:00", "fechamento": "18:00"},
          "sabado": {"abertura": "08:00", "fechamento": "12:00"},
          "domingo": {"abertura": "Fechado", "fechamento": "Fechado"}
        }
      },
      "agente_ia": {
        "configuracao": {
          "nome": "Assistente Virtual",
          "personalidade": "Profissional e acolhedor",
          "tom_comunicacao": "Amigável e profissional",
          "nivel_formalidade": "Semi-formal",
          "idiomas": ["Português"],
          "saudacao_inicial": "Olá! Como posso ajudar você hoje?",
          "mensagem_despedida": "Obrigado por entrar em contato!",
          "mensagem_fora_horario": "Estamos fora do horário de funcionamento."
        },
        "comportamento": {
          "proativo": true,
          "oferece_sugestoes": true,
          "escalacao_automatica": true
        },
        "restricoes": {
          "nao_pode_diagnosticar": true,
          "nao_pode_prescrever": true,
          "topicos_proibidos": ["diagnósticos", "prescrições"]
        }
      },
      "profissionais": [
        {
          "id": "1",
          "nome_completo": "Dr. João Silva",
          "nome_exibicao": "Dr. João Silva",
          "titulo": "Médico",
          "crm": "12345",
          "especialidades": ["Clínica Geral"],
          "ativo": true,
          "aceita_novos_pacientes": true
        }
      ],
      "servicos": {
        "consultas": [
          {
            "id": "1",
            "nome": "Consulta Médica",
            "descricao": "Consulta médica geral",
            "especialidade": "Clínica Geral",
            "duracao_minutos": 30,
            "preco_particular": 150.00,
            "aceita_convenio": true,
            "ativo": true
          }
        ]
      },
      "convenios": [
        {
          "id": "1",
          "nome": "Convênio Exemplo",
          "categoria": "Particular",
          "ativo": true
        }
      ],
      "formas_pagamento": {
        "dinheiro": true,
        "cartao_credito": true,
        "cartao_debito": true,
        "pix": true
      }
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-contextualizacao.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Baixado",
      description: "Template de contextualização baixado com sucesso!",
    });
  };

  const handleUploadTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const json = JSON.parse(content);
            setJsonInput(JSON.stringify(json, null, 2));
            toast({
              title: "Template Carregado",
              description: "Template carregado com sucesso!",
            });
          } catch (error) {
            toast({
              title: "Erro",
              description: "Arquivo JSON inválido.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Contextualização da IA - {clinicName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Configuração JSON da IA
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUploadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Carregar Template
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Configure aqui todas as informações que a IA deve usar para responder aos pacientes. 
                  Use o template como base e personalize conforme necessário.
                </p>
                <Textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Cole aqui o JSON de contextualização..."
                  rows={25}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Contextualização'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicContextualizationModal; 