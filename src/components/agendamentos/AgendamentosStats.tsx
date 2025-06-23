
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
    <div className="space-y-4">
      {/* KPIs Compactos */}
      <div className="grid grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="scale-75 origin-top">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Gráfico reduzido */}
      <div className="scale-75 origin-top">
        <AppointmentsPieChart data={pieChartData} />
      </div>
    </div>
  );
};

export default AgendamentosStats;
