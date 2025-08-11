// test-json-banco-dados.js
// Teste para verificar se o sistema está carregando o JSON do banco de dados

import { ClinicContextManager } from './services/core/index.js';

console.log('🧪 TESTANDO SISTEMA DE CONTEXTUALIZAÇÃO DO BANCO DE DADOS');
console.log('==========================================================');

async function testJsonBancoDados() {
  try {
    // ✅ INICIALIZAR CLINIC CONTEXT MANAGER
    console.log('\n1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    
    // ✅ TESTE 1: Verificar se o sistema está configurado para banco de dados
    console.log('\n2️⃣ Verificando configuração do sistema...');
    
    const stats = ClinicContextManager.getStats();
    console.log('   📊 Estatísticas do sistema:', stats);
    
    // ✅ TESTE 2: Tentar buscar contexto da CardioPrime
    console.log('\n3️⃣ Testando busca de contexto da CardioPrime...');
    
    try {
      const context = await ClinicContextManager.getClinicContext('cardioprime');
      console.log('   🏥 Contexto encontrado:');
      console.log('      - Nome:', context.name);
      console.log('      - Agente:', context.agentConfig?.nome);
      console.log('      - Saudação:', context.agentConfig?.saudacao_inicial);
      console.log('      - Despedida:', context.agentConfig?.mensagem_despedida);
      console.log('      - Fonte:', context.source);
      console.log('      - Tem JSON:', context.hasJsonContext);
      
      if (context.source === 'JSON_FILE') {
        console.log('   ❌ PROBLEMA: Sistema ainda está usando arquivo estático!');
      } else if (context.source === 'DEFAULT') {
        console.log('   ⚠️ AVISO: Sistema usando contexto padrão (sem JSON no banco)');
      } else {
        console.log('   ✅ SUCESSO: Sistema usando JSON do banco de dados!');
      }
      
    } catch (error) {
      console.log('   ❌ Erro ao buscar contexto:', error.message);
    }
    
    // ✅ TESTE 3: Verificar se há clínicas no banco
    console.log('\n4️⃣ Verificando se há clínicas no banco de dados...');
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
      );
      
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('name, contextualization_json, has_contextualization');
      
      if (error) {
        console.log('   ❌ Erro ao buscar clínicas:', error.message);
      } else {
        console.log(`   📋 Clínicas encontradas no banco: ${clinics.length}`);
        
        for (const clinic of clinics) {
          console.log(`      - ${clinic.name}:`);
          console.log(`        * Tem contextualização: ${clinic.has_contextualization ? 'SIM' : 'NÃO'}`);
          console.log(`        * JSON configurado: ${clinic.contextualization_json ? 'SIM' : 'NÃO'}`);
          
          if (clinic.contextualization_json) {
            const hasAgent = !!clinic.contextualization_json.agente_ia;
            const hasConfig = !!clinic.contextualization_json.agente_ia?.configuracao;
            console.log(`        * Tem agente_ia: ${hasAgent ? 'SIM' : 'NÃO'}`);
            console.log(`        * Tem configuração: ${hasConfig ? 'SIM' : 'NÃO'}`);
            
            if (hasConfig) {
              console.log(`        * Nome do agente: ${clinic.contextualization_json.agente_ia.configuracao.nome || 'NÃO DEFINIDO'}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.log('   ❌ Erro ao verificar banco:', error.message);
    }
    
    console.log('\n5️⃣ RESUMO DO TESTE:');
    console.log('   🎯 Sistema configurado para usar APENAS JSON da tela de clínicas');
    console.log('   🎯 NÃO usa mais arquivos estáticos');
    console.log('   🎯 NÃO usa mais diretórios de configuração');
    console.log('   🎯 FONTE ÚNICA: Campo contextualization_json da tabela clinics');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testJsonBancoDados();
