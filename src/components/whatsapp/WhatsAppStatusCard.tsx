
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Phone, 
  Calendar,
  MessageSquare,
  Clock
} from 'lucide-react';

interface WhatsAppStatusCardProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'demo';
  clientInfo?: any;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

export const WhatsAppStatusCard = ({ 
  connectionStatus, 
  clientInfo, 
  onReconnect,
  onDisconnect 
}: WhatsAppStatusCardProps) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          title: "WhatsApp Conectado",
          description: "Sistema operacional e pronto para atendimento",
          badgeColor: "bg-green-100 text-green-800 border-green-200",
          badgeText: "Online",
          cardBorder: "border-green-200"
        };
      case 'connecting':
        return {
          icon: <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" />,
          title: "Conectando WhatsApp",
          description: "Aguardando autenticação via QR Code",
          badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
          badgeText: "Conectando",
          cardBorder: "border-yellow-200"
        };
      case 'demo':
        return {
          icon: <AlertCircle className="h-6 w-6 text-blue-600" />,
          title: "Modo Demonstração",
          description: "WhatsApp em modo de teste - configure servidor para uso real",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          badgeText: "Demo",
          cardBorder: "border-blue-200"
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          title: "WhatsApp Desconectado",
          description: "Sistema offline - conecte seu WhatsApp Business",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          badgeText: "Offline",
          cardBorder: "border-red-200"
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card className={`${statusConfig.cardBorder} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <CardTitle className="text-lg">{statusConfig.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{statusConfig.description}</p>
            </div>
          </div>
          <Badge className={statusConfig.badgeColor}>
            {statusConfig.badgeText}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connectionStatus === 'connected' && clientInfo && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Número</p>
                  <p className="text-sm font-medium">{clientInfo.number || 'Não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Conectado em</p>
                  <p className="text-sm font-medium">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <MessageSquare className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Mensagens</p>
                <p className="text-lg font-bold text-green-600">24/7</p>
              </div>
              <div>
                <Calendar className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Agendamentos</p>
                <p className="text-lg font-bold text-blue-600">Ativo</p>
              </div>
              <div>
                <CheckCircle className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <p className="text-xs text-gray-500">IA Assistente</p>
                <p className="text-lg font-bold text-orange-600">Online</p>
              </div>
            </div>

            <Separator />
          </>
        )}

        <div className="flex gap-2">
          {connectionStatus === 'connected' && onDisconnect && (
            <Button 
              variant="outline" 
              onClick={onDisconnect}
              className="flex-1"
            >
              Desconectar
            </Button>
          )}
          
          {(connectionStatus === 'disconnected' || connectionStatus === 'demo') && onReconnect && (
            <Button 
              onClick={onReconnect}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {connectionStatus === 'demo' ? 'Configurar WhatsApp Real' : 'Conectar WhatsApp'}
            </Button>
          )}
        </div>

        {connectionStatus === 'demo' && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
            💡 Em modo demo, as mensagens são simuladas. Configure WHATSAPP_SERVER_URL para usar o WhatsApp real.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
