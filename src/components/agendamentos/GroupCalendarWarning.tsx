import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

interface GroupCalendarWarningProps {
  calendarId: string;
  error?: string;
}

export const GroupCalendarWarning: React.FC<GroupCalendarWarningProps> = ({ 
  calendarId, 
  error 
}) => {
  if (!calendarId.includes('@group.calendar.google.com')) {
    return null;
  }

  const calendarName = calendarId.split('@')[0];

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Calendário de Grupo Detectado</AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="space-y-2">
          <p>
            O calendário <strong>{calendarName}</strong> é um calendário de grupo do Google Calendar.
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 font-medium">Erro específico:</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800 text-sm">
                <p className="font-medium mb-1">Possíveis soluções:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verifique se você tem permissão de "Ver eventos" no calendário</li>
                  <li>Tente reconectar o calendário através do botão "Reconectar"</li>
                  <li>Considere usar um calendário pessoal em vez de um de grupo</li>
                  <li>Peça ao administrador do grupo para verificar suas permissões</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}; 