import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { Plus, Settings, Calendar, Users, Sparkles, TrendingUp } from 'lucide-react';
import NewAppointmentModal from './NewAppointmentModal';
import { GoogleCalendarEvent } from '@/types/calendar';

interface AgendamentosHeaderProps {
  isConnected: boolean;
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>;
  eventsCount?: number;
  calendarsCount?: number;
}

const AgendamentosHeader = ({ 
  isConnected, 
  onCreateEvent, 
  eventsCount = 0, 
  calendarsCount = 0 
}: AgendamentosHeaderProps) => {
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  return (
    <>
      <Card className="lify-gradient-primary border-0 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Informações principais */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-background/20 backdrop-blur-sm rounded-xl shadow-lg border border-background/30">
                <Calendar className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-primary-foreground mb-2 flex items-center gap-2">
                  Gestão de Agendamentos
                  <Sparkles className="h-6 w-6 text-accent" />
                </h1>
                <p className="text-primary-foreground/80 text-sm lg:text-base mb-3">
                  Gerencie seus eventos e mantenha sua agenda organizada
                </p>
                
                {/* Status e estatísticas */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <span className="text-primary-foreground/90 text-sm font-medium">
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{eventsCount} eventos</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{calendarsCount} calendários</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowNewEventModal(true)}
                className="bg-background/20 hover:bg-background/30 text-primary-foreground border border-background/30 backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Agendamento
              </Button>
              
              <Button
                variant="outline"
                className="bg-background/10 hover:bg-background/20 text-primary-foreground border-background/30 backdrop-blur-sm shadow-lg transition-all duration-200"
                size="lg"
              >
                <Settings className="h-5 w-5 mr-2" />
                Configurações
              </Button>
            </div>
          </div>

          {/* Indicadores de performance */}
          <div className="mt-6 pt-6 border-t border-background/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-background/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-300" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Eventos Hoje</p>
                    <p className="text-primary-foreground text-xl font-bold">
                      {eventsCount > 0 ? Math.min(eventsCount, 5) : 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-background/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Esta Semana</p>
                    <p className="text-primary-foreground text-xl font-bold">
                      {eventsCount > 0 ? Math.min(eventsCount * 2, 12) : 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background/10 backdrop-blur-sm rounded-lg p-4 border border-background/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-primary-foreground/80 text-sm">Calendários Ativos</p>
                    <p className="text-primary-foreground text-xl font-bold">{calendarsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <NewAppointmentModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onCreateEvent={onCreateEvent}
      />
    </>
  );
};

export default AgendamentosHeader;
