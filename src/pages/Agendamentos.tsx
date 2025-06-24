import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, CheckCircle2, Clock, Google, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/integrations/supabase/client';
import GoogleCalendarEmbed from '@/components/agendamentos/GoogleCalendarEmbed';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import ClinicAvailabilitySettings from '@/components/agendamentos/ClinicAvailabilitySettings';

interface Appointment {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
}

interface Stats {
  totalAppointments: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
}

const AgendamentosHeader = () => (
  <div className="flex items-center justify-between">
    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
      Gerenciamento de Agendamentos
    </h1>
    <Button>
      <CalendarIcon className="mr-2 h-4 w-4" />
      Agendar Consulta
    </Button>
  </div>
);

const ConnectionStatusCard = () => {
  const { connectionStatus, qrCode, isLoading, generateQRCode, disconnect } = useWhatsAppConnection();
  const { toast } = useToast();

  const handleGenerateQRCode = async () => {
    try {
      await generateQRCode();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao gerar QR Code: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Falha ao desconectar: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Status da Conexão WhatsApp
        </CardTitle>
        <CardDescription>
          Gerencie a conexão com o WhatsApp Business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus === 'disconnected' && (
          <>
            <p className="text-gray-500">
              WhatsApp Business não está conectado.
            </p>
            <Button onClick={handleGenerateQRCode} disabled={isLoading}>
              {isLoading ? "Carregando..." : "Conectar WhatsApp"}
            </Button>
          </>
        )}

        {connectionStatus === 'connecting' && (
          <>
            <p className="text-gray-500">
              Conectando ao WhatsApp Business...
            </p>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code" className="max-w-xs" />
              </div>
            )}
            <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
              {isLoading ? "Desconectando..." : "Cancelar Conexão"}
            </Button>
          </>
        )}

        {connectionStatus === 'connected' && (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-500 h-5 w-5" />
              <p className="text-green-500 font-semibold">
                WhatsApp Business conectado!
              </p>
            </div>
            <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
              {isLoading ? "Desconectando..." : "Desconectar WhatsApp"}
            </Button>
          </>
        )}

        {connectionStatus === 'demo' && (
          <div className="text-yellow-500">
            <p>
              ⚠️ Modo Demonstração Ativo ⚠️
            </p>
            <p>
              O WhatsApp está em modo demonstração. Configure um servidor para uso real.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const EmptyConnectionState = () => (
  <Card>
    <CardContent className="text-center py-12">
      <p className="text-gray-500">
        Conecte o WhatsApp Business para gerenciar seus agendamentos.
      </p>
    </CardContent>
  </Card>
);

const AgendamentosStats = ({ stats, loading }: { stats: Stats; loading: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Total de Agendamentos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-6 bg-gray-100 rounded animate-pulse" /> : <div className="text-2xl font-bold">{stats.totalAppointments}</div>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-6 bg-gray-100 rounded animate-pulse" /> : <div className="text-2xl font-bold">{stats.todayAppointments}</div>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos Pendentes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-6 bg-gray-100 rounded animate-pulse" /> : <div className="text-2xl font-bold">{stats.pendingAppointments}</div>}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Agendamentos Concluídos</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-6 bg-gray-100 rounded animate-pulse" /> : <div className="text-2xl font-bold">{stats.completedAppointments}</div>}
      </CardContent>
    </Card>
  </div>
);

const AppointmentsPieChart = ({ data, loading }: { data: Stats; loading: boolean }) => (
  <Card>
    <CardHeader>
      <CardTitle>Status dos Agendamentos</CardTitle>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      ) : (
        <div className="text-center text-gray-500">
          Gráfico em desenvolvimento
        </div>
      )}
    </CardContent>
  </Card>
);

const UpcomingAppointments = ({ appointments }: { appointments: Appointment[] }) => {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos Agendamentos</CardTitle>
        <CardDescription>
          Visualize e gerencie seus próximos agendamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 grid-cols-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolher Data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) =>
                date < new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="relative overflow-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Título</th>
                <th className="py-2 text-left">Horário</th>
                <th className="py-2 text-left">Local</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b">
                  <td className="py-2">{appointment.title}</td>
                  <td className="py-2">{appointment.start_time}</td>
                  <td className="py-2">{appointment.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

const Agendamentos = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const { connectionStatus } = useWhatsAppConnection();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for appointments
      const mockAppointments: Appointment[] = [
        {
          id: "1",
          title: "Consulta com Cardiologista",
          description: "Consulta de rotina",
          start_time: "10:00",
          end_time: "11:00",
          location: "Clínica Central",
        },
        {
          id: "2",
          title: "Sessão de Fisioterapia",
          description: "Reabilitação",
          start_time: "14:00",
          end_time: "15:00",
          location: "Clínica de Fisioterapia",
        },
      ];
      setAppointments(mockAppointments);

      // Mock data for stats
      const mockStats: Stats = {
        totalAppointments: 50,
        todayAppointments: 5,
        pendingAppointments: 10,
        completedAppointments: 40,
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header e Status */}
      <AgendamentosHeader />
      <ConnectionStatusCard />
      
      {connectionStatus === 'disconnected' ? (
        <EmptyConnectionState />
      ) : (
        <>
          {/* Stats Cards */}
          <AgendamentosStats stats={stats} loading={loading} />
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentsPieChart data={stats} loading={loading} />
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500">
                  Gráfico em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming Appointments */}
          <UpcomingAppointments appointments={appointments} />
          
          {/* Google Calendar */}
          <GoogleCalendarEmbed />
          
          {/* Configurações de Disponibilidade */}
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Configurações de Disponibilidade - WhatsApp</CardTitle>
              <CardDescription>
                Configure os horários de funcionamento para agendamentos via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicAvailabilitySettings />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Agendamentos;
