
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';

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
                {isConnected ? `Conectado ao calendário: ${calendarId}` : 'Não conectado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && <CheckCircle className="h-5 w-5 text-green-500" />}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusCard;
