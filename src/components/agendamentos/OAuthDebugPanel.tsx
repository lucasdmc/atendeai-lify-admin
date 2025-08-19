import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Info, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Copy 
} from 'lucide-react';
import { validateOAuthConfig } from '@/config/environment';
import { config } from '@/config/frontend-config';

interface OAuthDebugInfo {
  currentUrl: string;
  redirectUri: string;
  environment: string;
  clientId: string;
  isProduction: boolean;
  configValidation: {
    valid: boolean;
    issues: string[];
  };
}

const OAuthDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<OAuthDebugInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const gatherDebugInfo = () => {
      const validation = validateOAuthConfig();
      
      const info: OAuthDebugInfo = {
        currentUrl: window.location.origin,
        redirectUri: config.urls.redirectUri,
        environment: config.backend.url.includes('railway') ? 'production' : 'development',
        clientId: config.google.clientId,
        isProduction: window.location.hostname === 'atendeai.lify.com.br',
        configValidation: validation
      };
      
      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testEdgeFunction = async () => {
    try {
      const response = await fetch(`${config.supabase.url}/functions/v1/google-user-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`
        },
        body: JSON.stringify({
          code: 'test-code',
          redirectUri: config.urls.redirectUri
        })
      });
      
      const data = await response.json();
      alert(`Edge Function Response: ${response.status}\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Edge Function Error: ${error}`);
    }
  };

  if (!debugInfo) {
    return <div>Carregando informações de debug...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          OAuth Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <Alert className={debugInfo.configValidation.valid ? "border-green-500" : "border-red-500"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              {debugInfo.configValidation.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span>
                Configuração OAuth: {debugInfo.configValidation.valid ? 'VÁLIDA' : 'INVÁLIDA'}
              </span>
            </div>
            {!debugInfo.configValidation.valid && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {debugInfo.configValidation.issues.map((issue, index) => (
                  <li key={index} className="text-red-600">{issue}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>

        {/* Informações de Ambiente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Ambiente</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>URL Atual:</span>
                <Badge variant={debugInfo.isProduction ? "default" : "secondary"}>
                  {debugInfo.currentUrl}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Ambiente:</span>
                <Badge variant={debugInfo.isProduction ? "default" : "outline"}>
                  {debugInfo.isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">OAuth Config</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Redirect URI:</span>
                <div className="flex items-center gap-1">
                  <Badge 
                    variant={
                      debugInfo.redirectUri.includes('atendeai.lify.com.br') && debugInfo.isProduction 
                        ? "default" 
                        : debugInfo.redirectUri.includes('localhost') && !debugInfo.isProduction
                        ? "secondary"
                        : "destructive"
                    }
                    className="text-xs max-w-xs truncate"
                  >
                    {debugInfo.redirectUri}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(debugInfo.redirectUri)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Client ID:</span>
                <Badge variant="outline" className="text-xs max-w-xs truncate">
                  {debugInfo.clientId.substring(0, 20)}...
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* URLs Esperadas */}
        <div>
          <h4 className="font-semibold mb-2">URLs Esperadas no Google Cloud Console</h4>
          <div className="bg-gray-50 p-3 rounded-md space-y-1">
            <div className="flex items-center justify-between">
              <code className="text-sm">https://atendeai.lify.com.br/agendamentos</code>
              <Badge variant={debugInfo.isProduction ? "default" : "outline"}>
                {debugInfo.isProduction ? 'ATUAL' : 'PRODUÇÃO'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm">http://localhost:8080/agendamentos</code>
              <Badge variant={!debugInfo.isProduction ? "default" : "outline"}>
                {!debugInfo.isProduction ? 'ATUAL' : 'DESENVOLVIMENTO'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ações de Teste */}
        <div className="flex gap-2">
          <Button
            onClick={testEdgeFunction}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Testar Edge Function
          </Button>
          
          <Button
            onClick={() => window.open('https://console.cloud.google.com', '_blank')}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Google Cloud Console
          </Button>
        </div>

        {copied && (
          <Alert className="border-green-500">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              URL copiada para a área de transferência!
            </AlertDescription>
          </Alert>
        )}

        {/* Instruções Rápidas */}
        {!debugInfo.configValidation.valid && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Para corrigir:</strong>
              <ol className="mt-2 list-decimal list-inside text-sm space-y-1">
                <li>Acesse o Google Cloud Console</li>
                <li>Vá para APIs & Services → Credentials</li>
                <li>Edite o OAuth 2.0 Client ID</li>
                <li>Adicione a URL: <code>{debugInfo.redirectUri}</code></li>
                <li>Configure o Client Secret no Supabase</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OAuthDebugPanel;
