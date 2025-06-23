
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';

export type CalendarViewType = 'day' | 'week' | 'month' | 'year';

interface CalendarViewSwitcherProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

const CalendarViewSwitcher = ({ currentView, onViewChange }: CalendarViewSwitcherProps) => {
  const views: { key: CalendarViewType; label: string; icon?: any }[] = [
    { key: 'day', label: 'Dia', icon: Calendar },
    { key: 'week', label: 'Semana', icon: CalendarDays },
    { key: 'month', label: 'Mês', icon: Calendar },
    { key: 'year', label: 'Ano', icon: CalendarDays },
  ];

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
      {views.map((view) => (
        <Button
          key={view.key}
          variant={currentView === view.key ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(view.key)}
          className={`text-xs px-3 py-1 ${
            currentView === view.key 
              ? 'bg-white shadow-sm text-orange-600' 
              : 'hover:bg-white/50'
          }`}
        >
          {view.label}
        </Button>
      ))}
    </div>
  );
};

export default CalendarViewSwitcher;
