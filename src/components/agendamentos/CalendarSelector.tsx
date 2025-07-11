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
  X,
  Unlink
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
  onDisconnectCalendars?: (calendarIds?: string[]) => void
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
  const [calendarsToDisconnect, setCalendarsToDisconnect] = useState<string[]>([])
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

  const handleDisconnectToggle = (calendarId: string) => {
    setCalendarsToDisconnect(prev => {
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

  const handleSelectAllDisconnect = () => {
    const allCalendarIds = userCalendars.map(cal => cal.google_calendar_id)
    const allSelected = allCalendarIds.every(id => calendarsToDisconnect.includes(id))
    
    if (allSelected) {
      // Desmarcar todos
      setCalendarsToDisconnect([])
    } else {
      // Marcar todos
      setCalendarsToDisconnect(allCalendarIds)
    }
  }

  const handleDisconnectSelected = () => {
    if (calendarsToDisconnect.length === 0) {
      toast({
        title: 'Seleção necessária',
        description: 'Selecione pelo menos um calendário para desconectar.',
        variant: 'destructive',
      })
      return
    }

    if (onDisconnectCalendars) {
      onDisconnectCalendars(calendarsToDisconnect)
      setCalendarsToDisconnect([]) // Limpar seleção após desconectar
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
                  className="flex items-center gap-2 text-sm cursor-pointer flex-1"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
                  />
                  <span className="font-medium">{calendar.summary}</span>
                  {calendar.primary && (
                    <Badge variant="secondary" className="text-xs">Principal</Badge>
                  )}
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleConnectCalendars} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Conectar Selecionados
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            Calendários
          </h3>
          <Button
            onClick={onAddCalendar}
            disabled={isLoading}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Conectar Google
          </Button>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">Nenhum calendário conectado</p>
          <p className="text-xs mt-1">Conecte seu Google Calendar para começar</p>
        </div>
      </div>
    )
  }

  // Lista de calendários conectados
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-orange-500" />
          Calendários Conectados
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={onRefreshCalendars}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={onAddCalendar}
            disabled={isLoading}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <Button
          onClick={handleSelectAll}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {userCalendars.every(cal => selectedCalendars.includes(cal.google_calendar_id)) 
            ? 'Desmarcar Todos' 
            : 'Marcar Todos'
          }
        </Button>
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          size="sm"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Lista de calendários */}
      {isExpanded && (
        <div className="space-y-2">
          {userCalendars.map((calendar) => (
            <div
              key={calendar.id}
              className={`p-3 border rounded-lg transition-colors ${
                selectedCalendars.includes(calendar.google_calendar_id)
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedCalendars.includes(calendar.google_calendar_id)}
                  onCheckedChange={() => handleCalendarToggle(calendar.google_calendar_id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getCalendarIcon(calendar)}
                    <span className="font-medium text-sm truncate">
                      {calendar.calendar_name}
                    </span>
                    {calendar.is_primary && (
                      <Badge variant="secondary" className="text-xs">Principal</Badge>
                    )}
                    {!calendar.is_active && (
                      <Badge variant="outline" className="text-xs text-gray-500">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {calendar.google_calendar_id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seção de desconexão */}
      {isExpanded && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Desconectar Calendários</h4>
              <Button
                onClick={handleSelectAllDisconnect}
                variant="outline"
                size="sm"
              >
                {userCalendars.every(cal => calendarsToDisconnect.includes(cal.google_calendar_id)) 
                  ? 'Desmarcar Todos' 
                  : 'Marcar Todos'
                }
              </Button>
            </div>
            
            <div className="space-y-1">
              {userCalendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={calendarsToDisconnect.includes(calendar.google_calendar_id)}
                    onCheckedChange={() => handleDisconnectToggle(calendar.google_calendar_id)}
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer flex-1">
                    <Unlink className="h-4 w-4 text-red-500" />
                    <span className="truncate">{calendar.calendar_name}</span>
                  </label>
                </div>
              ))}
            </div>
            
            {calendarsToDisconnect.length > 0 && (
              <Button
                onClick={handleDisconnectSelected}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Desconectar Selecionados ({calendarsToDisconnect.length})
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CalendarSelector 