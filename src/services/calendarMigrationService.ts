import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface CalendarMigrationResult {
  success: boolean
  message: string
  migratedCount: number
  clinic?: {
    id: string
    name: string
  }
  user?: {
    id: string
    email: string
  }
}

export class CalendarMigrationService {
  /**
   * Migra calendários existentes de um usuário para uma clínica específica
   */
  static async migrateUserCalendarsToClinic(
    userId: string, 
    clinicId: string
  ): Promise<CalendarMigrationResult> {
    try {
      console.log(`🔄 Migrando calendários do usuário ${userId} para clínica ${clinicId}`)

      const { data, error } = await supabase.functions.invoke('migrate-calendars-to-clinics', {
        body: { userId, clinicId }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha na migração')
      }

      console.log(`✅ Migração concluída: ${data.migratedCount} calendários migrados`)
      return data

    } catch (error) {
      console.error('❌ Erro na migração de calendários:', error)
      throw error
    }
  }

  /**
   * Verifica se um usuário tem calendários que precisam ser migrados
   */
  static async checkMigrationNeeded(userId: string): Promise<{
    needsMigration: boolean
    unmigratedCount: number
  }> {
    try {
      const { data, error } = await supabase
        .from('user_calendars')
        .select('id')
        .eq('user_id', userId)
        .is('clinic_id', null)

      if (error) {
        throw error
      }

      return {
        needsMigration: (data?.length || 0) > 0,
        unmigratedCount: data?.length || 0
      }

    } catch (error) {
      console.error('❌ Erro ao verificar necessidade de migração:', error)
      return {
        needsMigration: false,
        unmigratedCount: 0
      }
    }
  }

  /**
   * Obtém histórico de migrações de um usuário
   */
  static async getUserMigrationHistory(userId: string): Promise<{
    id: string
    clinic_id: string
    clinic_name: string
    calendars_migrated: number
    migration_date: string
    status: string
  }[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_migration_logs')
        .select(`
          id,
          clinic_id,
          calendars_migrated,
          migration_date,
          status,
          clinics!inner(name)
        `)
        .eq('user_id', userId)
        .order('migration_date', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map(item => ({
        id: item.id,
        clinic_id: item.clinic_id,
        clinic_name: item.clinics.name,
        calendars_migrated: item.calendars_migrated,
        migration_date: item.migration_date,
        status: item.status
      }))

    } catch (error) {
      console.error('❌ Erro ao buscar histórico de migração:', error)
      return []
    }
  }

  /**
   * Migra automaticamente calendários quando uma clínica é selecionada
   */
  static async autoMigrateCalendars(
    userId: string, 
    clinicId: string
  ): Promise<CalendarMigrationResult | null> {
    try {
      // Verificar se precisa de migração
      const { needsMigration, unmigratedCount } = await this.checkMigrationNeeded(userId)

      if (!needsMigration) {
        console.log('✅ Nenhuma migração necessária')
        return null
      }

      console.log(`🔄 Migração automática necessária: ${unmigratedCount} calendários`)
      
      // Executar migração
      const result = await this.migrateUserCalendarsToClinic(userId, clinicId)
      
      console.log('✅ Migração automática concluída:', result)
      return result

    } catch (error) {
      console.error('❌ Erro na migração automática:', error)
      return null
    }
  }
}

/**
 * Hook para gerenciar migração de calendários
 */
export const useCalendarMigration = () => {
  const { toast } = useToast()

  const migrateCalendars = async (userId: string, clinicId: string) => {
    try {
      const result = await CalendarMigrationService.migrateUserCalendarsToClinic(userId, clinicId)
      
      toast({
        title: 'Migração Concluída',
        description: `${result.migratedCount} calendário(s) migrado(s) para ${result.clinic?.name}`,
      })

      return result
    } catch (error) {
      toast({
        title: 'Erro na Migração',
        description: error instanceof Error ? error.message : 'Falha na migração',
        variant: 'destructive',
      })
      throw error
    }
  }

  const checkMigrationNeeded = CalendarMigrationService.checkMigrationNeeded
  const getUserMigrationHistory = CalendarMigrationService.getUserMigrationHistory
  const autoMigrateCalendars = CalendarMigrationService.autoMigrateCalendars

  return {
    migrateCalendars,
    checkMigrationNeeded,
    getUserMigrationHistory,
    autoMigrateCalendars
  }
}
