const OpenAI = require('openai');

// Testar com a nova API key da OpenAI (mesma da VPS)
const openai = new OpenAI({
  apiKey: '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'
});

async function testarNovaOpenAIKey() {
  try {
    console.log('🔍 TESTANDO NOVA CHAVE OPENAI');
    console.log('================================');
    
    console.log('📋 Nova API Key:', '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');
    
    console.log('\n🧪 Teste 1: Chamada simples...');
    
    const completion1 = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responda apenas com 'NOVA CHAVE OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response1 = completion1.choices[0].message.content.trim();
    console.log('✅ RESPOSTA 1:', response1);
    console.log('✅ Teste simples: OK');
    
    console.log('\n🧪 Teste 2: GPT-4o completo...');
    
    const completion2 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Responda apenas com 'GPT4O NOVA CHAVE OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response2 = completion2.choices[0].message.content.trim();
    console.log('✅ RESPOSTA 2:', response2);
    console.log('✅ Teste GPT-4o: OK');
    
    console.log('\n🧪 Teste 3: Simulação do Dr. Carlos...');
    
    const completion3 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Você é o Dr. Carlos, assistente virtual da CardioPrime. Seja acolhedor e profissional. Use emojis ocasionalmente." 
        },
        { 
          role: "user", 
          content: "Olá! Como posso agendar uma consulta?" 
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const response3 = completion3.choices[0].message.content.trim();
    console.log('✅ RESPOSTA Dr. Carlos:', response3);
    console.log('✅ Teste contextualização: OK');
    
    console.log('\n🧪 Teste 4: Detecção de intenção...');
    
    const completion4 = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Analise a mensagem e classifique a intenção. Responda apenas com: INTENÇÃO|CONFIANÇA" 
        },
        { 
          role: "user", 
          content: "Quais são os horários de funcionamento da clínica?" 
        }
      ],
      max_tokens: 20,
      temperature: 0.3
    });

    const response4 = completion4.choices[0].message.content.trim();
    console.log('✅ RESPOSTA Intenção:', response4);
    console.log('✅ Teste detecção de intenção: OK');
    
    console.log('\n🎯 CONCLUSÃO: NOVA CHAVE OPENAI FUNCIONAL!');
    console.log('✅ Todos os testes passaram');
    console.log('✅ Sistema pronto para usar');
    
  } catch (error) {
    console.error('❌ ERRO AO TESTAR NOVA CHAVE:', error);
    console.log('🔍 Código do erro:', error.code);
    console.log('📋 Mensagem:', error.message);
    console.log('💡 Status:', error.status);
    
    if (error.code === 'invalid_api_key') {
      console.log('❌ API KEY AINDA INVÁLIDA!');
    } else if (error.code === 'insufficient_quota') {
      console.log('❌ QUOTA INSUFICIENTE!');
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('❌ LIMITE DE TAXA EXCEDIDO!');
    } else {
      console.log('❌ OUTRO ERRO:', error.code);
    }
  }
}

testarNovaOpenAIKey(); 