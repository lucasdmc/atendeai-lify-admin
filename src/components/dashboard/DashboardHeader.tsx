
import React from 'react';

interface DashboardHeaderProps {
  onRefresh: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh }) => {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
        Dashboard
      </h1>
      <button 
        onClick={onRefresh}
        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
      >
        Atualizar Métricas
      </button>
    </div>
  );
};
