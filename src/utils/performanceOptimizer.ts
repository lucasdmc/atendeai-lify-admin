/**
 * Utilitários para otimização de performance
 */

// Throttle function para limitar chamadas
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}

// Debounce function para atrasar chamadas
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Batch updates para otimizar re-renders
export class BatchUpdater {
  private updates: Array<() => void> = [];
  private isScheduled = false;

  public add(update: () => void) {
    this.updates.push(update);
    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    this.updates.forEach(update => update());
    this.updates = [];
    this.isScheduled = false;
  }
}

// Singleton instance
export const batchUpdater = new BatchUpdater();

// Lazy loading utility
export function createLazyComponent<T>(
  importFn: () => Promise<{ default: T }>
) {
  let component: T | null = null;
  let loading = false;
  let error: Error | null = null;

  return {
    load: async (): Promise<T> => {
      if (component) return component;
      if (loading) {
        // Wait for the current loading to complete
        while (loading) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        if (component) return component;
      }

      try {
        loading = true;
        const module = await importFn();
        component = module.default;
        return component;
      } catch (err) {
        error = err as Error;
        throw err;
      } finally {
        loading = false;
      }
    },
    get isLoaded() {
      return component !== null;
    },
    get error() {
      return error;
    }
  };
}

// Memory optimization - cleanup unused refs
export function cleanupRefs(refs: Array<React.MutableRefObject<any>>) {
  refs.forEach(ref => {
    if (ref.current) {
      ref.current = null;
    }
  });
}

// Optimize array operations
export function optimizeArray<T>(
  array: T[],
  keyExtractor: (item: T) => string | number
): Map<string | number, T> {
  return new Map(array.map(item => [keyExtractor(item), item]));
}