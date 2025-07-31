import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Brain, Phone, Info, FileText, Copy } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Clinic {
  id?: string;
  name: string;
  whatsapp_phone: string;
  contextualization_json: any;
  has_contextualization: boolean;
}

interface ClinicFormProps {
  clinic?: Clinic;
  onSubmit: (clinic: Clinic) => void;
  onCancel: () => void;
}

const JSON_TEMPLATE = {
  "clinica": {
    "informacoes_basicas": {
      "nome": "Nome da Clínica",
      "razao_social": "Razão Social da Clínica",
      "cnpj": "00.000.000/0001-00",
      "especialidade_principal": "Especialidade Principal",
      "especialidades_secundarias": ["Especialidade 1", "Especialidade 2"],
      "descricao": "Descrição da clínica",
      "missao": "Missão da clínica",
      "valores": ["Valor 1", "Valor 2"],
      "diferenciais": ["Diferencial 1", "Diferencial 2"]
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "Rua das Flores",
        "numero": "123",
        "complemento": "Sala 101",
        "bairro": "Centro",
        "cidade": "Blumenau",
        "estado": "SC",
        "cep": "89010-000",
        "pais": "Brasil"
      }
    },
    "contatos": {
      "telefone_principal": "(47) 3333-3333",
      "whatsapp": "(47) 99999-9999",
      "email_principal": "contato@clinica.com",
      "website": "https://clinica.com"
    },
    "horario_funcionamento": {
      "segunda": {"abertura": "08:00", "fechamento": "18:00"},
      "terca": {"abertura": "08:00", "fechamento": "18:00"},
      "quarta": {"abertura": "08:00", "fechamento": "18:00"},
      "quinta": {"abertura": "08:00", "fechamento": "18:00"},
      "sexta": {"abertura": "08:00", "fechamento": "17:00"},
      "sabado": {"abertura": "08:00", "fechamento": "12:00"},
      "domingo": {"abertura": null, "fechamento": null}
    }
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Assistente",
      "personalidade": "Profissional e atencioso",
      "tom_comunicacao": "Formal mas acessível",
      "saudacao_inicial": "Olá! Sou o assistente virtual da clínica. Como posso ajudar?",
      "mensagem_despedida": "Obrigado por escolher nossa clínica. Até breve!"
    }
  },
  "profissionais": [
    {
      "id": "prof_001",
      "nome_completo": "Dr. João Silva",
      "especialidades": ["Cardiologia"],
      "ativo": true,
      "aceita_novos_pacientes": true
    }
  ],
  "servicos": {
    "consultas": [
      {
        "id": "cons_001",
        "nome": "Consulta Especializada",
        "descricao": "Consulta médica especializada",
        "preco_particular": 150.00,
        "aceita_convenio": true,
        "convenios_aceitos": ["Unimed", "Amil"],
        "ativo": true
      }
    ]
  },
  "convenios": [
    {
      "id": "conv_001",
      "nome": "Unimed",
      "ativo": true,
      "copagamento": false
    }
  ],
  "formas_pagamento": {
    "dinheiro": true,
    "cartao_credito": true,
    "cartao_debito": true,
    "pix": true
  }
};

export const ClinicForm: React.FC<ClinicFormProps> = ({ clinic, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Clinic>({
    name: clinic?.name || '',
    whatsapp_phone: clinic?.whatsapp_phone || '',
    contextualization_json: clinic?.contextualization_json || {},
    has_contextualization: clinic?.has_contextualization || false
  });
  
  const [contextualizationText, setContextualizationText] = useState('');
  const [isContextualizationValid, setIsContextualizationValid] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (clinic?.contextualization_json) {
      setContextualizationText(JSON.stringify(clinic.contextualization_json, null, 2));
    }
  }, [clinic]);

  const validateJSON = (text: string) => {
    try {
      if (text.trim() === '') return {};
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleContextualizationChange = (text: string) => {
    setContextualizationText(text);
    const isValid = text.trim() === '' || validateJSON(text);
    setIsContextualizationValid(isValid);
  };

  const loadTemplate = () => {
    setContextualizationText(JSON.stringify(JSON_TEMPLATE, null, 2));
    setIsContextualizationValid(true);
    toast({
      title: "Template carregado",
      description: "Template JSON foi carregado. Edite conforme necessário.",
    });
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(JSON_TEMPLATE, null, 2));
    toast({
      title: "Template copiado",
      description: "Template JSON foi copiado para a área de transferência.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da clínica é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.whatsapp_phone.trim()) {
      toast({
        title: "Erro",
        description: "Telefone WhatsApp é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!isContextualizationValid) {
      toast({
        title: "Erro",
        description: "JSON de contextualização inválido",
        variant: "destructive"
      });
      return;
    }

    let contextualization = {};
    if (contextualizationText.trim()) {
      try {
        contextualization = JSON.parse(contextualizationText);
      } catch {
        toast({
          title: "Erro",
          description: "Erro ao processar JSON de contextualização",
          variant: "destructive"
        });
        return;
      }
    }

    const updatedClinic = {
      ...formData,
      contextualization_json: contextualization,
      has_contextualization: Object.keys(contextualization).length > 0
    };

    onSubmit(updatedClinic);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {clinic ? 'Editar Clínica' : 'Nova Clínica'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Clínica *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome da clínica"
                required
              />
            </div>

            <div>
              <Label htmlFor="whatsapp_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone WhatsApp *
              </Label>
              <Input
                id="whatsapp_phone"
                value={formData.whatsapp_phone}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value })}
                placeholder="554730915628"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Este número será usado para identificar mensagens do WhatsApp
              </p>
            </div>
          </div>

          {/* Contextualização */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold">Contextualização da IA</Label>
                <Badge variant={formData.has_contextualization ? "default" : "secondary"}>
                  {formData.has_contextualization ? "Ativo" : "Genérico"}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                  <FileText className="h-4 w-4 mr-1" />
                  Carregar Template
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={copyTemplate}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar Template
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  JSON com informações específicas da clínica (opcional)
                </span>
              </div>
              
              <Textarea
                value={contextualizationText}
                onChange={(e) => handleContextualizationChange(e.target.value)}
                placeholder="Cole aqui o JSON de contextualização..."
                rows={20}
                className={`font-mono text-sm ${!isContextualizationValid ? 'border-red-500' : ''}`}
              />
              
              {!isContextualizationValid && (
                <p className="text-sm text-red-500">
                  JSON inválido. Verifique a sintaxe.
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Como funciona:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Sem JSON:</strong> IA responde com informações genéricas</li>
                <li>• <strong>Com JSON:</strong> IA usa informações específicas da clínica</li>
                <li>• <strong>Campos principais:</strong> clinica.informacoes_basicas, clinica.localizacao, clinica.contatos, clinica.horario_funcionamento</li>
                <li>• <strong>Exemplo:</strong> "Qual o endereço?" → IA responde com o endereço do JSON</li>
                <li>• <strong>Profissionais:</strong> IA pode listar médicos e especialidades</li>
                <li>• <strong>Serviços:</strong> IA informa preços e convênios aceitos</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {clinic ? 'Atualizar' : 'Criar'} Clínica
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 