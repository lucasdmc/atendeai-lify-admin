// ========================================
// HEALTH CHECK SIMPLIFICADO
// ========================================

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

async function runSimpleHealthCheck() {
  console.log('🏥 VERIFICAÇÃO DE SAÚDE SIMPLIFICADA');
  console.log('=====================================');
  
  try {
    // Validar variáveis de ambiente
    console.log('\n📋 1. Validando variáveis de ambiente...');
    
    const requiredVars = [
      'NODE_ENV',
      'VITE_BACKEND_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'OPENAI_API_KEY'
    ];
    
    let envOk = true;
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        console.log(`❌ ${varName}: Não configurada`);
        envOk = false;
      } else {
        console.log(`✅ ${varName}: Configurada`);
      }
    }
    
    if (!envOk) {
      console.log('❌ Variáveis de ambiente incompletas');
      return false;
    }
    
    console.log('✅ Variáveis de ambiente validadas');
    
    let allGood = true;

    // Teste 1: Conexão com Supabase
    try {
      console.log('\n📊 2. Testando conexão com Supabase...');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
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
      const openai = new OpenAI({ 
        apiKey: process.env.OPENAI_API_KEY 
      });
      
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
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
      
      // Verificar se a tabela existe e é acessível
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      
      console.log('✅ Tabela conversation_memory: Acessível');
      console.log('📊 Colunas disponíveis:', Object.keys(data[0] || {}));
    } catch (error) {
      console.log('❌ Tabela conversation_memory: Erro -', error.message);
      allGood = false;
    }

    // Teste 4: Configuração de ambiente
    try {
      console.log('\n⚙️ 5. Verificando configuração de ambiente...');
      
      const nodeEnv = process.env.NODE_ENV;
      const backendUrl = process.env.VITE_BACKEND_URL;
      
      console.log(`- NODE_ENV: ${nodeEnv}`);
      console.log(`- VITE_BACKEND_URL: ${backendUrl}`);
      
      if (nodeEnv === 'production' && backendUrl === 'https://atendeai.com.br') {
        console.log('✅ Configuração correta para VPS');
      } else if (nodeEnv === 'development' && backendUrl === 'http://localhost:3001') {
        console.log('✅ Configuração correta para desenvolvimento');
      } else {
        console.log('⚠️ Configuração pode precisar de ajustes');
      }
    } catch (error) {
      console.log('❌ Configuração: Erro -', error.message);
      allGood = false;
    }

    // Resultado final
    console.log('\n📊 RESULTADO FINAL:');
    if (allGood) {
      console.log('✅ SISTEMA SAUDÁVEL');
      console.log('🚀 Pronto para produção!');
      return true;
    } else {
      console.log('❌ SISTEMA COM PROBLEMAS');
      console.log('🔧 Verifique as configurações acima');
      return false;
    }

  } catch (error) {
    console.error('💥 ERRO CRÍTICO no health check:', error);
    return false;
  }
}

// Executar health check
runSimpleHealthCheck().catch(console.error); 