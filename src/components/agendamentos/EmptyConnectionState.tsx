
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, AlertCircle } from 'lucide-react';

interface EmptyConnectionStateProps {
  calendarId: string;
}

const EmptyConnectionState = ({ calendarId }: EmptyConnectionStateProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Service Account não configurada</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              A integração com Google Calendar via Service Account não está funcionando.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-yellow-800 mb-2">Possíveis problemas:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• As credenciais do Service Account não estão configuradas</li>
                <li>• A chave privada está incorreta ou corrompida</li>
                <li>• O Service Account não tem permissões no Google Calendar</li>
                <li>• O calendário não está compartilhado com o Service Account</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-blue-800 mb-2">Para corrigir:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Verifique se o GOOGLE_SERVICE_ACCOUNT_KEY está configurado</li>
                <li>2. Confirme se a chave JSON do Service Account está válida</li>
                <li>3. Compartilhe seu calendário com o email do Service Account</li>
                <li>4. Dê permissões de edição ao Service Account</li>
              </ol>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Calendário configurado: {calendarId}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyConnectionState;
