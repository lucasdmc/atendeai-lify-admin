
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, BarChart } from 'lucide-react';
import { useLoopAnalytics } from '@/hooks/useLoopAnalytics';

export default function LoopAnalyticsCard() {
  const { analytics, loading } = useLoopAnalytics();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Anti-Loop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Análise Anti-Loop (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {analytics.totalLoopsDetected}
              </div>
              <div className="text-sm text-red-600 flex items-center justify-center gap-1">
                <BarChart className="h-4 w-4" />
                Loops Detectados
              </div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.conversationsEscalated}
              </div>
              <div className="text-sm text-orange-600 flex items-center justify-center gap-1">
                <Users className="h-4 w-4" />
                Escalações
              </div>
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {analytics.averageLoopsBeforeEscalation}
            </div>
            <div className="text-sm text-blue-600 flex items-center justify-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Média de Loops antes da Escalação
            </div>
          </div>

          {analytics.loopEventsByDay.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Últimos eventos:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {analytics.loopEventsByDay.slice(-5).map((day) => (
                  <div key={day.date} className="flex justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span>{new Date(day.date).toLocaleDateString('pt-BR')}</span>
                    <div className="flex gap-2">
                      <span className="text-red-600">{day.loops} loops</span>
                      <span className="text-orange-600">{day.escalations} escalações</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
