import { useState, useCallback, useRef, useEffect } from 'react';

interface QueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook otimizado para queries com cache e debounce
 */
export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus = false
  } = options;

  const executeQuery = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache
    const cached = cacheRef.current.get(queryKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      // Salvar no cache
      cacheRef.current.set(queryKey, {
        data: result,
        timestamp: Date.now()
      });
      
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        console.error(`Query error for ${queryKey}:`, err);
      }
    } finally {
      setLoading(false);
    }
  }, [queryKey, queryFn, enabled, staleTime]);

  const refetch = useCallback(() => {
    // Limpar cache para forçar nova busca
    cacheRef.current.delete(queryKey);
    executeQuery();
  }, [queryKey, executeQuery]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const cached = cacheRef.current.get(queryKey);
      if (cached && Date.now() - cached.timestamp > staleTime) {
        executeQuery();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryKey, staleTime, refetchOnWindowFocus, executeQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch
  };
}