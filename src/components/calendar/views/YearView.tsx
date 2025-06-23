
import { startOfYear, endOfYear, eachMonthOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface YearViewProps {
  currentDate: Date;
  events: GoogleCalendarEvent[];
  onEditEvent: (event: GoogleCalendarEvent) => void;
}

const YearView = ({ currentDate, events }: YearViewProps) => {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  // Preparar dados mensais com comparação
  const monthlyData = monthsInYear.map((month, index) => {
    const monthEvents = events.filter(event => {
      if (!event.start?.dateTime) return false;
      const eventDate = new Date(event.start.dateTime);
      return eventDate.getMonth() === month.getMonth() && eventDate.getFullYear() === month.getFullYear();
    });

    let changePercentage = 0;
    let isIncrease = null;

    if (index > 0) {
      const previousMonth = monthsInYear[index - 1];
      const previousMonthEvents = events.filter(event => {
        if (!event.start?.dateTime) return false;
        const eventDate = new Date(event.start.dateTime);
        return eventDate.getMonth() === previousMonth.getMonth() && eventDate.getFullYear() === previousMonth.getFullYear();
      });

      const currentCount = monthEvents.length;
      const previousCount = previousMonthEvents.length;

      if (previousCount > 0) {
        changePercentage = Math.round(((currentCount - previousCount) / previousCount) * 100);
        isIncrease = currentCount >= previousCount;
      } else if (currentCount > 0) {
        changePercentage = 100;
        isIncrease = true;
      }
    }

    return {
      month,
      count: monthEvents.length,
      changePercentage,
      isIncrease,
      showChange: index > 0
    };
  });

  const totalEvents = events.filter(event => {
    if (!event.start?.dateTime) return false;
    const eventDate = new Date(event.start.dateTime);
    return eventDate.getFullYear() === currentDate.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Resumo do ano */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Resumo do Ano - {currentDate.getFullYear()}
            <span className="text-sm font-normal text-gray-500">
              ({totalEvents} {totalEvents === 1 ? 'agendamento' : 'agendamentos'} no ano)
            </span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Grid de meses com indicadores de tendência */}
      <div className="grid grid-cols-3 gap-4">
        {monthlyData.map((monthData) => {
          return (
            <Card key={monthData.month.toString()} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <h4 className="font-semibold text-gray-800">
                    {format(monthData.month, 'MMMM', { locale: ptBR })}
                  </h4>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {monthData.count}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    {monthData.count === 1 ? 'agendamento' : 'agendamentos'}
                  </div>

                  {/* Indicador de tendência */}
                  {monthData.showChange && (
                    <div className="flex items-center justify-center gap-1">
                      {monthData.isIncrease !== null && (
                        <>
                          {monthData.isIncrease ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${
                            monthData.isIncrease ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Math.abs(monthData.changePercentage)}%
                          </span>
                        </>
                      )}
                      {monthData.isIncrease === null && monthData.changePercentage === 0 && (
                        <span className="text-sm text-gray-400">
                          --
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default YearView;
