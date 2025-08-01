const Anthropic = require('@anthropic-ai/sdk');

// Testar com a nova API key da Anthropic
const anthropic = new Anthropic({
  apiKey: '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'
});

async function testarAnthropicAPI() {
  try {
    console.log('🔍 TESTANDO API KEY DA ANTHROPIC (CLAUDE)');
    console.log('==========================================');
    
    console.log('📋 API Key:', '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');
    
    console.log('\n🧪 Testando Claude 3.5 Sonnet...');
    
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 50,
      messages: [{ role: "user", content: "Responda apenas com 'CLAUDE OK' se você consegue ler esta mensagem." }]
    });

    const response = message.content[0].text;
    console.log('✅ RESPOSTA Claude:', response);
    console.log('✅ API KEY ANTHROPIC FUNCIONAL!');
    
    console.log('\n🧪 Testando Claude com prompt mais complexo...');
    
    const message2 = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [{ 
        role: "user", 
        content: "Você é o Dr. Carlos da CardioPrime. Responda de forma acolhedora: 'Olá! Como posso ajudar?'" 
      }]
    });

    const response2 = message2.content[0].text;
    console.log('✅ RESPOSTA Dr. Carlos:', response2);
    console.log('✅ Claude funcionando perfeitamente!');
    
    console.log('\n🎯 CONCLUSÃO: API KEY ANTHROPIC ESTÁ FUNCIONAL!');
    
  } catch (error) {
    console.error('❌ ERRO AO TESTAR ANTHROPIC API:', error);
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

testarAnthropicAPI(); 