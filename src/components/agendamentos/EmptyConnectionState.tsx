
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface EmptyConnectionStateProps {
  calendarId: string;
}

const EmptyConnectionState = ({ calendarId }: EmptyConnectionStateProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Service Account não configurada</h3>
          <p className="text-gray-600 mb-6">
            A integração com Google Calendar via Service Account não está funcionando.
            Verifique se as credenciais estão corretas e se o calendário está acessível.
          </p>
          <p className="text-sm text-gray-500">
            Calendário configurado: {calendarId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyConnectionState;
