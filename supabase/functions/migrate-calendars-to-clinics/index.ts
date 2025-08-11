import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { userId, clinicId } = await req.json()

    if (!userId || !clinicId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'userId e clinicId são obrigatórios' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`🔄 Migrando calendários do usuário ${userId} para clínica ${clinicId}`)

    // 1. Verificar se o usuário existe
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // 2. Verificar se a clínica existe
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('id', clinicId)
      .single()

    if (clinicError || !clinic) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Clínica não encontrada' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // 3. Buscar calendários do usuário que não têm clinic_id
    const { data: calendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .is('clinic_id', null)

    if (calendarsError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao buscar calendários: ${calendarsError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    if (!calendars || calendars.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum calendário encontrado para migração',
          migratedCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log(`📅 Encontrados ${calendars.length} calendários para migrar`)

    // 4. Atualizar calendários com o clinic_id
    const { data: updatedCalendars, error: updateError } = await supabase
      .from('user_calendars')
      .update({ 
        clinic_id: clinicId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .is('clinic_id', null)
      .select()

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro ao atualizar calendários: ${updateError.message}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`✅ ${updatedCalendars?.length || 0} calendários migrados com sucesso`)

    // 5. Registrar a migração
    const { error: logError } = await supabase
      .from('calendar_migration_logs')
      .insert({
        user_id: userId,
        clinic_id: clinicId,
        calendars_migrated: updatedCalendars?.length || 0,
        migration_date: new Date().toISOString(),
        status: 'completed'
      })

    if (logError) {
      console.warn('⚠️ Erro ao registrar log de migração:', logError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Calendários migrados com sucesso',
        migratedCount: updatedCalendars?.length || 0,
        clinic: {
          id: clinic.id,
          name: clinic.name
        },
        user: {
          id: user.id,
          email: user.email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erro na migração:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Erro interno: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
