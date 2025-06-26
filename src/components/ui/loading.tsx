import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string | undefined;
  fullScreen?: boolean;
}

export const Loading = ({ 
  size = 'md', 
  text, 
  className,
  fullScreen = false 
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-2',
      className
    )}>
      <Loader2 className={cn(
        'animate-spin text-primary',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export const LoadingSpinner = ({ size = 'md', className }: Omit<LoadingProps, 'text' | 'fullScreen'>) => (
  <Loading size={size} className={className || undefined} />
);

export const LoadingPage = ({ text = 'Carregando...' }: Pick<LoadingProps, 'text'>) => (
  <Loading text={text} fullScreen />
); 