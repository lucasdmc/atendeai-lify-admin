const OpenAI = require('openai');

// Testar com a API key atual do VPS
const openai = new OpenAI({
  apiKey: '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'
});

async function testOpenAIAPI() {
  try {
    console.log('🔍 TESTANDO API KEY DO OPENAI');
    console.log('================================');
    
    console.log('📋 API Key:', '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');
    
    console.log('\n🧪 Testando chamada simples...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responda apenas com 'OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    console.log('✅ RESPOSTA:', response);
    console.log('✅ API KEY FUNCIONAL!');
    
    // Testar modelo GPT-4o também
    console.log('\n🧪 Testando GPT-4o...');
    
    const completion2 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Responda apenas com 'GPT4O OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response2 = completion2.choices[0].message.content.trim();
    console.log('✅ RESPOSTA GPT-4o:', response2);
    console.log('✅ GPT-4o também funcional!');
    
    console.log('\n🎯 CONCLUSÃO: API KEY ESTÁ FUNCIONAL!');
    
  } catch (error) {
    console.error('❌ ERRO AO TESTAR API KEY:', error);
    console.log('🔍 Código do erro:', error.code);
    console.log('📋 Mensagem:', error.message);
    console.log('💡 Status:', error.status);
    
    if (error.code === 'invalid_api_key') {
      console.log('❌ API KEY INVÁLIDA!');
    } else if (error.code === 'insufficient_quota') {
      console.log('❌ QUOTA INSUFICIENTE!');
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('❌ LIMITE DE TAXA EXCEDIDO!');
    } else {
      console.log('❌ OUTRO ERRO:', error.code);
    }
  }
}

testOpenAIAPI(); 