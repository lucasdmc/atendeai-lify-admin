
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { useAgendamentosStats } from '@/hooks/useAgendamentosStats';
import StatsCard from './StatsCard';
import AppointmentsPieChart from './AppointmentsPieChart';

interface AgendamentosStatsProps {
  events: GoogleCalendarEvent[];
}

const AgendamentosStats = ({ events }: AgendamentosStatsProps) => {
  const { statsCards, pieChartData } = useAgendamentosStats(events);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* KPIs em formato retangular compacto */}
      <div className="grid grid-cols-2 gap-4 flex-shrink-0">
        {statsCards.map((stat, index) => (
          <div key={index} className="w-64 h-32">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Gráfico à direita com tamanho controlado */}
      <div className="w-full max-w-sm lg:max-w-xs xl:max-w-sm">
        <AppointmentsPieChart data={pieChartData} />
      </div>
    </div>
  );
};

export default AgendamentosStats;
