
import React from 'react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { TopicsChart } from '@/components/dashboard/TopicsChart';
import { LoadingSkeletons } from '@/components/dashboard/LoadingSkeletons';
import AgendamentosStats from '@/components/agendamentos/AgendamentosStats';

const Dashboard = () => {
  const { metrics, topicsData, loading, refreshMetrics } = useDashboardMetrics();
  const { events } = useGoogleServiceAccount();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeletons />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader onRefresh={refreshMetrics} />
        <MetricsCards metrics={metrics} />
        
        {/* Estatísticas dos Agendamentos */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas de Agendamentos</h2>
          <AgendamentosStats events={events} />
        </div>
        
        <TopicsChart topicsData={topicsData} />
      </div>
    </div>
  );
};

export default Dashboard;
