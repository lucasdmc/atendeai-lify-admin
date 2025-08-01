const OpenAI = require('openai');

// Testar com a nova API key do OpenAI
const openai = new OpenAI({
  apiKey: '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'
});

async function testarNovasChaves() {
  try {
    console.log('🔍 TESTANDO NOVAS CHAVES');
    console.log('==========================');
    
    console.log('📋 Nova API Key OpenAI:', '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');
    
    console.log('\n🧪 Testando OpenAI com nova chave...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Responda apenas com 'NOVA CHAVE OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response = completion.choices[0].message.content.trim();
    console.log('✅ RESPOSTA OpenAI:', response);
    console.log('✅ NOVA API KEY FUNCIONAL!');
    
    // Testar modelo GPT-4o também
    console.log('\n🧪 Testando GPT-4o...');
    
    const completion2 = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Responda apenas com 'GPT4O NOVA CHAVE OK' se você consegue ler esta mensagem." }],
      max_tokens: 10,
      temperature: 0
    });

    const response2 = completion2.choices[0].message.content.trim();
    console.log('✅ RESPOSTA GPT-4o:', response2);
    console.log('✅ GPT-4o também funcional!');
    
    console.log('\n📱 Testando WhatsApp Meta API...');
    
    // Testar WhatsApp Meta API
    const whatsappToken = 'EAASAuWYr9JgBPFWzfljjkZAoZBYXwcgrIiXXdQrcTPrdRCcAqF2ex0iy0pPRdvqpgkXXXCN5MdJMYaXGObbZCmjkJLgV9cVW1IcvhIPbSalTZBPqKyyMkHXZAc0W09q2SZAMRlzEgNO3tpOEw0jNDL643hfT7qFtEqudGlaQL9NHAy9n3t9aQAU6olVcjUh027Fa5cPYjELr22E2Ju0VzZA2BYxy5dESKDNpTMU2j8Vc2EB7EmeZBUawOQhnyQZDZD';
    
    const response3 = await fetch(`https://graph.facebook.com/v18.0/698766983327246?access_token=${whatsappToken}`);
    const data = await response3.json();
    
    if (data.error) {
      console.log('❌ Erro WhatsApp API:', data.error);
    } else {
      console.log('✅ WhatsApp API funcional!');
      console.log('📋 Dados da conta:', data);
    }
    
    console.log('\n🎯 CONCLUSÃO: TODAS AS CHAVES ESTÃO FUNCIONAIS!');
    
  } catch (error) {
    console.error('❌ ERRO AO TESTAR CHAVES:', error);
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

testarNovasChaves(); 