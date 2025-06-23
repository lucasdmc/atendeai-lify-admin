
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { GoogleCalendarEvent } from '@/services/googleServiceAccountService';
import EditAppointmentModal from '@/components/agendamentos/EditAppointmentModal';
import CalendarViewSwitcher, { CalendarViewType } from './CalendarViewSwitcher';
import DayView from './views/DayView';
import WeekView from './views/WeekView';
import MonthView from './views/MonthView';
import YearView from './views/YearView';
import { navigateDate, getViewTitle, getEventsForDay } from '@/utils/calendarUtils';

interface CalendarViewProps {
  events: GoogleCalendarEvent[];
  onCreateEvent?: () => void;
  isLoading?: boolean;
  onUpdateEvent?: (eventId: string, eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<void>;
  onDeleteEvent?: (eventId: string) => Promise<void>;
}

const CalendarView = ({ 
  events, 
  onCreateEvent, 
  isLoading, 
  onUpdateEvent, 
  onDeleteEvent 
}: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<GoogleCalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewType, setViewType] = useState<CalendarViewType>('month');

  const goToPrevious = () => {
    setCurrentDate(navigateDate(currentDate, viewType, 'prev'));
  };

  const goToNext = () => {
    setCurrentDate(navigateDate(currentDate, viewType, 'next'));
  };

  const handleGetEventsForDay = (day: Date) => {
    return getEventsForDay(events, day);
  };

  const handleEditEvent = (event: GoogleCalendarEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  const renderCurrentView = () => {
    const commonProps = {
      currentDate,
      events,
      onEditEvent: handleEditEvent,
      getEventsForDay: handleGetEventsForDay,
    };

    switch (viewType) {
      case 'day':
        return <DayView {...commonProps} />;
      case 'week':
        return <WeekView {...commonProps} />;
      case 'month':
        return <MonthView {...commonProps} />;
      case 'year':
        return <YearView currentDate={currentDate} events={events} onEditEvent={handleEditEvent} />;
      default:
        return <MonthView {...commonProps} />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              {getViewTitle(currentDate, viewType)}
            </CardTitle>
            <div className="flex items-center gap-4">
              <CalendarViewSwitcher 
                currentView={viewType} 
                onViewChange={setViewType} 
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {onCreateEvent && (
                  <Button 
                    onClick={onCreateEvent}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Evento
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCurrentView()}
        </CardContent>
      </Card>

      {onUpdateEvent && onDeleteEvent && (
        <EditAppointmentModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          event={selectedEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
    </>
  );
};

export default CalendarView;
