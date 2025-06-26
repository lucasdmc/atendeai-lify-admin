import { useCallback, useRef, useEffect } from 'react';

interface MemoizedCallbackOptions {
  dependencies?: any[];
  maxAge?: number; // tempo em ms para considerar o cache válido
}

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  options: MemoizedCallbackOptions = {}
) => {
  const { dependencies = [], maxAge = 5 * 60 * 1000 } = options; // 5 minutos padrão
  
  const cacheRef = useRef<Map<string, { result: any; timestamp: number }>>(new Map());
  const lastCallRef = useRef<{ args: any[]; result: any; timestamp: number } | null>(null);

  const memoizedCallback = useCallback((...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();
    const argsKey = JSON.stringify(args);
    
    // Verificar cache
    const cached = cacheRef.current.get(argsKey);
    if (cached && (now - cached.timestamp) < maxAge) {
      return cached.result;
    }

    // Verificar se é a mesma chamada recente
    if (lastCallRef.current && 
        JSON.stringify(lastCallRef.current.args) === argsKey &&
        (now - lastCallRef.current.timestamp) < 1000) { // 1 segundo para evitar chamadas duplicadas
      return lastCallRef.current.result;
    }

    // Executar callback
    const result = callback(...args);
    
    // Armazenar no cache
    cacheRef.current.set(argsKey, { result, timestamp: now });
    lastCallRef.current = { args, result, timestamp: now };

    return result;
  }, [callback, maxAge, ...dependencies]);

  // Limpar cache antigo periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of cacheRef.current.entries()) {
        if ((now - value.timestamp) > maxAge) {
          cacheRef.current.delete(key);
        }
      }
    }, maxAge);

    return () => clearInterval(interval);
  }, [maxAge]);

  return memoizedCallback;
};

// Hook para debounce
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Hook para throttle
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const lastCallRef = useRef(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      callback(...args);
      lastCallRef.current = now;
    }
  }, [callback, delay]);
}; 