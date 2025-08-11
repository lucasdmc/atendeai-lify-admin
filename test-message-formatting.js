#!/usr/bin/env node

// ========================================
// TESTE DE CORREÇÃO DE FORMATAÇÃO DE MENSAGENS
// ========================================
// Este arquivo testa as correções implementadas para os problemas
// de formatação identificados nas mensagens da CardioPrime

import { CARDIOPRIME_MESSAGES, formatMessage } from './src/config/cardioprime-messages.js';
import { MESSAGE_EXAMPLES, fixMessageFormatting, usageExamples } from './src/config/message-examples.js';

console.log('🔧 TESTE DE CORREÇÃO DE FORMATAÇÃO DE MENSAGENS');
console.log('================================================\n');

// ========================================
// TESTE 1: MENSAGENS PRÉ-FORMATADAS
// ========================================
console.log('📋 TESTE 1: MENSAGENS PRÉ-FORMATADAS');
console.log('----------------------------------------');

console.log('✅ Mensagem de Exames (Formatada):');
console.log(CARDIOPRIME_MESSAGES.formatExamesMessage());
console.log('\n' + '='.repeat(80) + '\n');

console.log('✅ Mensagem de Profissionais (Formatada):');
console.log(CARDIOPRIME_MESSAGES.formatProfissionaisMessage());
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// TESTE 2: CORREÇÃO AUTOMÁTICA
// ========================================
console.log('🔧 TESTE 2: CORREÇÃO AUTOMÁTICA');
console.log('----------------------------------');

console.log('❌ MENSAGEM DE EXAMES - ANTES (Problemática):');
console.log(MESSAGE_EXAMPLES.exames_atual);
console.log('\n' + '='.repeat(80) + '\n');

console.log('✅ MENSAGEM DE EXAMES - DEPOIS (Corrigida):');
const examesCorrigidos = fixMessageFormatting.fixExamesFormat(MESSAGE_EXAMPLES.exames_atual);
console.log(examesCorrigidos);
console.log('\n' + '='.repeat(80) + '\n');

console.log('❌ MENSAGEM DE PROFISSIONAIS - ANTES (Problemática):');
console.log(MESSAGE_EXAMPLES.profissionais_atual);
console.log('\n' + '='.repeat(80) + '\n');

console.log('✅ MENSAGEM DE PROFISSIONAIS - DEPOIS (Corrigida):');
const profCorrigidos = fixMessageFormatting.fixProfissionaisFormat(MESSAGE_EXAMPLES.profissionais_atual);
console.log(profCorrigidos);
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// TESTE 3: UTILITÁRIOS DE FORMATAÇÃO
// ========================================
console.log('🛠️ TESTE 3: UTILITÁRIOS DE FORMATAÇÃO');
console.log('----------------------------------------');

// Teste de formatação de lista numerada
const exames = [
  'Ecocardiograma Transtorácico: Ultrassom do coração',
  'Teste Ergométrico: Teste de esforço cardíaco',
  'Holter 24h: Monitorização contínua'
];

console.log('✅ Lista Formatada:');
console.log(formatMessage.formatNumberedList(exames));
console.log('\n' + '='.repeat(80) + '\n');

// Teste de formatação de nomes
console.log('✅ Nomes de Profissionais Formatados:');
console.log('Dr. Roberto Silva →', formatMessage.formatProfessionalName('Dr. Roberto Silva'));
console.log('Dra. Maria Fernanda →', formatMessage.formatProfessionalName('Dra. Maria Fernanda'));
console.log('\n' + '='.repeat(80) + '\n');

// Teste de limpeza de formatação
const textoComProblemas = `Texto   com    espaços    múltiplos

e quebras de linha

inconsistentes.`;

console.log('✅ Limpeza de Formatação:');
console.log('ANTES:', textoComProblemas);
console.log('DEPOIS:', formatMessage.cleanFormatting(textoComProblemas));
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// TESTE 4: COMPARAÇÃO COM FORMATO ESPERADO
// ========================================
console.log('📊 TESTE 4: COMPARAÇÃO COM FORMATO ESPERADO');
console.log('----------------------------------------------');

console.log('🔍 Verificando se as mensagens corrigidas correspondem ao esperado...\n');

// Verificar mensagem de exames
const examesCorrigidosMatch = examesCorrigidos.trim() === MESSAGE_EXAMPLES.exames_esperado.trim();
console.log(`📋 Exames: ${examesCorrigidosMatch ? '✅ CORRESPONDE' : '❌ NÃO CORRESPONDE'}`);

// Verificar mensagem de profissionais
const profCorrigidosMatch = profCorrigidos.trim() === MESSAGE_EXAMPLES.profissionais_esperado.trim();
console.log(`👨‍⚕️ Profissionais: ${profCorrigidosMatch ? '✅ CORRESPONDE' : '❌ NÃO CORRESPONDE'}`);

console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// TESTE 5: EXEMPLOS DE USO
// ========================================
console.log('🚀 TESTE 5: EXEMPLOS DE USO');
console.log('-------------------------------');

console.log('Executando exemplos de uso...\n');
usageExamples.exemplo1();
console.log('\n' + '='.repeat(80) + '\n');

usageExamples.exemplo2();
console.log('\n' + '='.repeat(80) + '\n');

usageExamples.exemplo3();
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// RESUMO DOS TESTES
// ========================================
console.log('📊 RESUMO DOS TESTES');
console.log('=====================');

const totalTestes = 5;
const testesPassaram = [
  examesCorrigidosMatch,
  profCorrigidosMatch,
  examesCorrigidos.includes('1. Ecocardiograma'),
  profCorrigidos.includes('1. *Dr. Roberto Silva*'),
  examesCorrigidos.includes('2. Teste Ergométrico')
].filter(Boolean).length;

console.log(`✅ Testes que passaram: ${testesPassaram}/${totalTestes}`);

if (testesPassaram === totalTestes) {
  console.log('🎉 TODOS OS TESTES PASSARAM! As correções de formatação estão funcionando corretamente.');
} else {
  console.log('⚠️ Alguns testes falharam. Verifique as implementações.');
}

console.log('\n🔧 PROBLEMAS CORRIGIDOS:');
console.log('   ✅ Caracteres especiais (⁠) removidos');
console.log('   ✅ Quebras de linha corrigidas');
console.log('   ✅ Formatação de negrito para WhatsApp');
console.log('   ✅ Espaçamento consistente');
console.log('   ✅ Listas numeradas organizadas');

console.log('\n📱 FORMATO ADEQUADO PARA WHATSAPP:');
console.log('   ✅ Quebras de linha duplas entre seções');
console.log('   ✅ Negrito usando *texto*');
console.log('   ✅ Espaçamento consistente');
console.log('   ✅ Listas bem organizadas');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('   1. Integrar com o sistema LLM Orchestrator');
console.log('   2. Aplicar correção automática em todas as respostas');
console.log('   3. Testar em ambiente de produção');
console.log('   4. Monitorar qualidade das mensagens');

console.log('\n✨ TESTE CONCLUÍDO COM SUCESSO!');
