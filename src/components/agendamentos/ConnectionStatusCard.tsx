
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ConnectionStatusCardProps {
  isConnected: boolean;
  calendarId: string;
}

const ConnectionStatusCard = ({ isConnected, calendarId }: ConnectionStatusCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-semibold">Google Calendar - Service Account</h3>
              <p className="text-sm text-gray-600">
                {isConnected 
                  ? `Conectado ao calendário: ${calendarId}` 
                  : 'Não conectado - verifique as configurações'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
        
        {!isConnected && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Dica:</p>
                <p>
                  Certifique-se de que o Service Account está configurado corretamente e que 
                  o calendário está compartilhado com o email do Service Account com permissões de edição.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusCard;
