import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarMigrationService, useCalendarMigration } from '@/services/calendarMigrationService'
import { useAuth } from '@/hooks/useAuth'
import { useClinic } from '@/contexts/ClinicContext'
import { RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface MigrationStatus {
  needsMigration: boolean
  unmigratedCount: number
}

export const CalendarMigrationStatus = () => {
  const { user } = useAuth()
  const { selectedClinicId, selectedClinic } = useClinic()
  const { migrateCalendars } = useCalendarMigration()
  
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // Verificar status da migração
  const checkMigrationStatus = async () => {
    if (!user || !selectedClinicId) return

    setIsChecking(true)
    try {
      const status = await CalendarMigrationService.checkMigrationNeeded(user.id)
      setMigrationStatus(status)
      setLastChecked(new Date())
    } catch (error) {
      console.error('❌ Erro ao verificar status da migração:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // Executar migração manual
  const handleManualMigration = async () => {
    if (!user || !selectedClinicId) return

    setIsMigrating(true)
    try {
      await migrateCalendars(user.id, selectedClinicId)
      // Recarregar status
      await checkMigrationStatus()
    } catch (error) {
      console.error('❌ Erro na migração manual:', error)
    } finally {
      setIsMigrating(false)
    }
  }

  // Verificar status quando clínica muda
  useEffect(() => {
    if (selectedClinicId) {
      checkMigrationStatus()
    }
  }, [selectedClinicId])

  // Se não há clínica selecionada, não mostrar nada
  if (!selectedClinicId || !selectedClinic) {
    return null
  }

  // Se não há status de migração, não mostrar nada
  if (!migrationStatus) {
    return null
  }

  // Se não precisa de migração, não mostrar nada
  if (!migrationStatus.needsMigration) {
    return null
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Migração de Calendários Necessária
        </CardTitle>
        <CardDescription className="text-orange-700">
          Você tem {migrationStatus.unmigratedCount} calendário(s) que precisa(m) ser associado(s) à clínica {selectedClinic.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Alert className="border-orange-200 bg-orange-100">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Para melhor organização, os calendários agora são associados às clínicas específicas. 
              Isso garante que você veja apenas os eventos relevantes para cada clínica.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                {migrationStatus.unmigratedCount} calendário(s) pendente(s)
              </Badge>
              {lastChecked && (
                <span className="text-xs text-orange-600">
                  Verificado em {lastChecked.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={checkMigrationStatus}
                disabled={isChecking}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                Verificar
              </Button>

              <Button
                onClick={handleManualMigration}
                disabled={isMigrating}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Migrar Agora
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-xs text-orange-600">
            💡 <strong>Dica:</strong> A migração é automática na maioria dos casos, mas você pode executá-la manualmente se necessário.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
