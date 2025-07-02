#!/usr/bin/env node

/**
 * Script para testar a desconexão de calendários
 * 
 * Este script testa:
 * 1. Verificação de calendários conectados
 * 2. Tentativa de desconexão
 * 3. Verificação pós-desconexão
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

async function testDisconnect() {
  console.log('🧪 Testando desconexão de calendários...\n')

  try {
    // 1. Buscar usuários com calendários conectados
    console.log('1️⃣ Buscando usuários com calendários conectados...')
    const { data: userCalendars, error: calendarError } = await supabase
      .from('user_calendars')
      .select('user_id, google_calendar_id, calendar_name, is_active')
      .eq('is_active', true)
      .limit(1)

    if (calendarError) {
      throw new Error(`Erro ao buscar calendários: ${calendarError.message}`)
    }

    if (!userCalendars || userCalendars.length === 0) {
      console.log('⚠️  Nenhum calendário ativo encontrado')
      return
    }

    const testUser = userCalendars[0]
    console.log(`✅ Usuário encontrado: ${testUser.user_id}`)
    console.log(`✅ Calendários conectados: ${userCalendars.length}`)
    
    userCalendars.forEach((cal, index) => {
      console.log(`   ${index + 1}. ${cal.calendar_name} (${cal.google_calendar_id})`)
    })

    // 2. Verificar tokens do usuário
    console.log('\n2️⃣ Verificando tokens do usuário...')
    const { data: tokens, error: tokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', testUser.user_id)

    if (tokensError) {
      console.error(`❌ Erro ao buscar tokens: ${tokensError.message}`)
    } else {
      console.log(`✅ Tokens encontrados: ${tokens?.length || 0}`)
    }

    // 3. Testar desconexão (simular o que o front-end faz)
    console.log('\n3️⃣ Testando desconexão...')
    
    // 3.1 Deletar calendários
    console.log('   🗑️  Deletando calendários...')
    const { error: deleteCalendarsError } = await supabase
      .from('user_calendars')
      .delete()
      .eq('user_id', testUser.user_id)

    if (deleteCalendarsError) {
      console.error(`❌ Erro ao deletar calendários: ${deleteCalendarsError.message}`)
      console.error(`❌ Código: ${deleteCalendarsError.code}`)
      console.error(`❌ Detalhes: ${deleteCalendarsError.details}`)
      console.error(`❌ Hint: ${deleteCalendarsError.hint}`)
    } else {
      console.log('✅ Calendários deletados com sucesso')
    }

    // 3.2 Deletar tokens
    console.log('   🗑️  Deletando tokens...')
    const { error: deleteTokensError } = await supabase
      .from('google_calendar_tokens')
      .delete()
      .eq('user_id', testUser.user_id)

    if (deleteTokensError) {
      console.error(`❌ Erro ao deletar tokens: ${deleteTokensError.message}`)
      console.error(`❌ Código: ${deleteTokensError.code}`)
      console.error(`❌ Detalhes: ${deleteTokensError.details}`)
      console.error(`❌ Hint: ${deleteTokensError.hint}`)
    } else {
      console.log('✅ Tokens deletados com sucesso')
    }

    // 4. Verificar resultado
    console.log('\n4️⃣ Verificando resultado...')
    
    const { data: remainingCalendars, error: remainingCalendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', testUser.user_id)

    if (remainingCalendarsError) {
      console.error(`❌ Erro ao verificar calendários restantes: ${remainingCalendarsError.message}`)
    } else {
      console.log(`✅ Calendários restantes: ${remainingCalendars?.length || 0}`)
    }

    const { data: remainingTokens, error: remainingTokensError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', testUser.user_id)

    if (remainingTokensError) {
      console.error(`❌ Erro ao verificar tokens restantes: ${remainingTokensError.message}`)
    } else {
      console.log(`✅ Tokens restantes: ${remainingTokens?.length || 0}`)
    }

    // 5. Verificar políticas RLS
    console.log('\n5️⃣ Verificando políticas RLS...')
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'user_calendars' })
      .catch(() => ({ data: null, error: { message: 'Função get_policies não disponível' } }))

    if (policiesError) {
      console.log(`ℹ️  Não foi possível verificar políticas: ${policiesError.message}`)
    } else {
      console.log('✅ Políticas RLS verificadas')
    }

    console.log('\n✅ Teste de desconexão concluído!')
    console.log('\n📋 Resumo:')
    console.log(`   • Usuário testado: ${testUser.user_id}`)
    console.log(`   • Calendários antes: ${userCalendars.length}`)
    console.log(`   • Tokens antes: ${tokens?.length || 0}`)
    console.log(`   • Calendários depois: ${remainingCalendars?.length || 0}`)
    console.log(`   • Tokens depois: ${remainingTokens?.length || 0}`)

    if (deleteCalendarsError || deleteTokensError) {
      console.log('\n❌ Problemas encontrados:')
      if (deleteCalendarsError) {
        console.log(`   • Erro ao deletar calendários: ${deleteCalendarsError.message}`)
      }
      if (deleteTokensError) {
        console.log(`   • Erro ao deletar tokens: ${deleteTokensError.message}`)
      }
    } else {
      console.log('\n✅ Desconexão realizada com sucesso!')
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Executar o teste
testDisconnect() 