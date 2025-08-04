const fs = require('fs');
const path = require('path');

// Carregar o JSON de contextualização da CardioPrime
const contextualizationPath = path.join(__dirname, 'src/data/contextualizacao-cardioprime.json');
const contextualizationData = JSON.parse(fs.readFileSync(contextualizationPath, 'utf8'));

console.log('🔍 TESTE DE FORMATAÇÃO DE PREÇOS');
console.log('=' .repeat(60));

// Função para formatar preços
function formatPrice(price) {
  if (!price) return 'Preço sob consulta';
  
  if (price % 1 === 0) {
    return `R$ ${price},00`;
  } else {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }
}

// Testar formatação de preços
console.log('📊 TESTANDO FORMATAÇÃO DE PREÇOS:');
console.log('-'.repeat(40));

const testPrices = [
  { value: 300, expected: 'R$ 300,00' },
  { value: 400.50, expected: 'R$ 400,50' },
  { value: 250.75, expected: 'R$ 250,75' },
  { value: 100, expected: 'R$ 100,00' },
  { value: null, expected: 'Preço sob consulta' },
  { value: undefined, expected: 'Preço sob consulta' }
];

testPrices.forEach((test, index) => {
  const formatted = formatPrice(test.value);
  const isCorrect = formatted === test.expected;
  console.log(`${isCorrect ? '✅' : '❌'} Teste ${index + 1}: ${test.value} → ${formatted} (esperado: ${test.expected})`);
});

// Verificar preços no JSON
console.log('\n📋 PREÇOS NO JSON DE CONTEXTUALIZAÇÃO:');
console.log('-'.repeat(40));

const servicos = contextualizationData.servicos;

if (servicos.consultas) {
  console.log('💰 CONSULTAS:');
  servicos.consultas.forEach(consulta => {
    const precoFormatado = formatPrice(consulta.preco_particular);
    console.log(`  • ${consulta.nome}: ${precoFormatado}`);
  });
}

if (servicos.exames) {
  console.log('\n💰 EXAMES:');
  servicos.exames.forEach(exame => {
    const precoFormatado = formatPrice(exame.preco_particular);
    console.log(`  • ${exame.nome}: ${precoFormatado}`);
  });
}

// Simular o prompt com preços formatados
console.log('\n📝 SIMULAÇÃO DO PROMPT COM PREÇOS FORMATADOS:');
console.log('-'.repeat(40));

if (servicos.consultas) {
  console.log('- Detalhes das consultas:');
  servicos.consultas.forEach(consulta => {
    const precoFormatado = formatPrice(consulta.preco_particular);
    console.log(`  • ${consulta.nome}: ${consulta.descricao} - ${consulta.duracao_minutos}min - ${precoFormatado}`);
  });
}

if (servicos.exames) {
  console.log('\n- Detalhes dos exames:');
  servicos.exames.forEach(exame => {
    const precoFormatado = formatPrice(exame.preco_particular);
    console.log(`  • ${exame.nome}: ${exame.descricao} - ${exame.duracao_minutos}min - ${precoFormatado}`);
    if (exame.preparacao) {
      console.log(`    Preparação: ${exame.preparacao.instrucoes_especiais}`);
    }
  });
}

// Verificar se os preços estão sendo detectados corretamente
console.log('\n🔍 VERIFICAÇÃO DE DETECÇÃO DE PREÇOS:');
console.log('-'.repeat(40));

const consultaPreco = servicos.consultas?.[0]?.preco_particular;
const examePreco = servicos.exames?.[0]?.preco_particular;

const consultaFormatado = formatPrice(consultaPreco);
const exameFormatado = formatPrice(examePreco);

console.log(`✅ Preço da consulta: ${consultaFormatado}`);
console.log(`✅ Preço do exame: ${exameFormatado}`);

// Verificar diferentes formatos
const formatosValidos = [
  consultaFormatado,
  consultaFormatado.replace(',', '.'),
  consultaFormatado.replace(',00', ''),
  consultaFormatado.replace('R$ ', '')
];

console.log('\n📋 FORMATOS VÁLIDOS PARA DETECÇÃO:');
formatosValidos.forEach(formato => {
  console.log(`  • "${formato}"`);
});

console.log('\n' + '='.repeat(60));
console.log('🏁 TESTE DE FORMATAÇÃO DE PREÇOS FINALIZADO');
console.log('='.repeat(60)); 