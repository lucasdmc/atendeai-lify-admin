
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Save, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClinicHours {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  break_start_time: string | null;
  break_end_time: string | null;
  is_active: boolean;
}

interface AvailabilityException {
  id: string;
  exception_date: string;
  is_closed: boolean;
  custom_start_time: string | null;
  custom_end_time: string | null;
  reason: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export default function ClinicAvailabilitySettings() {
  const [clinicHours, setClinicHours] = useState<ClinicHours[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailabilityData();
  }, []);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);

      // Buscar horários da clínica
      const { data: hoursData, error: hoursError } = await supabase
        .from('clinic_availability')
        .select('*')
        .order('day_of_week');

      if (hoursError) throw hoursError;

      // Buscar exceções
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('clinic_availability_exceptions')
        .select('*')
        .order('exception_date');

      if (exceptionsError) throw exceptionsError;

      setClinicHours(hoursData || []);
      setExceptions(exceptionsData || []);
    } catch (error) {
      console.error('Erro ao buscar dados de disponibilidade:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações de disponibilidade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveClinicHours = async () => {
    try {
      setSaving(true);

      // Atualizar horários existentes
      for (const hours of clinicHours) {
        if (hours.id) {
          const { error } = await supabase
            .from('clinic_availability')
            .update({
              start_time: hours.start_time,
              end_time: hours.end_time,
              slot_duration_minutes: hours.slot_duration_minutes,
              break_start_time: hours.break_start_time,
              break_end_time: hours.break_end_time,
              is_active: hours.is_active
            })
            .eq('id', hours.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: "Configurações de horário salvas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateClinicHours = (dayOfWeek: number, field: string, value: any) => {
    setClinicHours(prev => 
      prev.map(hours => 
        hours.day_of_week === dayOfWeek 
          ? { ...hours, [field]: value }
          : hours
      )
    );
  };

  const addException = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('clinic_availability_exceptions')
        .insert({
          exception_date: today,
          is_closed: true,
          reason: 'Feriado'
        })
        .select()
        .single();

      if (error) throw error;

      setExceptions(prev => [...prev, data]);
      
      toast({
        title: "Sucesso",
        description: "Exceção adicionada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar exceção:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar exceção",
        variant: "destructive",
      });
    }
  };

  const removeException = async (exceptionId: string) => {
    try {
      const { error } = await supabase
        .from('clinic_availability_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) throw error;

      setExceptions(prev => prev.filter(exc => exc.id !== exceptionId));
      
      toast({
        title: "Sucesso",
        description: "Exceção removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover exceção:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover exceção",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Horários de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horários de Funcionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS_OF_WEEK.map(day => {
            const dayHours = clinicHours.find(h => h.day_of_week === day.value);
            if (!dayHours) return null;

            return (
              <div key={day.value} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={dayHours.is_active}
                    onCheckedChange={(checked) => 
                      updateClinicHours(day.value, 'is_active', checked)
                    }
                  />
                  <Label className="font-medium">{day.label}</Label>
                </div>

                {dayHours.is_active && (
                  <>
                    <div>
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="time"
                        value={dayHours.start_time}
                        onChange={(e) => 
                          updateClinicHours(day.value, 'start_time', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="time"
                        value={dayHours.end_time}
                        onChange={(e) => 
                          updateClinicHours(day.value, 'end_time', e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Pausa Início</Label>
                      <Input
                        type="time"
                        value={dayHours.break_start_time || ''}
                        onChange={(e) => 
                          updateClinicHours(day.value, 'break_start_time', e.target.value || null)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Pausa Fim</Label>
                      <Input
                        type="time"
                        value={dayHours.break_end_time || ''}
                        onChange={(e) => 
                          updateClinicHours(day.value, 'break_end_time', e.target.value || null)
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Duração Slot (min)</Label>
                      <Input
                        type="number"
                        value={dayHours.slot_duration_minutes}
                        onChange={(e) => 
                          updateClinicHours(day.value, 'slot_duration_minutes', parseInt(e.target.value))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}

          <Button onClick={saveClinicHours} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </CardContent>
      </Card>

      {/* Exceções de Horário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exceções de Horário
            <Button size="sm" onClick={addException} className="ml-auto">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma exceção cadastrada
            </p>
          ) : (
            <div className="space-y-4">
              {exceptions.map(exception => (
                <div key={exception.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(exception.exception_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-600">
                      {exception.reason}
                    </div>
                    <Badge variant={exception.is_closed ? "destructive" : "secondary"}>
                      {exception.is_closed ? 'Fechado' : 'Horário especial'}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeException(exception.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
