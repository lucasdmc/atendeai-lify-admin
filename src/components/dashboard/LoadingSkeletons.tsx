
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DashboardHeader } from './DashboardHeader';

export const LoadingSkeletons: React.FC = () => {
  return (
    <div className="space-y-8">
      <DashboardHeader onRefresh={() => {}} />
      
      {/* Skeleton para as métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse border-2 border-gray-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-28"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton para o gráfico */}
      <Card className="animate-pulse border-2 border-gray-100">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-64"></div>
              <div className="h-3 bg-gray-200 rounded w-80"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-80 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-2 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
