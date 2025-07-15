import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw,
  Menu,
  X,
  Settings
} from 'lucide-react'
import { GoogleCalendarEvent } from '@/types/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import NewAppointmentModal from './NewAppointmentModal'

interface CalendarHeaderProps {
  currentDate: Date
  viewType: 'day' | 'week' | 'month'
  onViewTypeChange: (viewType: 'day' | 'week' | 'month') => void
  onNavigateDate: (direction: 'prev' | 'next' | 'today') => void
  onCreateEvent: (eventData: Omit<GoogleCalendarEvent, 'id' | 'status'>) => Promise<GoogleCalendarEvent>
  onRefreshEvents: () => void
  isLoading: boolean
  eventsCount: number
  calendarsCount: number
  isConnected: boolean
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

const CalendarHeader = ({
  currentDate,
  viewType,
  onViewTypeChange,
  onNavigateDate,
  onCreateEvent,
  onRefreshEvents,
  isLoading,
  eventsCount,
  calendarsCount,
  isConnected,
  onToggleSidebar,
  sidebarOpen
}: CalendarHeaderProps) => {
  const [showNewEventModal, setShowNewEventModal] = useState(false)

  const getDateTitle = () => {
    if (viewType === 'day') {
      return format(currentDate, 'EEEE, dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })
    } else if (viewType === 'week') {
      return format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })
    } else {
      return format(currentDate, 'MMMM \'de\' yyyy', { locale: ptBR })
    }
  }

  const viewTypeLabels = {
    day: 'Dia',
    week: 'Semana',
    month: 'Mês'
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Menu toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Calendário
            </h1>
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {eventsCount} eventos
            </Badge>
            <Badge variant="outline" className="text-xs">
              {calendarsCount} calendários
            </Badge>
          </div>
        </div>

        {/* Center section - Navigation */}
        <div className="flex items-center gap-4">
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateDate('prev')}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateDate('today')}
              className="px-3 py-2 text-sm font-medium"
            >
              Hoje
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateDate('next')}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current date display */}
          <h2 className="text-lg font-medium text-gray-900 min-w-0">
            {getDateTitle()}
          </h2>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* View type selector */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((type) => (
              <Button
                key={type}
                variant={viewType === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewTypeChange(type)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  viewType === type
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewTypeLabels[type]}
              </Button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshEvents}
              disabled={isLoading}
              className="px-3 py-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="px-3 py-2"
            >
              <Settings className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => setShowNewEventModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </div>
        </div>
      </header>

      {/* New Event Modal */}
      <NewAppointmentModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onCreateEvent={onCreateEvent}
      />
    </>
  )
}

export default CalendarHeader