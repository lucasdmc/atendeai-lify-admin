import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface GoogleAuthSetupProps {
  isAuthenticated: boolean
  userCalendars: any[]
  isLoading: boolean
  error: string | null
  onInitiateAuth: () => void
  onRefreshCalendars?: () => void
  onDisconnectCalendars?: () => void
}

const GoogleAuthSetup = ({
  isAuthenticated,
  userCalendars,
  isLoading,
  error,
  onInitiateAuth,
  onRefreshCalendars,
  onDisconnectCalendars
}: GoogleAuthSetupProps) => {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await onInitiateAuth()
    } catch (error) {
      console.error('Erro ao conectar:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (isAuthenticated && userCalendars.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Google Calendar Conectado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {userCalendars.length} calendário{userCalendars.length > 1 ? 's' : ''} conectado{userCalendars.length > 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Ativo
              </Badge>
            </div>
            
            <div className="space-y-2">
              {userCalendars.slice(0, 3).map((calendar: any) => (
                <div key={calendar.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.calendar_color || '#4285f4' }}
                  />
                  <span className="text-sm font-medium">{calendar.calendar_name}</span>
                  {calendar.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
              
              {userCalendars.length > 3 && (
                <div className="text-sm text-gray-500 text-center">
                  +{userCalendars.length - 3} mais calendário{userCalendars.length - 3 > 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-2">
              {onRefreshCalendars && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshCalendars}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              )}
              
              {onDisconnectCalendars && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnectCalendars}
                  disabled={isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Desconectar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Erro na Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Houve um problema ao conectar com o Google Calendar:
            </p>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleConnect}
                disabled={isConnecting || isLoading}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Tentar Novamente
              </Button>
              
              {onRefreshCalendars && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshCalendars}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Status
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-blue-50 rounded-full">
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Conecte seu Google Calendar</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Conecte seus calendários Google para gerenciar agendamentos de forma integrada e sincronizada.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Sincronização automática</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Múltiplos calendários</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Agendamentos em tempo real</span>
            </div>
          </div>
          
          <div className="pt-4">
            <Button
              onClick={handleConnect}
              disabled={isConnecting || isLoading}
              size="lg"
              className="w-full max-w-xs"
            >
              {isConnecting ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-5 w-5 mr-2" />
              )}
              Conectar com Google
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-400">
            Você será redirecionado para o Google para autorizar o acesso aos seus calendários.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default GoogleAuthSetup 