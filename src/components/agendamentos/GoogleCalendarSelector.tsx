import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, CheckCircle, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinic } from '@/contexts/ClinicContext';
import apiClient from '@/services/apiClient';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

interface GoogleCalendarSelectorProps {
  calendars: GoogleCalendar[];
  onCalendarsSelected: () => void;
  onCancel: () => void;
}

export const GoogleCalendarSelector = ({ 
  calendars, 
  onCalendarsSelected, 
  onCancel 
}: GoogleCalendarSelectorProps) => {
  const { toast } = useToast();
  const { selectedClinicId } = useClinic();
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars(prev => 
      prev.includes(calendarId)
        ? prev.filter(id => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  const handleConnectCalendars = async () => {
    if (selectedCalendars.length === 0) {
      toast({
        title: 'Seleção necessária',
        description: 'Selecione pelo menos um calendário para conectar.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedClinicId) {
      toast({ title: 'Erro', description: 'Selecione uma clínica antes de associar calendários.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const resp = await apiClient.post('/api/google/calendars/associate', {
        clinicId: selectedClinicId,
        calendarIds: selectedCalendars,
      });
      if (!resp.success) {
        throw new Error(resp.error || 'Falha ao associar calendários');
      }

      toast({
        title: 'Sucesso!',
        description: `${selectedCalendars.length} calendário(s) conectado(s) com sucesso.`,
      });

      onCalendarsSelected();
    } catch (error) {
      console.error('Error connecting calendars:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao conectar calendários. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Selecione os Calendários
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Escolha quais calendários do Google você deseja conectar ao sistema.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {calendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={calendar.id}
                checked={selectedCalendars.includes(calendar.id)}
                onCheckedChange={() => handleCalendarToggle(calendar.id)}
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={calendar.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {calendar.summary}
                </label>
                {calendar.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {calendar.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {calendar.primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCalendars.length} de {calendars.length} calendário(s) selecionado(s)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleConnectCalendars}
              disabled={isLoading || selectedCalendars.length === 0}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Conectar {selectedCalendars.length} Calendário(s)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 