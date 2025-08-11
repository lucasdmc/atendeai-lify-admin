#!/usr/bin/env node

// ========================================
// TESTE PASSO A PASSO DA FUNÇÃO DE CORREÇÃO
// ========================================
// Este arquivo testa cada etapa da correção para identificar o problema

console.log('🔍 TESTE PASSO A PASSO DA FUNÇÃO DE CORREÇÃO');
console.log('==============================================\n');

// Texto problemático do usuário
const mensagemOriginal = `A CardioPrime conta com os seguintes médicos: - *Dr.

Roberto Silva*: Especialista em cardiologia, com experiência em cuidados cardiovasculares e procedimentos intervencionistas. - *Dra.

Maria Fernanda*: Também especialista em cardiologia, dedicada à avaliação e tratamento de condições cardíacas, oferecendo um atendimento de qualidade.

Caso precise de mais informações ou deseje agendar uma consulta, estou à disposição para ajudar.`;

console.log('📋 TEXTO ORIGINAL:');
console.log(mensagemOriginal);
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// PASSO 1: Remover caracteres especiais
// ========================================
console.log('🔧 PASSO 1: Remover caracteres especiais');
let passo1 = mensagemOriginal.replace(/[⁠]/g, '');
console.log('Resultado:', passo1);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 2: Corrigir nomes com negrito
// ========================================
console.log('🔧 PASSO 2: Corrigir nomes com negrito');
let passo2 = passo1.replace(/\*\s*([^*]+)\s*\n+\s*([^*]+)\*/gi, '*$1 $2*');
console.log('Resultado:', passo2);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 3: Formatação de listas com traços
// ========================================
console.log('🔧 PASSO 3: Formatação de listas com traços');
let passo3 = passo2.replace(/-\s*\*\s*([^*]+)\s*\n+\s*([^*]+)\*:/gi, '- *$1 $2*:');
console.log('Resultado:', passo3);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 4: Adicionar quebras de linha após itens
// ========================================
console.log('🔧 PASSO 4: Adicionar quebras de linha após itens');
let passo4 = passo3.replace(/(-\s*\*[^*]+\*[^:]*:)/gi, '$1\n');
console.log('Resultado:', passo4);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 5: Garantir quebra de linha no título
// ========================================
console.log('🔧 PASSO 5: Garantir quebra de linha no título');
let passo5 = passo4.replace(/(conta com os seguintes médicos:)/gi, '$1\n\n');
console.log('Resultado:', passo5);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 6: Garantir quebra de linha na conclusão
// ========================================
console.log('🔧 PASSO 6: Garantir quebra de linha na conclusão');
let passo6 = passo5.replace(/(Ambos são dedicados)/gi, '\n\n$1');
console.log('Resultado:', passo6);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 7: Garantir quebra de linha na ação
// ========================================
console.log('🔧 PASSO 7: Garantir quebra de linha na ação');
let passo7 = passo6.replace(/(Caso precise de mais informações)/gi, '\n\n$1');
console.log('Resultado:', passo7);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 8: Normalizar quebras de linha
// ========================================
console.log('🔧 PASSO 8: Normalizar quebras de linha');
let passo8 = passo7.replace(/\n{3,}/g, '\n\n');
console.log('Resultado:', passo8);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 9: Limpar espaços múltiplos
// ========================================
console.log('🔧 PASSO 9: Limpar espaços múltiplos');
let passo9 = passo8.replace(/\s+/g, ' ');
console.log('Resultado:', passo9);
console.log('\n' + '-'.repeat(40) + '\n');

// ========================================
// PASSO 10: Normalizar quebras de linha finais
// ========================================
console.log('🔧 PASSO 10: Normalizar quebras de linha finais');
let passo10 = passo9.replace(/\n\s*\n/g, '\n\n').trim();
console.log('Resultado:', passo10);
console.log('\n' + '='.repeat(80) + '\n');

// ========================================
// VERIFICAÇÃO FINAL
// ========================================
console.log('✅ VERIFICAÇÃO FINAL');
console.log('-------------------');

const problemasCorrigidos = {
  nomesComNegrito: !passo10.includes('*Dr.\n\nRoberto Silva*') && 
                   !passo10.includes('*Dra.\n\nMaria Fernanda*'),
  nomesFormatados: passo10.includes('*Dr. Roberto Silva*') && 
                   passo10.includes('*Dra. Maria Fernanda*'),
  listasComTraco: passo10.includes('- *Dr. Roberto Silva*:') && 
                  passo10.includes('- *Dra. Maria Fernanda*:'),
  quebrasLinha: passo10.includes('\n'),
  tituloFormatado: passo10.includes('A CardioPrime conta com os seguintes médicos:\n\n-'),
  conclusaoFormatada: passo10.includes('\n\nAmbos são dedicados'),
  acaoFormatada: passo10.includes('\n\nCaso precise de mais informações')
};

console.log('✅ Verificações de correção:');
console.log(`   Nomes com negrito corrigidos: ${problemasCorrigidos.nomesComNegrito ? '✅' : '❌'}`);
console.log(`   Nomes formatados corretamente: ${problemasCorrigidos.nomesFormatados ? '✅' : '❌'}`);
console.log(`   Listas com traço formatadas: ${problemasCorrigidos.listasComTraco ? '✅' : '❌'}`);
console.log(`   Quebras de linha presentes: ${problemasCorrigidos.quebrasLinha ? '✅' : '❌'}`);
console.log(`   Título formatado adequadamente: ${problemasCorrigidos.tituloFormatado ? '✅' : '❌'}`);
console.log(`   Conclusão formatada adequadamente: ${problemasCorrigidos.conclusaoFormatada ? '✅' : '❌'}`);
console.log(`   Ação formatada adequadamente: ${problemasCorrigidos.acaoFormatada ? '✅' : '❌'}`);

const totalCorrecoes = Object.values(problemasCorrigidos).filter(Boolean).length;
console.log(`\n📊 Total de correções aplicadas: ${totalCorrecoes}/7`);

if (totalCorrecoes === 7) {
  console.log('🎉 TODAS AS CORREÇÕES FUNCIONANDO PERFEITAMENTE!');
} else {
  console.log('⚠️ Algumas correções precisam de ajustes.');
}

console.log('\n✨ TESTE PASSO A PASSO CONCLUÍDO!');
