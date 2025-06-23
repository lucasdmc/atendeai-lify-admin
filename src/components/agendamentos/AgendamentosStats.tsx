
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
    <div className="space-y-3">
      {/* KPIs Compactos */}
      <div className="grid grid-cols-4 gap-3">
        {statsCards.map((stat, index) => (
          <div key={index} className="scale-[0.6] origin-top">
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Gráfico bem reduzido */}
      <div className="scale-50 origin-top -mt-8">
        <AppointmentsPieChart data={pieChartData} />
      </div>
    </div>
  );
};

export default AgendamentosStats;
