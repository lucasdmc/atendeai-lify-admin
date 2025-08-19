import { useToast } from './use-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';
export type ToastPersistence = 'auto' | 'persistent' | 'critical';

interface EnhancedToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  persistence?: ToastPersistence;
  correlationId?: string;
  duration?: number;
}

interface ToastPreset {
  variant: 'default' | 'destructive';
  icon?: string;
  duration: number;
  persistent: boolean;
}

const TOAST_PRESETS: Record<ToastType, ToastPreset> = {
  success: {
    variant: 'default',
    icon: '✅',
    duration: 4000,
    persistent: false,
  },
  error: {
    variant: 'destructive',
    icon: '❌',
    duration: 8000,
    persistent: false,
  },
  warning: {
    variant: 'default',
    icon: '⚠️',
    duration: 6000,
    persistent: false,
  },
  info: {
    variant: 'default',
    icon: 'ℹ️',
    duration: 5000,
    persistent: false,
  },
  loading: {
    variant: 'default',
    icon: '⏳',
    duration: Infinity,
    persistent: true,
  },
};

export function useEnhancedToast() {
  const { toast, dismiss } = useToast();

  const showToast = (options: EnhancedToastOptions) => {
    const {
      title,
      description,
      type = 'info',
      persistence = 'auto',
      correlationId,
      duration: customDuration
    } = options;

    const preset = TOAST_PRESETS[type];
    const shouldPersist = persistence === 'persistent' || persistence === 'critical' || preset.persistent;
    const toastDuration = customDuration ?? (shouldPersist ? Infinity : preset.duration);

    // Formatear título e descrição
    const formattedTitle = title ? `${preset.icon} ${title}` : undefined;
    const formattedDescription = correlationId 
      ? `${description} (ID: ${correlationId.slice(-8)})`
      : description;

    return toast({
      title: formattedTitle,
      description: formattedDescription,
      variant: preset.variant,
      duration: toastDuration,
    });
  };

  // Métodos de conveniência
  const success = (title: string, description: string = "", options?: Partial<EnhancedToastOptions>) => {
    return showToast({ ...options, title, description, type: 'success' });
  };

  const error = (title: string, description: string = "", options?: Partial<EnhancedToastOptions>) => {
    return showToast({ ...options, title, description, type: 'error' });
  };

  const warning = (title: string, description: string = "", options?: Partial<EnhancedToastOptions>) => {
    return showToast({ ...options, title, description, type: 'warning' });
  };

  const info = (title: string, description: string = "", options?: Partial<EnhancedToastOptions>) => {
    return showToast({ ...options, title, description, type: 'info' });
  };

  const loading = (title: string, description: string = "") => {
    return showToast({ title, description, type: 'loading', persistence: 'persistent' });
  };

  // Toasts específicos para casos comuns
  const networkError = (correlationId?: string) => {
    return error(
      "Erro de Conexão",
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
      { 
        ...(correlationId && { correlationId }), 
        persistence: 'persistent' 
      }
    );
  };

  const validationError = (message: string) => {
    return warning("Dados Inválidos", message);
  };

  const saveSuccess = (entity: string = "dados") => {
    return success("Sucesso", `${entity} salvos com sucesso!`);
  };

  const deleteSuccess = (entity: string = "item") => {
    return success("Excluído", `${entity} excluído com sucesso!`);
  };

  const unauthorized = () => {
    return error(
      "Acesso Negado",
      "Você não tem permissão para realizar esta ação.",
      { persistence: 'persistent' }
    );
  };

  const criticalError = (message: string, correlationId?: string) => {
    return error(
      "Erro Crítico",
      message,
      { 
        persistence: 'critical',
        ...(correlationId && { correlationId })
      }
    );
  };

  // Toasts para operações específicas do sistema
  const whatsappConnectionLost = () => {
    return error(
      "Conexão WhatsApp Perdida",
      "A conexão com o WhatsApp foi perdida. Tentando reconectar...",
      { persistence: 'persistent' }
    );
  };

  const googleCalendarError = () => {
    return error(
      "Erro Google Calendar",
      "Não foi possível acessar o Google Calendar. Verifique as permissões.",
      { persistence: 'persistent' }
    );
  };

  const appointmentCreated = (appointmentDetails?: string) => {
    return success(
      "Agendamento Criado",
      appointmentDetails || "O agendamento foi criado com sucesso!"
    );
  };

  const simulationMode = (isActive: boolean) => {
    return info(
      `Modo Simulação ${isActive ? 'Ativado' : 'Desativado'}`,
      isActive 
        ? "As mensagens não serão enviadas para o WhatsApp real."
        : "As mensagens agora serão enviadas para o WhatsApp real.",
      { duration: 6000 }
    );
  };

  return {
    // Core functions
    showToast,
    dismiss,
    
    // Convenience methods
    success,
    error,
    warning,
    info,
    loading,
    
    // Common patterns
    networkError,
    validationError,
    saveSuccess,
    deleteSuccess,
    unauthorized,
    criticalError,
    
    // System-specific
    whatsappConnectionLost,
    googleCalendarError,
    appointmentCreated,
    simulationMode,
  };
}

export default useEnhancedToast;