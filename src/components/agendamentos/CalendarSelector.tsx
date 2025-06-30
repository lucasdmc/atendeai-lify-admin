import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Plus, 
  Settings, 
  RefreshCw, 
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react'
import { UserCalendar } from '@/types/calendar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  primary?: boolean
  backgroundColor?: string
  foregroundColor?: string
}

interface CalendarSelectorProps {
  userCalendars?: UserCalendar[]
  selectedCalendars?: string[]
  onCalendarToggle?: (calendarId: string) => void
  onRefreshCalendars?: () => void
  onDisconnectCalendars?: () => void
  onAddCalendar?: () => void
  isLoading?: boolean
  // Props para seleção de calendários disponíveis
  calendars?: GoogleCalendar[]
  onCalendarsSelected?: (selectedCalendars: GoogleCalendar[]) => void
  onCancel?: () => void
}

const CalendarSelector = ({ 
  userCalendars = [], 
  selectedCalendars = [], 
  onCalendarToggle,
  onRefreshCalendars,
  onDisconnectCalendars,
  onAddCalendar,
  isLoading = false,
  calendars = [],
  onCalendarsSelected,
  onCancel
}: CalendarSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedAvailableCalendars, setSelectedAvailableCalendars] = useState<string[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const handleCalendarToggle = (calendarId: string) => {
    if (onCalendarToggle) {
      onCalendarToggle(calendarId)
    }
  }

  const handleAvailableCalendarToggle = (calendarId: string) => {
    setSelectedAvailableCalendars(prev => {
      if (prev.includes(calendarId)) {
        return prev.filter(id => id !== calendarId)
      } else {
        return [...prev, calendarId]
      }
    })
  }

  const handleSelectAll = () => {
    const allCalendarIds = userCalendars.map(cal => cal.google_calendar_id)
    const allSelected = allCalendarIds.every(id => selectedCalendars.includes(id))
    
    if (allSelected) {
      // Desmarcar todos
      allCalendarIds.forEach(id => {
        if (selectedCalendars.includes(id)) {
          handleCalendarToggle(id)
        }
      })
    } else {
      // Marcar todos
      allCalendarIds.forEach(id => {
        if (!selectedCalendars.includes(id)) {
          handleCalendarToggle(id)
        }
      })
    }
  }

  const getCalendarColor = (color: string | null) => {
    return color || '#4285f4'
  }

  const getCalendarIcon = (calendar: UserCalendar) => {
    if (calendar.is_primary) {
      return <Calendar className="h-4 w-4 text-blue-600" />
    }
    return <Calendar className="h-4 w-4 text-gray-500" />
  }

  const handleConnectCalendars = async () => {
    if (selectedAvailableCalendars.length === 0) {
      toast({
        title: 'Seleção necessária',
        description: 'Selecione pelo menos um calendário para conectar.',
        variant: 'destructive',
      })
      return
    }

    if (!onCalendarsSelected) return

    const selectedCalendars = calendars.filter(cal => 
      selectedAvailableCalendars.includes(cal.id)
    )

    onCalendarsSelected(selectedCalendars)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  // Se estamos mostrando calendários disponíveis para seleção
  if (calendars.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Selecionar Calendários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione os calendários que deseja conectar:
          </p>
          
          <div className="space-y-2">
            {calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <Checkbox
                  id={calendar.id}
                  checked={selectedAvailableCalendars.includes(calendar.id)}
                  onCheckedChange={() => handleAvailableCalendarToggle(calendar.id)}
                />
                <label
                  htmlFor={calendar.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                  />
                  {calendar.summary}
                  {calendar.primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConnectCalendars}
              disabled={selectedAvailableCalendars.length === 0 || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Conectar ({selectedAvailableCalendars.length})
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se não há calendários conectados
  if (userCalendars.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum calendário conectado
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Conecte seu Google Calendar para gerenciar agendamentos
            </p>
            <Button onClick={onAddCalendar} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Conectar Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Lista de calendários conectados
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendários
            <Badge variant="secondary" className="ml-2">
              {userCalendars.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-3">
          {/* Botão para selecionar todos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={userCalendars.length > 0 && userCalendars.every(cal => 
                selectedCalendars.includes(cal.google_calendar_id)
              )}
              onCheckedChange={handleSelectAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Selecionar todos
            </label>
          </div>

          <Separator />

          {/* Lista de calendários */}
          <div className="space-y-2">
            {userCalendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center space-x-2">
                <Checkbox
                  id={calendar.id}
                  checked={selectedCalendars.includes(calendar.google_calendar_id)}
                  onCheckedChange={() => handleCalendarToggle(calendar.google_calendar_id)}
                />
                <label
                  htmlFor={calendar.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 flex-1"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getCalendarColor(calendar.calendar_color) }}
                  />
                  {getCalendarIcon(calendar)}
                  <span className="truncate">{calendar.calendar_name}</span>
                  {calendar.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddCalendar}
              disabled={isLoading}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshCalendars}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnectCalendars}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default CalendarSelector 