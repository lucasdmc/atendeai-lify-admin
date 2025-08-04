
// ========================================
// TESTE WHATSAPP APÓS CORREÇÃO
// ========================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

dotenv.config();

async function testWhatsAppAfterFix() {
  console.log('🧪 TESTE WHATSAPP APÓS CORREÇÃO');
  console.log('==================================');
  
  try {
    // 1. Verificar configurações
    console.log('\n📋 1. Verificando configurações...');
    
    const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.log('❌ Configurações do WhatsApp incompletas');
      return;
    }
    
    console.log('✅ Configurações presentes');
    
    // 2. Testar token
    console.log('\n📋 2. Testando token...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Token ainda inválido:', data.error.message);
      return;
    }
    
    console.log('✅ Token válido');
    
    // 3. Testar webhook
    console.log('\n📋 3. Testando webhook...');
    
    const webhookResponse = await fetch('http://localhost:3001/webhook/whatsapp/test');
    const webhookData = await webhookResponse.json();
    
    if (webhookData.success) {
      console.log('✅ Webhook funcionando');
    } else {
      console.log('❌ Webhook com problemas');
    }
    
    // 4. Testar IA
    console.log('\n📋 4. Testando IA...');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é o Dr. Carlos da CardioPrime. Seja acolhedor.' },
        { role: 'user', content: 'Olá!' }
      ],
      max_tokens: 50,
    });
    
    console.log('✅ IA funcionando');
    console.log('Resposta:', completion.choices[0].message.content);
    
    console.log('\n🎉 TESTE CONCLUÍDO - SISTEMA PRONTO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testWhatsAppAfterFix().catch(console.error);
