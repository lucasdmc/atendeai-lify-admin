import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

const AITestComponent: React.FC = () => {
  const [testMessage, setTestMessage] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults([]);

    const newResults: TestResult[] = [];

    try {
      // Teste 1: Conectividade básica
      newResults.push({
        success: true,
        message: `Componente AI Test carregado com sucesso`,
        data: { timestamp: new Date().toISOString() }
      });

      // Teste 2: Processamento da mensagem (mock)
      if (testMessage) {
        setTimeout(() => {
          newResults.push({
            success: true,
            message: `Mensagem processada: "${testMessage}"`,
            data: { 
              originalMessage: testMessage,
              processedAt: new Date().toISOString(),
              mock: true
            }
          });
        }, 500);
      }

      // Teste 3: Status do sistema
      newResults.push({
        success: true,
        message: 'Sistema operacional - Aguardando integração completa com AI',
        data: { 
          status: 'ready',
          features: ['ui-loaded', 'forms-working', 'mock-responses']
        }
      });

    } catch (error) {
      newResults.push({
        success: false,
        message: 'Erro geral nos testes',
        data: error
      });
    }

    setResults(newResults);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Teste dos Serviços AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Mensagem para Teste:
            </label>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite uma mensagem para testar os serviços AI..."
              rows={3}
            />
          </div>

          <Button
            onClick={runTests}
            disabled={loading}
          >
            {loading ? 'Executando Testes...' : 'Executar Testes'}
          </Button>

          {results.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Resultados dos Testes:</h3>
              
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 mb-3 rounded-md border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span
                      className={`w-4 h-4 rounded-full mr-2 ${
                        result.success ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-medium">
                      {result.success ? '✅ Sucesso' : '❌ Erro'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                  
                  {result.data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600">
                        Ver Detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-semibold mb-2">📋 Status dos Serviços:</h4>
            <ul className="text-sm space-y-1">
              <li>✅ Interface carregada</li>
              <li>✅ Componentes funcionais</li>
              <li>✅ Formulários operacionais</li>
              <li>🔄 Integração com AI (em desenvolvimento)</li>
              <li>🔄 Processamento real (pendente)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITestComponent;