
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface EmptyStateProps {
  searchTerm: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchTerm }) => {
  return (
    <div className="text-center py-8">
      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">
        {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
      </p>
    </div>
  );
};

export default EmptyState;
