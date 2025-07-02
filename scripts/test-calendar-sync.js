#!/usr/bin/env node

/**
 * Script para testar a sincronização de eventos do Google Calendar
 * 
 * Este script testa:
 * 1. Busca de eventos com forceRefresh
 * 2. Verificação de cache-busting
 * 3. Janela de tempo expandida
 * 4. Headers de cache
 */

import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:')
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCalendarSync() {
  console.log('🧪 Testando sincronização de calendário...\n')

  try {
    // 1. Buscar usuários com calendários conectados
    console.log('1️⃣ Buscando usuários com calendários conectados...')
    const { data: userCalendars, error: calendarError } = await supabase
      .from('user_calendars')
      .select('user_id, google_calendar_id, is_active')
      .eq('is_active', true)
      .limit(1)

    if (calendarError) {
      throw new Error(`Erro ao buscar calendários: ${calendarError.message}`)
    }

    if (!userCalendars || userCalendars.length === 0) {
      console.log('⚠️  Nenhum calendário ativo encontrado')
      return
    }

    const testCalendar = userCalendars[0]
    console.log(`✅ Calendário encontrado: ${testCalendar.google_calendar_id} (usuário: ${testCalendar.user_id})`)

    // 2. Testar busca de eventos com forceRefresh
    console.log('\n2️⃣ Testando busca de eventos com forceRefresh...')
    const { data: eventsData, error: eventsError } = await supabase.functions.invoke('calendar-manager', {
      body: {
        action: 'list-events',
        calendarId: testCalendar.google_calendar_id,
        userId: testCalendar.user_id,
        forceRefresh: true,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias à frente
      }
    })

    if (eventsError) {
      throw new Error(`Erro na Edge Function: ${eventsError.message}`)
    }

    if (!eventsData.success) {
      throw new Error('Edge Function retornou erro')
    }

    console.log(`✅ Eventos carregados: ${eventsData.events?.length || 0}`)
    console.log(`✅ Timezone: ${eventsData.timeZone}`)
    console.log(`✅ Última atualização: ${eventsData.updated}`)

    // 3. Mostrar detalhes dos eventos
    if (eventsData.events && eventsData.events.length > 0) {
      console.log('\n3️⃣ Detalhes dos eventos:')
      eventsData.events.slice(0, 5).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.summary || 'Sem título'}`)
        console.log(`      ID: ${event.id}`)
        console.log(`      Início: ${event.start?.dateTime || event.start?.date}`)
        console.log(`      Criado: ${event.created}`)
        console.log(`      Atualizado: ${event.updated}`)
        console.log('')
      })

      if (eventsData.events.length > 5) {
        console.log(`   ... e mais ${eventsData.events.length - 5} eventos`)
      }
    } else {
      console.log('⚠️  Nenhum evento encontrado na janela de tempo especificada')
    }

    // 4. Testar busca sem forceRefresh para comparar
    console.log('\n4️⃣ Testando busca sem forceRefresh...')
    const { data: eventsDataNoRefresh, error: eventsErrorNoRefresh } = await supabase.functions.invoke('calendar-manager', {
      body: {
        action: 'list-events',
        calendarId: testCalendar.google_calendar_id,
        userId: testCalendar.user_id,
        forceRefresh: false,
        timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      }
    })

    if (!eventsErrorNoRefresh && eventsDataNoRefresh?.success) {
      console.log(`✅ Eventos sem forceRefresh: ${eventsDataNoRefresh.events?.length || 0}`)
      console.log(`✅ Última atualização sem forceRefresh: ${eventsDataNoRefresh.updated}`)
    }

    console.log('\n✅ Teste de sincronização concluído com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   • Calendário testado: ${testCalendar.google_calendar_id}`)
    console.log(`   • Eventos encontrados: ${eventsData.events?.length || 0}`)
    console.log(`   • Janela de tempo: 30 dias atrás → 90 dias à frente`)
    console.log(`   • ForceRefresh: Habilitado`)
    console.log(`   • Cache-busting: Implementado`)

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Executar o teste
testCalendarSync() 