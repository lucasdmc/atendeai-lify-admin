import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useGoogleServiceAccount } from '@/hooks/useGoogleServiceAccount';
import { useClinic } from '@/contexts/ClinicContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { TopicsChart } from '@/components/dashboard/TopicsChart';
import { LoadingSkeletons } from '@/components/dashboard/LoadingSkeletons';
import AgendamentosStats from '@/components/agendamentos/AgendamentosStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, MapPin, Phone, Mail } from 'lucide-react';

const Dashboard = () => {
  const { metrics, topicsData, loading, refreshMetrics } = useDashboardMetrics();
  const { events } = useGoogleServiceAccount(false); // Não verificar automaticamente
  const { selectedClinic } = useClinic();

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
        
        {/* Informações da Clínica Selecionada */}
        {selectedClinic && (
          <Card className="bg-white shadow-sm border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-500" />
                Clínica Atual: {selectedClinic.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedClinic.address && typeof selectedClinic.address === 'object' && selectedClinic.address.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {selectedClinic.address.city}, {selectedClinic.address.state}
                    </span>
                  </div>
                )}
                {selectedClinic.phone && typeof selectedClinic.phone === 'object' && selectedClinic.phone.value && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{selectedClinic.phone.value}</span>
                  </div>
                )}
                {selectedClinic.email && typeof selectedClinic.email === 'object' && selectedClinic.email.value && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{selectedClinic.email.value}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
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
