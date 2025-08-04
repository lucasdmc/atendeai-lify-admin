
// ========================================
// SCRIPT DE VERIFICAÇÃO DE SISTEMA
// ========================================

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { validateEnvironment, getEnvironmentConfig } from '../src/config/environment.js';
import dotenv from 'dotenv';

dotenv.config();

async function runHealthCheck() {
  console.log('🏥 Executando verificação de saúde do sistema...\n');
  
  try {
    // Validar variáveis de ambiente
    console.log('📋 1. Validando variáveis de ambiente...');
    validateEnvironment();
    const config = getEnvironmentConfig();
    console.log('✅ Variáveis de ambiente validadas');
    
    let allGood = true;

    // Teste 1: Conexão com Supabase
    try {
      console.log('\n📊 2. Testando conexão com Supabase...');
      const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Supabase: Conectado com sucesso');
    } catch (error) {
      console.log('❌ Supabase: Erro de conexão -', error.message);
      allGood = false;
    }

    // Teste 2: API OpenAI
    try {
      console.log('\n🤖 3. Testando API OpenAI...');
      const openai = new OpenAI({ apiKey: config.openai.apiKey });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Diga apenas 'OK'" }],
        max_tokens: 10
      });
      
      if (response.choices[0].message.content.includes('OK')) {
        console.log('✅ OpenAI: API funcionando corretamente');
      } else {
        throw new Error('Resposta inesperada da API');
      }
    } catch (error) {
      console.log('❌ OpenAI: Erro na API -', error.message);
      allGood = false;
    }

    // Teste 3: Tabela conversation_memory
    try {
      console.log('\n💾 4. Testando tabela conversation_memory...');
      const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
      
      // Tentar inserir e deletar um registro de teste
      const testData = {
        phone_number: '+5500000000000',
        agent_id: 'health_check',
        user_message: 'teste',
        bot_response: 'teste',
        intent: 'TEST',
        confidence: 1.0
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('conversation_memory')
        .insert(testData)
        .select();
        
      if (insertError) throw insertError;
      
      // Deletar o registro de teste
      await supabase
        .from('conversation_memory')
        .delete()
        .eq('id', insertData[0].id);
        
      console.log('✅ Tabela conversation_memory: Funcionando corretamente');
    } catch (error) {
      console.log('❌ Tabela conversation_memory: Erro -', error.message);
      allGood = false;
    }

    // Teste 4: WhatsApp Meta API
    try {
      console.log('\n📱 5. Testando WhatsApp Meta API...');
      
      if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
        throw new Error('Tokens do WhatsApp não configurados');
      }
      
      console.log('✅ WhatsApp Meta: Tokens configurados');
      console.log('📋 Phone Number ID:', config.whatsapp.phoneNumberId);
      console.log('🔑 Access Token:', config.whatsapp.accessToken.substring(0, 20) + '...');
    } catch (error) {
      console.log('❌ WhatsApp Meta: Erro -', error.message);
      allGood = false;
    }

    // Resultado final
    console.log('\n' + '='.repeat(50));
    if (allGood) {
      console.log('🎉 SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('✅ Todos os componentes estão operacionais');
      console.log('🚀 Pronto para produção!');
    } else {
      console.log('⚠️  SISTEMA COM PROBLEMAS!');
      console.log('❌ Alguns componentes precisam de correção');
      console.log('🔧 Corrija os erros antes de usar em produção');
    }
    console.log('='.repeat(50));
    
    return allGood;
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na verificação:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runHealthCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runHealthCheck };
