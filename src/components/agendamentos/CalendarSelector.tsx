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
  ChevronUp
} from 'lucide-react'
import { UserCalendar } from '@/types/calendar'
import { useToast } from '@/hooks/use-toast'

interface CalendarSelectorProps {
  userCalendars: UserCalendar[]
  selectedCalendars: string[]
  onCalendarToggle: (calendarId: string) => void
  onRefreshCalendars?: () => void
  onDisconnectCalendars?: () => void
  onAddCalendar?: () => void
  isLoading?: boolean
}

const CalendarSelector = ({ 
  userCalendars, 
  selectedCalendars, 
  onCalendarToggle,
  onRefreshCalendars,
  onDisconnectCalendars,
  onAddCalendar,
  isLoading = false
}: CalendarSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const { toast } = useToast()

  const handleCalendarToggle = (calendarId: string) => {
    onCalendarToggle(calendarId)
  }

  const handleSelectAll = () => {
    const allCalendarIds = userCalendars.map(cal => cal.id)
    const allSelected = allCalendarIds.every(id => selectedCalendars.includes(id))
    
    if (allSelected) {
      // Desmarcar todos
      allCalendarIds.forEach(id => {
        if (selectedCalendars.includes(id)) {
          onCalendarToggle(id)
        }
      })
    } else {
      // Marcar todos
      allCalendarIds.forEach(id => {
        if (!selectedCalendars.includes(id)) {
          onCalendarToggle(id)
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

  if (userCalendars.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Nenhum calendário conectado
            </p>
            {onAddCalendar && (
              <Button onClick={onAddCalendar} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Conectar Calendário
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendários ({selectedCalendars.length}/{userCalendars.length})
          </CardTitle>
          <div className="flex items-center gap-2">
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
        
        {isExpanded && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              {selectedCalendars.length === userCalendars.length ? 'Desmarcar Todos' : 'Marcar Todos'}
            </Button>
            
            {onRefreshCalendars && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshCalendars}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
            )}
            
            {onAddCalendar && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddCalendar}
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {userCalendars.map((calendar) => {
              const isSelected = selectedCalendars.includes(calendar.id)
              const isPrimary = calendar.is_primary
              
              return (
                <div
                  key={calendar.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleCalendarToggle(calendar.id)}
                    disabled={isLoading}
                  />
                  
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: getCalendarColor(calendar.calendar_color) }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getCalendarIcon(calendar)}
                      <span className="font-medium text-sm truncate">
                        {calendar.calendar_name}
                      </span>
                      {isPrimary && (
                        <Badge variant="secondary" className="text-xs">
                          Principal
                        </Badge>
                      )}
                      {!calendar.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      {calendar.google_calendar_id}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      disabled={isLoading}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {onDisconnectCalendars && (
            <>
              <Separator className="my-4" />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnectCalendars}
                  disabled={isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desconectar Todos
                </Button>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default CalendarSelector 