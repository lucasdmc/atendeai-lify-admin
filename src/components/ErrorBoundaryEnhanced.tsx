import { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  errorId?: string | undefined;
}

class ErrorBoundaryEnhanced extends Component<Props, State> {
  private resetTimeoutId?: NodeJS.Timeout;

  public override state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'component', onError } = this.props;
    
    // Atualizar state com errorInfo
    this.setState({ errorInfo });

    // Gerar correlation ID para rastreamento
    const correlationId = this.state.errorId || `err_${Date.now()}`;
    
    // Log estruturado com correlation ID
    const errorLog = {
      timestamp: new Date().toISOString(),
      correlationId,
      level,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    };

    console.error('🚨 ErrorBoundary caught an error:', errorLog);

    // Enviar para serviço de logging (se configurado)
    this.sendErrorToLoggingService(errorLog);

    // Callback customizado
    if (onError) {
      onError(error, errorInfo);
    }

    // Toast notification baseada no nível
    this.showErrorToast(level, correlationId);

    // Auto-reset para componentes (não páginas críticas)
    if (level === 'component') {
      this.scheduleAutoReset();
    }
  }

  private getUserId(): string | null {
    try {
      // Tentar obter do localStorage ou context
      return localStorage.getItem('userId') || null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string | null {
    try {
      return sessionStorage.getItem('sessionId') || null;
    } catch {
      return null;
    }
  }

  private sendErrorToLoggingService(errorLog: any): void {
    try {
      // Enviar para endpoint de logging (assíncrono)
      fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      }).catch(err => {
        console.warn('Failed to send error to logging service:', err);
      });
    } catch {
      // Silenciosamente falhar se não conseguir enviar
    }
  }

  private showErrorToast(level: string, correlationId: string): void {
    const toastConfig = {
      page: {
        title: "Erro na Página",
        description: "Ocorreu um erro ao carregar a página. Tente recarregar.",
        variant: "destructive" as const,
      },
      component: {
        title: "Erro no Componente", 
        description: "Um componente apresentou falha. Tentando recuperar...",
        variant: "destructive" as const,
      },
      critical: {
        title: "Erro Crítico",
        description: "Erro crítico detectado. Entre em contato com o suporte.",
        variant: "destructive" as const,
      }
    };

    const config = toastConfig[level as keyof typeof toastConfig] || toastConfig.component;

    toast({
      ...config,
      description: `${config.description} (ID: ${correlationId.slice(-8)})`,
    });
  }

  private scheduleAutoReset(): void {
    // Limpar timeout anterior se existir
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    // Auto-reset após 10 segundos para componentes
    this.resetTimeoutId = setTimeout(() => {
      console.log('🔄 Auto-resetting ErrorBoundary...');
      this.setState({
        hasError: false,
      });
    }, 10000);
  }

  private contactSupport(correlationId: string): void {
    const subject = encodeURIComponent(`Erro no Sistema - ID: ${correlationId}`);
    const body = encodeURIComponent(
      `Olá,\n\nEncontrei um erro no sistema.\n\nID do Erro: ${correlationId}\nData/Hora: ${new Date().toLocaleString()}\nPágina: ${window.location.href}\n\nDescrição do problema:\n[Descreva o que estava fazendo quando o erro ocorreu]\n\nObrigado!`
    );
    window.open(`mailto:suporte@atendeai.com?subject=${subject}&body=${body}`);
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public override componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      const { level = 'component', fallback } = this.props;

      if (fallback) {
        return fallback;
      }

      // Render diferente baseado no nível
      if (level === 'critical') {
        return this.renderCriticalError();
      }

      if (level === 'page') {
        return this.renderPageError();
      }

      return this.renderComponentError();
    }

    return this.props.children;
  }

  private renderCriticalError(): ReactNode {
    const { errorId } = this.state;
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M6 12a6 6 0 1112 0 6 6 0 01-12 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Erro Crítico Detectado
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            O sistema encontrou um erro crítico e não pode continuar. Nossa equipe foi notificada automaticamente.
          </p>
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mb-4">
            <strong>ID do Erro:</strong> {errorId?.slice(-12)}
            <br />
            <strong>Horário:</strong> {new Date().toLocaleString()}
          </div>
          <div className="space-y-2">
            <button
              onClick={() => this.contactSupport(errorId || '')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Contatar Suporte
            </button>
            <button
              onClick={this.handleReload}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderPageError(): ReactNode {
    const { error, errorId } = this.state;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Erro ao Carregar Página
          </h3>
          <p className="text-sm text-gray-600 text-center mb-4">
            Ocorreu um erro ao carregar esta página. Tente recarregar ou voltar à página anterior.
          </p>
          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded mb-4">
            <strong>Erro:</strong> {error?.message || 'Erro desconhecido'}
            <br />
            <strong>ID:</strong> {errorId?.slice(-8)}
          </div>
          <div className="space-y-2">
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderComponentError(): ReactNode {
    const { errorId } = this.state;
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-2">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h4 className="text-sm font-medium text-yellow-800">
              Componente Temporariamente Indisponível
            </h4>
            <p className="text-sm text-yellow-700 mt-1">
              Este componente apresentou uma falha e está sendo recuperado automaticamente.
            </p>
            <div className="text-xs text-yellow-600 mt-2">
              ID: {errorId?.slice(-8)} | Auto-recuperação em 10s
            </div>
            <div className="mt-3">
              <button
                onClick={this.handleRetry}
                className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundaryEnhanced;
