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
  Unlink,
  AlertTriangle
} from 'lucide-react'
import { UserCalendar } from '@/types/calendar'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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

  const handleDelete = () => {
    if (onDisconnectCalendars && selectedCalendars.length > 0) {
      onDisconnectCalendars(selectedCalendars)
      setCalendarsToDisconnect([])
    }
    setShowDeleteDialog(false)
  }

  // Se estamos mostrando calendários disponíveis para seleção
  if (calendars.length > 0) {
    return (
      <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Calendário Ativo
            </h3>
            <p className="text-sm text-gray-600">
              Selecione um calendário para visualizar e gerenciar eventos
            </p>
          </div>

          <Select
            value={selectedCalendars.length > 0 ? selectedCalendars[0] : ''}
            onValueChange={(value) => {
              if (value === 'add') {
                onAddCalendar && onAddCalendar()
              } else if (value === 'delete') {
                setShowDeleteDialog(true)
              } else {
                onCalendarToggle && onCalendarToggle(value)
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white shadow-sm">
              <SelectValue placeholder="Escolha um calendário..." />
            </SelectTrigger>
            <SelectContent className="w-full min-w-[300px]">
              {userCalendars.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nenhum calendário conectado</p>
                </div>
              ) : (
                userCalendars.map((calendar) => (
                  <SelectItem 
                    key={calendar.google_calendar_id} 
                    value={calendar.google_calendar_id}
                    className="flex items-center gap-3 p-3 hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: getCalendarColor(calendar.calendar_color) }}
                      />
                      <span className="font-medium">{calendar.calendar_name}</span>
                      {calendar.is_primary && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
              
              <div className="border-t border-gray-200 my-1" />
              
              <SelectItem 
                value="add" 
                className="flex items-center gap-3 p-3 hover:bg-green-50 cursor-pointer text-green-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Adicionar novo calendário
              </SelectItem>
              
              {selectedCalendars.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <SelectItem 
                    value="delete" 
                    className="flex items-center gap-3 p-3 hover:bg-red-50 cursor-pointer text-red-600 font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover "{userCalendars.find(cal => cal.google_calendar_id === selectedCalendars[0])?.calendar_name}"
                  </SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {selectedCalendars.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                                 <div
                   className="w-4 h-4 rounded-full shadow-sm"
                   style={{ backgroundColor: getCalendarColor(userCalendars.find(cal => cal.google_calendar_id === selectedCalendars[0])?.calendar_color || null) }}
                 />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{userCalendars.find(cal => cal.google_calendar_id === selectedCalendars[0])?.calendar_name}</h4>
                  <p className="text-sm text-gray-600">
                    {userCalendars.find(cal => cal.google_calendar_id === selectedCalendars[0])?.is_primary ? 'Calendário principal' : 'Calendário secundário'}
                  </p>
                </div>
                <Settings className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )}

          {/* Confirmação de exclusão */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmar exclusão
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja remover o calendário <strong>"{userCalendars.find(cal => cal.google_calendar_id === selectedCalendars[0])?.calendar_name}"</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Esta ação irá desconectar o calendário do Google, mas não excluirá os eventos existentes.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                  className="hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          {/* Seção de seleção para visualização */}
          <div className="space-y-2">
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
                Selecionar todos para visualizar
              </label>
            </div>

            {/* Lista de calendários para visualização */}
            <div className="space-y-2">
              {userCalendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`view-${calendar.id}`}
                    checked={selectedCalendars.includes(calendar.google_calendar_id)}
                    onCheckedChange={() => handleCalendarToggle(calendar.google_calendar_id)}
                  />
                  <label
                    htmlFor={`view-${calendar.id}`}
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
          </div>

          <Separator />

          {/* Seção de desconexão */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-disconnect"
                checked={userCalendars.length > 0 && userCalendars.every(cal => 
                  calendarsToDisconnect.includes(cal.google_calendar_id)
                )}
                onCheckedChange={handleSelectAllDisconnect}
              />
              <label
                htmlFor="select-all-disconnect"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-600"
              >
                Selecionar todos para desconectar
              </label>
            </div>

            {/* Lista de calendários para desconexão */}
            <div className="space-y-2">
              {userCalendars.map((calendar) => (
                <div key={calendar.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`disconnect-${calendar.id}`}
                    checked={calendarsToDisconnect.includes(calendar.google_calendar_id)}
                    onCheckedChange={() => handleDisconnectToggle(calendar.google_calendar_id)}
                  />
                  <label
                    htmlFor={`disconnect-${calendar.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 flex-1 text-red-600"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCalendarColor(calendar.calendar_color) }}
                    />
                    <Unlink className="h-4 w-4" />
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
              variant="destructive"
              size="sm"
              onClick={handleDisconnectSelected}
              disabled={isLoading || calendarsToDisconnect.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Desconectar ({calendarsToDisconnect.length})
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default CalendarSelector 