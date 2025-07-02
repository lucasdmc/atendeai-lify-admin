#!/usr/bin/env node

/**
 * Script para testar a janela de tempo da busca de eventos
 * 
 * Este script testa:
 * 1. Diferentes janelas de tempo
 * 2. Eventos de diferentes meses
 * 3. Verificação de timezone
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

async function testTimeWindow() {
  console.log('🧪 Testando janela de tempo para eventos...\n')

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

    // 2. Testar diferentes janelas de tempo
    const testCases = [
      {
        name: 'Janela atual (90 dias atrás → 1 ano à frente)',
        timeMin: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: 'Últimos 6 meses',
        timeMin: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        timeMax: new Date().toISOString(),
      },
      {
        name: 'Próximos 6 meses',
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        name: 'Todo o ano atual',
        timeMin: new Date(new Date().getFullYear(), 0, 1).toISOString(), // 1º de janeiro
        timeMax: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).toISOString(), // 31 de dezembro
      },
    ]

    for (const testCase of testCases) {
      console.log(`\n2️⃣ Testando: ${testCase.name}`)
      console.log(`   TimeMin: ${testCase.timeMin}`)
      console.log(`   TimeMax: ${testCase.timeMax}`)

      const { data: eventsData, error: eventsError } = await supabase.functions.invoke('calendar-manager', {
        body: {
          action: 'list-events',
          calendarId: testCalendar.google_calendar_id,
          userId: testCalendar.user_id,
          forceRefresh: true,
          timeMin: testCase.timeMin,
          timeMax: testCase.timeMax,
        }
      })

      if (eventsError) {
        console.error(`   ❌ Erro: ${eventsError.message}`)
        continue
      }

      if (!eventsData.success) {
        console.error(`   ❌ Edge Function retornou erro`)
        continue
      }

      console.log(`   ✅ Eventos encontrados: ${eventsData.events?.length || 0}`)

      // Analisar distribuição por mês
      if (eventsData.events && eventsData.events.length > 0) {
        const monthDistribution = {}
        eventsData.events.forEach(event => {
          const startDate = new Date(event.start?.dateTime || event.start?.date)
          const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`
          monthDistribution[monthKey] = (monthDistribution[monthKey] || 0) + 1
        })

        console.log(`   📅 Distribuição por mês:`)
        Object.entries(monthDistribution)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([month, count]) => {
            console.log(`      ${month}: ${count} eventos`)
          })

        // Mostrar alguns eventos de exemplo
        console.log(`   📋 Exemplos de eventos:`)
        eventsData.events.slice(0, 3).forEach((event, index) => {
          const startDate = new Date(event.start?.dateTime || event.start?.date)
          console.log(`      ${index + 1}. ${event.summary || 'Sem título'} - ${startDate.toISOString().split('T')[0]}`)
        })
      } else {
        console.log(`   ⚠️  Nenhum evento encontrado nesta janela`)
      }
    }

    console.log('\n✅ Teste de janela de tempo concluído!')
    console.log('\n💡 Dicas:')
    console.log('   • Se só aparecem eventos de julho, pode ser um problema de timezone')
    console.log('   • Verifique se os eventos estão realmente no calendário correto')
    console.log('   • Teste criar um evento novo para ver se aparece')

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Executar o teste
testTimeWindow() 