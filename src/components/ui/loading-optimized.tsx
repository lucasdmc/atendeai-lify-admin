import { memo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingOptimizedProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  timeout?: number;
  className?: string;
  children?: React.ReactNode;
}

const LoadingOptimized = memo(({ 
  isLoading, 
  message = "Carregando...", 
  showProgress = false, 
  timeout = 3000,
  className,
  children 
}: LoadingOptimizedProps) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setShowTimeoutMessage(false);
      setProgress(0);

      // Timeout para mostrar mensagem de demora
      const timeoutId = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, timeout);

      // Progress bar simulada
      if (showProgress) {
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 200);

        return () => {
          clearTimeout(timeoutId);
          clearInterval(progressInterval);
        };
      }

      return () => clearTimeout(timeoutId);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading, timeout, showProgress]);

  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[200px] p-6",
      className
    )}>
      {/* Spinner otimizado */}
      <div className="relative">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border-2 border-blue-400 opacity-20"></div>
      </div>

      {/* Mensagem */}
      <p className="mt-4 text-sm text-gray-600 text-center max-w-xs">
        {message}
      </p>

      {/* Progress bar */}
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Mensagem de timeout */}
      {showTimeoutMessage && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 text-center">
            ⏱️ Carregamento está demorando mais que o esperado...
          </p>
        </div>
      )}
    </div>
  );
});

LoadingOptimized.displayName = 'LoadingOptimized';

export { LoadingOptimized }; 