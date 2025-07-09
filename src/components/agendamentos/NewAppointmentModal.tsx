
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { AppointmentLabel, getLabelConfig } from '@/utils/appointmentLabels';
import LabelSelector from './LabelSelector';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>;
}

interface FormData {
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  attendeeEmail: string;
  label: AppointmentLabel;
}

const NewAppointmentModal = ({ isOpen, onClose, onCreateEvent }: NewAppointmentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      attendeeEmail: '',
      label: 'consulta',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const startDateTime = new Date(data.date);
      const [startHour, startMinute] = data.startTime.split(':');
      startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endDateTime = new Date(data.date);
      const [endHour, endMinute] = data.endTime.split(':');
      endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

      const labelConfig = getLabelConfig(data.label);
      
      const eventData: Omit<GoogleCalendarEvent, 'id' | 'status'> = {
        summary: data.title,
        description: `${data.description}\n[LABEL:${data.label}]`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        location: data.location,
        attendees: data.attendeeEmail ? [{ email: data.attendeeEmail, displayName: '', responseStatus: 'needsAction' }] : [],
        colorId: labelConfig.googleCalendarColorId,
      };

      const createdEvent = await onCreateEvent(eventData);
      console.log('Event created successfully:', createdEvent);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Crie um novo agendamento que será sincronizado com o Google Calendar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <LabelSelector control={form.control} name="label" />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Consulta médica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
              rules={{ required: 'Título é obrigatório' }}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes do agendamento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Início *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fim *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço ou sala virtual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attendeeEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email do Participante</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="paciente@email.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email para enviar convite do agendamento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Agendamento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewAppointmentModal;
