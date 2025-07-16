import { useEffect, useState } from 'react';
import { Loader2, Calendar, Users, MessageSquare, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingOptimizedProps {
  isLoading: boolean;
  message?: string;
  showProgress?: boolean;
  timeout?: number;
}

export const LoadingOptimized = ({ 
  isLoading, 
  message = "Carregando...", 
  showProgress = true,
  timeout = 3000 
}: LoadingOptimizedProps) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setShowTimeoutMessage(false);
      setProgress(0);
      
      // Mostrar mensagem de timeout se demorar muito
      const timeoutId = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, timeout);

      // Simular progresso
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
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  }, [isLoading, timeout]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-96 max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{message}</h3>
            {showTimeoutMessage && (
              <p className="text-sm text-muted-foreground">
                Isso pode demorar um pouco na primeira vez...
              </p>
            )}
          </div>

          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% concluído
              </p>
            </div>
          )}

          <div className="flex justify-center space-x-4 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <Users className="h-4 w-4" />
            <MessageSquare className="h-4 w-4" />
            <Settings className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingOptimized; 