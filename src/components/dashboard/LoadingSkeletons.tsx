
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DashboardHeader } from './DashboardHeader';

export const LoadingSkeletons: React.FC = () => {
  return (
    <div className="space-y-6">
      <DashboardHeader onRefresh={() => {}} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
