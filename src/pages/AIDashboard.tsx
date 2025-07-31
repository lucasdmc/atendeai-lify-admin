// ========================================
// PÁGINA DE DASHBOARD AI
// ========================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AIChatComponent } from '../components/ai/AIChatComponent';
import { useToast } from '../hooks/use-toast';
import { useClinic } from '../contexts/ClinicContext';

interface AIStats {
  totalInteractions: number;
  averageConfidence: number;
  cacheHitRate: number;
  medicalValidations: number;
  emotionAnalysis: number;
  proactiveSuggestions: number;
  voiceInteractions: number;
  multimodalAnalysis: number;
}

const AIDashboard: React.FC = () => {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { selectedClinic } = useClinic();

  // Carregar estatísticas
  const loadStats = async () => {
    if (!selectedClinic?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai/stats?clinicId=${selectedClinic.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to load stats');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar estatísticas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar stats quando clínica mudar
  useEffect(() => {
    loadStats();
  }, [selectedClinic]);

  // Testar todas as APIs
  const testAllAPIs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/test-connection', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Teste Concluído',
          description: 'Todas as APIs AI estão funcionando corretamente.',
        });
      } else {
        toast({
          title: 'Erro nos Testes',
          description: 'Algumas APIs AI falharam no teste.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao testar APIs.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 Dashboard AI</h1>
          <p className="text-gray-600">
            Gerencie e monitore todas as funcionalidades de IA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={testAllAPIs}
            disabled={isLoading}
          >
            {isLoading ? 'Testando...' : 'Testar APIs'}
          </Button>
          <Button
            onClick={loadStats}
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Atualizar Stats'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Interações
              </CardTitle>
              <Badge variant="secondary">
                {stats.totalInteractions}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Todas as conversas com IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Confiança Média
              </CardTitle>
              <Badge variant="secondary">
                {Math.round(stats.averageConfidence * 100)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.averageConfidence * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Qualidade das respostas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cache Hit Rate
              </CardTitle>
              <Badge variant="secondary">
                {Math.round(stats.cacheHitRate * 100)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.cacheHitRate * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Respostas do cache
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Validações Médicas
              </CardTitle>
              <Badge variant="destructive">
                {stats.medicalValidations}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.medicalValidations}</div>
              <p className="text-xs text-muted-foreground">
                Conteúdo validado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">Chat AI</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chat AI em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <AIChatComponent
                userId="current-user-id"
                sessionId="dashboard-session"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Análise de Emoções</h3>
                  <p className="text-sm text-gray-600">
                    Total: {stats?.emotionAnalysis || 0}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Sugestões Proativas</h3>
                  <p className="text-sm text-gray-600">
                    Total: {stats?.proactiveSuggestions || 0}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Interações de Voz</h3>
                  <p className="text-sm text-gray-600">
                    Total: {stats?.voiceInteractions || 0}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Análise Multimodal</h3>
                  <p className="text-sm text-gray-600">
                    Total: {stats?.multimodalAnalysis || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">APIs Configuradas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">OpenAI</Badge>
                      <span className="text-sm">GPT-4o, Whisper, TTS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Anthropic</Badge>
                      <span className="text-sm">Claude 3.5 Sonnet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Google</Badge>
                      <span className="text-sm">Gemini Pro</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Funcionalidades Ativas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Validação Médica</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Ensemble de Modelos</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Cache Semântico</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Análise de Emoções</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Sugestões Proativas</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Processamento de Voz</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">✅ Análise Multimodal</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Logs detalhados das interações AI serão exibidos aqui...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDashboard; 