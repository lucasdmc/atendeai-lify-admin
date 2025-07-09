import { useState, useEffect } from 'react';
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
import { CalendarIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AppointmentLabel, getLabelConfig, getLabelFromString } from '@/utils/appointmentLabels';
import LabelSelector from './LabelSelector';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: GoogleCalendarEvent | null;
  onUpdateEvent: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
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

const EditAppointmentModal = ({ 
  isOpen, 
  onClose, 
  event, 
  onUpdateEvent, 
  onDeleteEvent 
}: EditAppointmentModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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

  useEffect(() => {
    if (event && isOpen) {
      const startDate = new Date(event.start.dateTime);
      const endDate = new Date(event.end.dateTime);
      
      // Extrair label da descrição
      let description = event.description || '';
      let label: AppointmentLabel = 'consulta';
      
      const labelMatch = description.match(/\[LABEL:(\w+)\]/);
      if (labelMatch) {
        label = getLabelFromString(labelMatch[1]);
        description = description.replace(/\[LABEL:\w+\]/, '').trim();
      }
      
      form.reset({
        title: event.summary || '',
        description,
        date: startDate,
        startTime: format(startDate, 'HH:mm'),
        endTime: format(endDate, 'HH:mm'),
        location: event.location || '',
        attendeeEmail: event.attendees?.[0]?.email || '',
        label,
      });
    }
  }, [event, isOpen, form]);

  const onSubmit = async (data: FormData) => {
    if (!event) return;
    
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

      await onUpdateEvent(event.id, eventData);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    setIsLoading(true);
    try {
      await onDeleteEvent(event.id);
      setShowDeleteDialog(false);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Agendamento</DialogTitle>
            <DialogDescription>
              Edite os detalhes do agendamento. As alterações serão sincronizadas com o Google Calendar.
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

              <DialogFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita
              e o evento será removido do Google Calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditAppointmentModal;
