
import React from 'react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { TopicsChart } from '@/components/dashboard/TopicsChart';
import { LoadingSkeletons } from '@/components/dashboard/LoadingSkeletons';

const Dashboard = () => {
  const { metrics, topicsData, loading, refreshMetrics } = useDashboardMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeletons />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader onRefresh={refreshMetrics} />
        <MetricsCards metrics={metrics} />
        <TopicsChart topicsData={topicsData} />
      </div>
    </div>
  );
};

export default Dashboard;
