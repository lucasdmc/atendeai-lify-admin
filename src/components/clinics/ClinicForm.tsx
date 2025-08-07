import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Phone, FileText, CheckCircle, AlertCircle, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateMetaPhoneFormat, formatPhoneNumberForMeta } from '@/utils/phoneValidation';
import { BrazilianPhoneInput } from '@/components/ui/brazilian-phone-input';
import { Clinic } from '@/services/clinicService';

interface ClinicFormProps {
  clinic?: Clinic | null;
  onSave: (clinic: Partial<Clinic>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const JSON_TEMPLATE = {
  "clinic_info": {
    "name": "Nome da Clínica",
    "specialty": "Especialidade principal",
    "address": "Endereço completo",
    "phone": "Telefone de contato",
    "website": "Site da clínica"
  },
  "services": [
    {
      "name": "Consulta médica",
      "description": "Consulta com especialista",
      "duration": "30 minutos",
      "price": "R$ 150,00"
    }
  ],
  "working_hours": {
    "monday": "08:00-18:00",
    "tuesday": "08:00-18:00",
    "wednesday": "08:00-18:00",
    "thursday": "08:00-18:00",
    "friday": "08:00-18:00",
    "saturday": "08:00-12:00",
    "sunday": "Fechado"
  },
  "policies": {
    "cancellation": "Cancelamento até 24h antes",
    "rescheduling": "Reagendamento gratuito",
    "insurance": "Aceitamos convênios",
    "payment": "Cartão, PIX, dinheiro"
  },
  "ai_context": {
    "tone": "Profissional e acolhedor",
    "specialties": ["Especialidade 1", "Especialidade 2"],
    "common_questions": [
      "Como agendar consulta?",
      "Quais convênios aceitam?",
      "Qual o valor da consulta?"
    ],
    "response_style": "Direto, informativo e empático"
  }
};

export const ClinicForm: React.FC<ClinicFormProps> = ({
  clinic,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Partial<Clinic>>({
    name: clinic?.name || '',
    whatsapp_phone: clinic?.whatsapp_phone || '',
    contextualization_json: clinic?.contextualization_json || {},
    has_contextualization: clinic?.has_contextualization || false,
    simulation_mode: clinic?.simulation_mode || false
  });
  
  const [contextualizationText, setContextualizationText] = useState('');
  const [isContextualizationValid, setIsContextualizationValid] = useState(true);
  const [phoneValidationError, setPhoneValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (clinic?.contextualization_json) {
      setContextualizationText(JSON.stringify(clinic.contextualization_json, null, 2));
    }
  }, [clinic]);

  // Validar telefone quando mudar
  useEffect(() => {
    const validation = validateMetaPhoneFormat(formData.whatsapp_phone || '');
    setPhoneValidationError(validation.isValid ? null : validation.error || null);
  }, [formData.whatsapp_phone]);

  const validateJSON = (text: string): boolean => {
    try {
      if (text.trim() === '') return true;
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

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, whatsapp_phone: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Erro",
        description: "Nome da clínica é obrigatório",
        variant: "destructive"
      });
      return;
    }

    // Validação rigorosa do telefone
    const phoneValidation = validateMetaPhoneFormat(formData.whatsapp_phone || '');
    if (!phoneValidation.isValid) {
      toast({
        title: "Formato de telefone inválido",
        description: phoneValidation.error,
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
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao processar JSON de contextualização",
          variant: "destructive"
        });
        return;
      }
    }

    const updatedClinic: Partial<Clinic> = {
      ...formData,
      contextualization_json: contextualization,
      has_contextualization: Object.keys(contextualization).length > 0
    };

    onSave(updatedClinic as Partial<Clinic>);
  };

  return (
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
          <BrazilianPhoneInput
            value={formData.whatsapp_phone || ''}
            onChange={handlePhoneChange}
            placeholder="(47) 9999-9999"
            required
            className={`${phoneValidationError ? 'border-red-500' : formData.whatsapp_phone && !phoneValidationError ? 'border-green-500' : ''}`}
          />
        </div>
      </div>

      {/* Configurações de Simulação */}
      <div className="flex items-center space-x-2">
        <Switch
          id="simulation_mode"
          checked={formData.simulation_mode || false}
          onCheckedChange={(checked) => setFormData({ ...formData, simulation_mode: checked })}
        />
        <Label htmlFor="simulation_mode">Modo de Simulação</Label>
      </div>

      {/* Contextualização IA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Contextualização para IA</h3>
            <p className="text-sm text-muted-foreground">
              Configure informações da clínica para melhorar as respostas da IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Carregar Template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyTemplate}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copiar Template
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contextualization">JSON de Contextualização</Label>
          <Textarea
            id="contextualization"
            value={contextualizationText}
            onChange={(e) => handleContextualizationChange(e.target.value)}
            placeholder="Cole aqui o JSON de contextualização..."
            className={`min-h-[300px] font-mono text-sm ${
              isContextualizationValid ? 'border-green-500' : 'border-red-500'
            }`}
          />
          <div className="flex items-center gap-2">
            {isContextualizationValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm ${isContextualizationValid ? 'text-green-600' : 'text-red-600'}`}>
              {isContextualizationValid ? 'JSON válido' : 'JSON inválido'}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isContextualizationValid || !!phoneValidationError}
        >
          {isLoading ? 'Salvando...' : 'Salvar Clínica'}
        </Button>
      </div>
    </form>
  );
}; 