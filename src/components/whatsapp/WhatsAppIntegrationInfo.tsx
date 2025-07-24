import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, QrCode, Zap } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';

export const WhatsAppIntegrationInfo = () => {
  const { selectedClinic } = useClinic();

  if (!selectedClinic) {
    return null;
  }

  const integrationType = selectedClinic.whatsapp_integration_type || 'baileys';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Integração WhatsApp
        </CardTitle>
        <CardDescription>
          Configuração atual da integração WhatsApp para esta clínica
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Clínica:</span>
            <span className="text-sm text-gray-600">{selectedClinic.name}</span>
          </div>
          <Badge 
            variant={integrationType === 'meta_api' ? 'default' : 'secondary'}
            className={integrationType === 'meta_api' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
          >
            {integrationType === 'meta_api' ? 'Meta API' : 'Baileys'}
          </Badge>
        </div>

        <div className="space-y-2">
          {integrationType === 'meta_api' ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    API Oficial da Meta (WhatsApp Business)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Esta clínica está configurada para usar a API oficial da Meta. 
                    A conexão é gerenciada automaticamente e não requer QR Code.
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    O menu "Conectar WhatsApp" foi desabilitado pois não é necessário.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <QrCode className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    WhatsApp Web (Baileys)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Esta clínica está configurada para usar WhatsApp Web via Baileys. 
                    É necessário escanear um QR Code para conectar.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Use o menu "Conectar WhatsApp" para gerar o QR Code.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>
            <strong>Status da conexão:</strong> {selectedClinic.whatsapp_connection_status || 'desconnected'}
          </p>
          {selectedClinic.whatsapp_last_connection && (
            <p>
              <strong>Última conexão:</strong> {new Date(selectedClinic.whatsapp_last_connection).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 