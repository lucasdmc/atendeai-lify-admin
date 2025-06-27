// Script para testar o serviço de endereço
// Execute com: node scripts/test-address-service.js

const { searchAddressByCEP, searchAddressSuggestions, validateCEP } = require('../src/services/addressService');

async function testAddressService() {
  console.log('🧪 Testando serviço de endereço...\n');

  // Teste 1: Validação de CEP
  console.log('1️⃣ Testando validação de CEP:');
  const testCEPs = ['12345-678', '12345678', '1234', 'abc'];
  
  testCEPs.forEach(cep => {
    const isValid = validateCEP(cep);
    console.log(`   CEP "${cep}": ${isValid ? '✅ Válido' : '❌ Inválido'}`);
  });

  // Teste 2: Busca por CEP
  console.log('\n2️⃣ Testando busca por CEP:');
  try {
    const addressData = await searchAddressByCEP('01310-100'); // Av. Paulista
    console.log('✅ Endereço encontrado:', addressData);
  } catch (error) {
    console.error('❌ Erro ao buscar CEP:', error.message);
  }

  // Teste 3: Busca de sugestões (requer API Key)
  console.log('\n3️⃣ Testando busca de sugestões:');
  try {
    const suggestions = await searchAddressSuggestions('Av. Paulista');
    console.log(`✅ ${suggestions.length} sugestões encontradas`);
    suggestions.slice(0, 3).forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion.description}`);
    });
  } catch (error) {
    console.error('❌ Erro ao buscar sugestões:', error.message);
  }

  console.log('\n✅ Testes concluídos!');
}

// Executar testes
testAddressService().catch(console.error); 