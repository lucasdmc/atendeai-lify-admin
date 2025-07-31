import React, { useState } from 'react';
import { AIOrchestrator } from '../../services/ai';

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
      // Teste 1: Conectividade
      try {
        const connectivity = await AIOrchestrator.testConnectivity();
        newResults.push({
          success: connectivity.summary.percentage > 50,
          message: `Conectividade: ${connectivity.summary.percentage}% dos serviços funcionando`,
          data: connectivity
        });
      } catch (error) {
        newResults.push({
          success: false,
          message: 'Erro no teste de conectividade',
          data: error
        });
      }

      // Teste 2: Processamento básico
      if (testMessage) {
        try {
          const response = await AIOrchestrator.processRequest({
            message: testMessage,
            clinicId: 'test-clinic',
            userId: 'test-user',
            options: {
              enableMedicalValidation: true,
              enableEmotionAnalysis: true,
              enableCache: true
            }
          });

          newResults.push({
            success: true,
            message: `Processamento bem-sucedido: "${response.response}"`,
            data: response
          });
        } catch (error) {
          newResults.push({
            success: false,
            message: 'Erro no processamento da mensagem',
            data: error
          });
        }
      }

      // Teste 3: Estatísticas
      try {
        const stats = await AIOrchestrator.getAllStats();
        newResults.push({
          success: true,
          message: 'Estatísticas obtidas com sucesso',
          data: stats
        });
      } catch (error) {
        newResults.push({
          success: false,
          message: 'Erro ao obter estatísticas',
          data: error
        });
      }

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
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🧪 Teste dos Serviços AI</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Mensagem para Teste:
        </label>
        <textarea
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Digite uma mensagem para testar os serviços AI..."
          className="w-full p-3 border border-gray-300 rounded-md"
          rows={3}
        />
      </div>

      <button
        onClick={runTests}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? 'Executando Testes...' : 'Executar Testes'}
      </button>

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
          <li>✅ Banco de dados configurado</li>
          <li>✅ Tabelas AI criadas</li>
          <li>✅ Funções SQL implementadas</li>
          <li>✅ Serviços TypeScript criados</li>
          <li>🔄 Integração com APIs (pendente)</li>
          <li>🔄 Frontend conectado (pendente)</li>
        </ul>
      </div>
    </div>
  );
};

export default AITestComponent; 