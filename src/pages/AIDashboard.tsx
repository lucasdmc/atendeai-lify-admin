// ========================================
// PÁGINA DE SIMULADOR DE ATENDIMENTO
// ========================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AIChatComponent } from '../components/ai/AIChatComponent';

const AIDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎭 Simulador de Atendimento</h1>
          <p className="text-gray-600">
            Teste as respostas do chatbot antes de ativar o atendimento real
          </p>
        </div>
      </div>

      {/* Simulação de Conversas */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas em Modo Simulação</CardTitle>
        </CardHeader>
        <CardContent>
          <AIChatComponent
            userId="current-user-id"
            sessionId="simulator-session"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDashboard; 