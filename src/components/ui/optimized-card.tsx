import { memo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface OptimizedCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onClick?: () => void;
  loading?: boolean;
}

const OptimizedCard = memo(forwardRef<HTMLDivElement, OptimizedCardProps>(
  ({ title, children, className, headerClassName, contentClassName, onClick, loading }, ref) => {
    return (
      <Card 
        ref={ref}
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          onClick && 'cursor-pointer hover:scale-[1.02]',
          loading && 'opacity-50 pointer-events-none',
          className
        )}
        onClick={onClick}
      >
        {title && (
          <CardHeader className={cn('pb-3', headerClassName)}>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className={cn('pt-0', contentClassName)}>
          {children}
        </CardContent>
      </Card>
    );
  }
));

OptimizedCard.displayName = 'OptimizedCard';

export { OptimizedCard }; 