/**
 * TESTE DE CARREGAMENTO DE VARIÁVEIS DE AMBIENTE
 */

import dotenv from 'dotenv';
import fs from 'fs';

console.log('🔧 TESTE DE CARREGAMENTO DE VARIÁVEIS DE AMBIENTE');
console.log('=' .repeat(60));

// Verificar se o arquivo .env existe
console.log('\n📄 VERIFICAÇÃO DO ARQUIVO .ENV:');
console.log('-'.repeat(40));

try {
  if (fs.existsSync('.env')) {
    console.log('✅ Arquivo .env encontrado');
    
    // Ler conteúdo do arquivo
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log(`📏 Tamanho do arquivo: ${envContent.length} caracteres`);
    
    // Verificar se contém as variáveis necessárias
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'WHATSAPP_META_ACCESS_TOKEN',
      'WHATSAPP_META_PHONE_NUMBER_ID'
    ];
    
    console.log('\n🔍 VERIFICAÇÃO DE VARIÁVEIS NO ARQUIVO:');
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        console.log(`✅ ${varName} - Presente no arquivo`);
      } else {
        console.log(`❌ ${varName} - AUSENTE no arquivo`);
      }
    }
    
  } else {
    console.log('❌ Arquivo .env não encontrado');
  }
} catch (error) {
  console.log(`❌ Erro ao ler arquivo .env: ${error.message}`);
}

// Tentar carregar as variáveis de ambiente
console.log('\n🔄 CARREGANDO VARIÁVEIS DE AMBIENTE:');
console.log('-'.repeat(40));

try {
  // Carregar variáveis do arquivo .env
  const result = dotenv.config();
  
  if (result.error) {
    console.log(`❌ Erro ao carregar .env: ${result.error.message}`);
  } else {
    console.log('✅ Variáveis de ambiente carregadas com sucesso');
    console.log(`📁 Arquivo carregado: ${result.parsed ? 'Sim' : 'Não'}`);
    
    if (result.parsed) {
      console.log(`📊 Número de variáveis carregadas: ${Object.keys(result.parsed).length}`);
    }
  }
} catch (error) {
  console.log(`❌ Erro ao carregar dotenv: ${error.message}`);
}

// Verificar variáveis após carregamento
console.log('\n✅ VERIFICAÇÃO FINAL DAS VARIÁVEIS:');
console.log('-'.repeat(40));

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'WHATSAPP_META_ACCESS_TOKEN',
  'WHATSAPP_META_PHONE_NUMBER_ID'
];

let loadedCount = 0;
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Carregada`);
    loadedCount++;
  } else {
    console.log(`❌ ${envVar} - AUSENTE`);
  }
}

// Relatório final
console.log('\n' + '='.repeat(60));
console.log('📊 RELATÓRIO FINAL DO CARREGAMENTO');
console.log('='.repeat(60));

console.log(`\n📈 RESUMO:`);
console.log(`   • Variáveis necessárias: ${requiredEnvVars.length}`);
console.log(`   • Variáveis carregadas: ${loadedCount}`);
console.log(`   • Taxa de sucesso: ${((loadedCount / requiredEnvVars.length) * 100).toFixed(1)}%`);

if (loadedCount === requiredEnvVars.length) {
  console.log('\n🎉 TODAS AS VARIÁVEIS FORAM CARREGADAS COM SUCESSO!');
} else {
  console.log('\n⚠️ ALGUMAS VARIÁVEIS NÃO FORAM CARREGADAS');
  console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
  console.log('   • Verifique se o arquivo .env está no diretório correto');
  console.log('   • Verifique se as variáveis estão definidas corretamente');
  console.log('   • Verifique se não há espaços extras ou caracteres especiais');
  console.log('   • Tente recarregar o terminal');
  console.log('   • Verifique se o dotenv está sendo importado corretamente');
}

console.log('\n✅ TESTE DE CARREGAMENTO CONCLUÍDO!');
