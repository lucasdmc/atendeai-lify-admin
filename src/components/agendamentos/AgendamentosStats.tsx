
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
    <div className="flex gap-6 items-start">
      {/* KPIs em formato retangular compacto */}
      <div className="grid grid-cols-2 gap-2">
        {statsCards.map((stat, index) => (
          <div key={index} className="scale-[0.5] origin-top-left">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Gráfico à direita */}
      <div className="scale-[0.4] origin-top-left">
        <AppointmentsPieChart data={pieChartData} />
      </div>
    </div>
  );
};

export default AgendamentosStats;
