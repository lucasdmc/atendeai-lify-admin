import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '@/config/frontend-config';

// Interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Configuração do cliente
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || config.backend.url;

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configurar interceptors para requisições e respostas
   */
  private setupInterceptors() {
    // Interceptor para requisições
    this.client.interceptors.request.use(
      async (config) => {
        // Adicionar token de autenticação se disponível
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log da requisição em desenvolvimento
        if (import.meta.env.DEV) {
          console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para respostas
    this.client.interceptors.response.use(
      (response) => {
        // Log da resposta em desenvolvimento
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }

        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Retry logic para erros de rede
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          console.log(`🔄 Retrying request (${this.retryCount}/${this.maxRetries})`);
          
          // Aguardar antes de tentar novamente
          await this.delay(1000 * this.retryCount);
          
          return this.client(originalRequest);
        }

        // Reset retry count
        this.retryCount = 0;

        // Log do erro
        console.error('❌ API Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
        });

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Verificar se deve tentar novamente
   */
  private shouldRetry(error: any): boolean {
    return (
      !error.response || // Erro de rede
      error.response.status >= 500 || // Erro do servidor
      error.response.status === 429 // Rate limit
    );
  }

  /**
   * Delay para retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formatar erro da API
   */
  private formatError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || error.response.data?.error || 'Erro do servidor',
        code: error.response.status.toString(),
        details: error.response.data,
      };
    }

    if (error.request) {
      return {
        message: 'Erro de conexão com o servidor',
        code: 'NETWORK_ERROR',
      };
    }

    return {
      message: error.message || 'Erro desconhecido',
      code: 'UNKNOWN_ERROR',
    };
  }

  /**
   * Obter token de autenticação do Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Importar dinamicamente para evitar dependência circular
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.warn('⚠️ Erro ao obter token:', error);
      return null;
    }
  }

  /**
   * Fazer requisição GET
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Fazer requisição POST
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Fazer requisição PUT
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Fazer requisição DELETE
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Fazer requisição PATCH
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(url, data, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Verificar se o backend está funcionando
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter configuração do cliente
   */
  getConfig() {
    return {
      baseURL: this.client.defaults.baseURL,
      timeout: this.client.defaults.timeout,
      maxRetries: this.maxRetries,
    };
  }
}

// Instância singleton do cliente
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
// Export types 