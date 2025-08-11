#!/usr/bin/env node

// ========================================
// TESTE DIRETO DA FUNÇÃO fixMessageFormatting
// ========================================
// Este arquivo testa diretamente se a função está funcionando

// Simular a função exata que está no sistema (versão melhorada e direta)
function fixMessageFormatting(text) {
  console.log('🔧 [LLMOrchestrator] Aplicando correção automática de formatação');
  
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let cleaned = text;
  
  // 1. Remover caracteres especiais problemáticos (⁠, etc.)
  cleaned = cleaned.replace(/[⁠]/g, '');
  
  // 🔧 CORREÇÃO ESPECÍFICA E DIRETA: Quebras de linha incorretas em nomes com negrito
  // Corrigir padrões como "*Dr.\n\nRoberto Silva*" para "*Dr. Roberto Silva*"
  cleaned = cleaned.replace(/\*\s*([^*]+)\s*\n+\s*([^*]+)\*/gi, '*$1 $2*');
  
  // 🔧 CORREÇÃO ESPECÍFICA: Formatação de listas com traços
  // Corrigir padrões como "- *Dr.\n\nRoberto Silva*:" para "- *Dr. Roberto Silva*:"
  cleaned = cleaned.replace(/-\s*\*\s*([^*]+)\s*\n+\s*([^*]+)\*:/gi, '- *$1 $2*:');
  
  // 🔧 CORREÇÃO ESPECÍFICA: Adicionar quebras de linha após cada item de lista com traços
  // Para o padrão específico identificado pelo usuário
  cleaned = cleaned.replace(/(-\s*\*[^*]+\*[^:]*:)/gi, '$1\n');
  
  // 🔧 CORREÇÃO ESPECÍFICA: Garantir que o título tenha quebra de linha adequada
  cleaned = cleaned.replace(/(conta com os seguintes médicos:)/gi, '$1\n\n');
  cleaned = cleaned.replace(/(conta com os seguintes profissionais:)/gi, '$1\n\n');
  cleaned = cleaned.replace(/(contamos com dois profissionais especializados em cardiologia:)/gi, '$1\n\n');
  cleaned = cleaned.replace(/(oferece os seguintes exames:)/gi, '$1\n\n');
  
  // 🔧 CORREÇÃO ESPECÍFICA: Garantir que a conclusão tenha quebra de linha adequada
  cleaned = cleaned.replace(/(Ambos são dedicados)/gi, '\n\n$1');
  cleaned = cleaned.replace(/(Esses exames são essenciais)/gi, '\n\n$1');
  cleaned = cleaned.replace(/(Ambos estão disponíveis)/gi, '\n\n$1');
  
  // 🔧 CORREÇÃO ESPECÍFICA: Garantir que a ação tenha quebra de linha adequada
  cleaned = cleaned.replace(/(Caso precise de mais informações)/gi, '\n\n$1');
  cleaned = cleaned.replace(/(Se precisar de mais informações)/gi, '\n\n$1');
  cleaned = cleaned.replace(/(Caso tenha interesse)/gi, '\n\n$1');
  cleaned = cleaned.replace(/(Se precisar agendar)/gi, '\n\n$1');
  
  // 2. Corrigir espaçamento após números em listas (se houver)
  cleaned = cleaned.replace(/(\d+\.)\s*⁠\s*⁠/gi, '$1 ');
  
  // 3. Separar itens de lista que estão juntos (se houver)
  cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)\s*(\d+\.)/gi, '$1\n$2');
  
  // 4. Adicionar quebras de linha após cada item de lista (se houver)
  cleaned = cleaned.replace(/(\d+\.\s*[^:]+:\s*[^.]+\.)/gi, '$1\n');
  
  // 5. Normalizar quebras de linha (máximo 2 consecutivas)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 6. Garantir espaçamento adequado entre seções
  cleaned = cleaned.replace(/([.!?])\s*([A-Z])/gi, '$1\n\n$2');
  
  // 7. Remover quebras de linha extras no final
  cleaned = cleaned.replace(/\n+$/, '');
  
  // 8. Limpar espaços múltiplos
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // 9. Normalizar quebras de linha finais
  cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
  
  console.log('✅ [LLMOrchestrator] Formatação corrigida automaticamente');
  return cleaned.trim();
}

console.log('🚨 TESTE DIRETO DA FUNÇÃO fixMessageFormatting');
console.log('===============================================\n');

// ========================================
// TESTE COM O EXEMPLO ESPECÍFICO DO USUÁRIO
// ========================================
console.log('📋 TESTE COM EXEMPLO ESPECÍFICO DO USUÁRIO');
console.log('--------------------------------------------');

const mensagemProblematica = `A CardioPrime conta com os seguintes médicos: - *Dr.

Roberto Silva*: Especialista em cardiologia, com experiência em cuidados cardiovasculares e procedimentos intervencionistas. - *Dra.

Maria Fernanda*: Também especialista em cardiologia, dedicada à avaliação e tratamento de condições cardíacas, oferecendo um atendimento de qualidade.

Caso precise de mais informações ou deseje agendar uma consulta, estou à disposição para ajudar.`;

console.log('❌ ANTES (Problemática - Quebras de linha incorretas):');
console.log(mensagemProblematica);
console.log('\n' + '='.repeat(80) + '\n');

const mensagemCorrigida = fixMessageFormatting(mensagemProblematica);

console.log('✅ DEPOIS (Corrigida automaticamente):');
console.log(mensagemCorrigida);
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// VERIFICAÇÃO DETALHADA
// ========================================
console.log('🔍 VERIFICAÇÃO DETALHADA');
console.log('-------------------------');

// Verificar se os problemas específicos foram corrigidos
const problemasCorrigidos = {
  nomesComNegrito: !mensagemCorrigida.includes('*Dr.\n\nRoberto Silva*') && 
                   !mensagemCorrigida.includes('*Dra.\n\nMaria Fernanda*'),
  nomesFormatados: mensagemCorrigida.includes('*Dr. Roberto Silva*') && 
                   mensagemCorrigida.includes('*Dra. Maria Fernanda*'),
  listasComTraco: mensagemCorrigida.includes('- *Dr. Roberto Silva*:') && 
                  mensagemCorrigida.includes('- *Dra. Maria Fernanda*:'),
  quebrasLinha: mensagemCorrigida.includes('\n'),
  tituloFormatado: mensagemCorrigida.includes('A CardioPrime conta com os seguintes médicos:\n\n-')
};

console.log('✅ Verificações de correção:');
console.log(`   Nomes com negrito corrigidos: ${problemasCorrigidos.nomesComNegrito ? '✅' : '❌'}`);
console.log(`   Nomes formatados corretamente: ${problemasCorrigidos.nomesFormatados ? '✅' : '❌'}`);
console.log(`   Listas com traço formatadas: ${problemasCorrigidos.listasComTraco ? '✅' : '❌'}`);
console.log(`   Quebras de linha presentes: ${problemasCorrigidos.quebrasLinha ? '✅' : '❌'}`);
console.log(`   Título formatado adequadamente: ${problemasCorrigidos.tituloFormatado ? '✅' : '❌'}`);

const totalCorrecoes = Object.values(problemasCorrigidos).filter(Boolean).length;
console.log(`\n📊 Total de correções aplicadas: ${totalCorrecoes}/5`);

if (totalCorrecoes === 5) {
  console.log('🎉 TODAS AS CORREÇÕES FUNCIONANDO PERFEITAMENTE!');
} else {
  console.log('⚠️ Algumas correções precisam de ajustes.');
}

// ========================================
// DEBUG: MOSTRAR O QUE ESTÁ ACONTECENDO
// ========================================
console.log('\n🔍 DEBUG: ANALISANDO O PROCESSO');
console.log('--------------------------------');

console.log('1. Texto original contém quebras de linha incorretas?');
console.log(`   *Dr.\n\nRoberto Silva*: ${mensagemProblematica.includes('*Dr.\n\nRoberto Silva*') ? 'SIM' : 'NÃO'}`);
console.log(`   *Dra.\n\nMaria Fernanda*: ${mensagemProblematica.includes('*Dra.\n\nMaria Fernanda*') ? 'SIM' : 'NÃO'}`);

console.log('\n2. Regex está funcionando?');
const regexTest = /\*\s*([^*]+)\s*\n+\s*([^*]+)\*/gi;
const match = regexTest.exec(mensagemProblematica);
console.log(`   Match encontrado: ${match ? 'SIM' : 'NÃO'}`);
if (match) {
  console.log(`   Grupo 1: "${match[1]}"`);
  console.log(`   Grupo 2: "${match[2]}"`);
}

console.log('\n3. Substituição está funcionando?');
const testReplace = mensagemProblematica.replace(/\*\s*([^*]+)\s*\n+\s*([^*]+)\*/gi, '*$1 $2*');
console.log(`   Substituição aplicada: ${testReplace !== mensagemProblematica ? 'SIM' : 'NÃO'}`);

console.log('\n✨ TESTE DIRETO CONCLUÍDO!');
