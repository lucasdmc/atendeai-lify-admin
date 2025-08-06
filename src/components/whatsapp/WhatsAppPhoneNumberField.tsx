import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppPhoneNumberFieldProps {
  value: string;
  onChange: (value: string) => void;
  integrationType: 'meta_api';
  isVerified?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed' | 'unverified';
  verificationDate?: string | null;
  onVerify?: (phoneNumber: string) => Promise<boolean>;
  disabled?: boolean;
}

export const WhatsAppPhoneNumberField = ({
  value,
  onChange,
  integrationType,
  isVerified = false,
  verificationStatus = 'pending',
  verificationDate,
  onVerify,
  disabled = false
}: WhatsAppPhoneNumberFieldProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const { toast } = useToast();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const formatPhoneNumber = (input: string): string => {
    // Remove tudo exceto números
    const numbers = input.replace(/\D/g, '');
    
    // Se não tem números, retorna vazio
    if (numbers.length === 0) return '';
    
    // Se começa com 0, remove
    const cleanNumbers = numbers.startsWith('0') ? numbers.slice(1) : numbers;
    
    // Se tem 11 dígitos (DDD + 9 dígitos), adiciona +55
    if (cleanNumbers.length === 11) {
      return `+55${cleanNumbers}`;
    }
    
    // Se já tem código do país, retorna como está
    if (input.startsWith('+')) {
      return input;
    }
    
    // Se tem 13 dígitos (código do país + DDD + número), adiciona +
    if (cleanNumbers.length === 13 && cleanNumbers.startsWith('55')) {
      return `+${cleanNumbers}`;
    }
    
    // Se tem 12 dígitos (código do país + DDD + número sem 9), adiciona +
    if (cleanNumbers.length === 12 && cleanNumbers.startsWith('55')) {
      return `+${cleanNumbers}`;
    }
    
    // Caso padrão, adiciona +55
    return `+55${cleanNumbers}`;
  };

  const handleInputChange = (input: string) => {
    const formatted = formatPhoneNumber(input);
    setLocalValue(formatted);
    onChange(formatted);
  };

  const handleVerify = async () => {
    if (!localValue || !onVerify) return;

    setIsVerifying(true);
    try {
      const success = await onVerify(localValue);
      if (success) {
        toast({
          title: "Número verificado",
          description: "O número foi verificado com sucesso na Meta Business.",
        });
      } else {
        toast({
          title: "Falha na verificação",
          description: "Não foi possível verificar o número. Verifique se está correto e registrado na Meta Business.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o número. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falha</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      default:
        return <Badge variant="secondary">Não verificado</Badge>;
    }
  };

  const isRequired = integrationType === 'meta_api';
  const canVerify = integrationType === 'meta_api' && localValue && !isVerifying;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="whatsapp-phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Número do WhatsApp
          {isRequired && <span className="text-red-500">*</span>}
        </Label>
        
        <div className="flex gap-2">
          <Input
            id="whatsapp-phone"
            type="tel"
            placeholder="+5511999999999"
            value={localValue}
            onChange={(e) => handleInputChange(e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          {canVerify && (
            <Button
              type="button"
              variant="outline"
              onClick={handleVerify}
              disabled={isVerifying}
              className="whitespace-nowrap"
            >
              {isVerifying ? 'Verificando...' : 'Verificar'}
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-600">
          Formato: +5511999999999 (código do país + DDD + número)
        </p>
      </div>

      {/* Status da Verificação */}
      {localValue && integrationType === 'meta_api' && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">Status da Verificação</span>
              </div>
              {getStatusBadge()}
            </div>
            
            {verificationDate && (
              <p className="text-xs text-gray-600 mt-1">
                Verificado em: {new Date(verificationDate).toLocaleString('pt-BR')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {isRequired && !localValue && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Número de telefone é obrigatório para integração com Meta API.
          </AlertDescription>
        </Alert>
      )}

      {integrationType === 'meta_api' && localValue && verificationStatus === 'failed' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            O número não foi verificado na Meta Business. Verifique se está correto e registrado.
          </AlertDescription>
        </Alert>
      )}


    </div>
  );
}; 