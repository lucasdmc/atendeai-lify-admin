
import React from 'react';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { TopicsChart } from '@/components/dashboard/TopicsChart';
import { LoadingSkeletons } from '@/components/dashboard/LoadingSkeletons';

const Dashboard = () => {
  const { metrics, topicsData, loading, refreshMetrics } = useDashboardMetrics();

  if (loading) {
    return <LoadingSkeletons />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader onRefresh={refreshMetrics} />
      <MetricsCards metrics={metrics} />
      <TopicsChart topicsData={topicsData} />
    </div>
  );
};

export default Dashboard;
