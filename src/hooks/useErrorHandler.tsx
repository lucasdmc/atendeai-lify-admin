import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface ErrorHandlerOptions {
  showToast?: boolean;
  context?: string;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = useCallback((
    error: unknown, 
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      context = 'Application',
      fallbackMessage = 'Ocorreu um erro inesperado. Tente novamente.'
    } = options;

    // Log do erro
    logger.error(
      `Error in ${context}`,
      error,
      context
    );

    // Determinar mensagem para o usuário
    let userMessage = fallbackMessage;
    
    if (error instanceof Error) {
      // Mapear erros conhecidos para mensagens amigáveis
      if (error.message.includes('network') || error.message.includes('fetch')) {
        userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        userMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.message.includes('validation')) {
        userMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (error.message.includes('not found')) {
        userMessage = 'Recurso não encontrado.';
      } else if (error.message.includes('timeout')) {
        userMessage = 'Tempo limite excedido. Tente novamente.';
      } else {
        // Para erros desconhecidos, usar mensagem genérica em produção
        userMessage = import.meta.env.DEV ? error.message : fallbackMessage;
      }
    }

    // Mostrar toast se solicitado
    if (showToast) {
      toast({
        title: "Erro",
        description: userMessage,
        variant: "destructive",
      });
    }

    return userMessage;
  }, [toast]);

  const handleAsyncError = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, options);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}; 