// ========================================
// CORREÇÃO DO TOKEN WHATSAPP META
// ========================================

import dotenv from 'dotenv';

dotenv.config();

async function fixWhatsAppToken() {
  console.log('🔧 CORREÇÃO DO TOKEN WHATSAPP META');
  console.log('====================================');
  
  try {
    // Verificar configurações atuais
    console.log('\n📋 1. Verificando configurações atuais...');
    
    const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    const webhookUrl = process.env.WEBHOOK_URL;
    
    console.log('Token configurado:', accessToken ? '✅ Sim' : '❌ Não');
    console.log('Phone Number ID:', phoneNumberId || '❌ Não configurado');
    console.log('Webhook URL:', webhookUrl || '❌ Não configurado');
    
    if (!accessToken || !phoneNumberId) {
      console.log('\n❌ Configurações incompletas do WhatsApp');
      console.log('📋 Para corrigir:');
      console.log('1. Acesse https://developers.facebook.com/apps/');
      console.log('2. Vá para seu app do WhatsApp Business API');
      console.log('3. Copie o Access Token e Phone Number ID');
      console.log('4. Atualize o arquivo .env');
      return;
    }
    
    // Testar token atual
    console.log('\n📋 2. Testando token atual...');
    
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?access_token=${accessToken}`);
      const data = await response.json();
      
      if (data.error) {
        console.log('❌ Token expirado ou inválido:', data.error.message);
        console.log('📋 Código de erro:', data.error.code);
        
        if (data.error.code === 190) {
          console.log('\n🔄 TOKEN EXPIRADO - NECESSÁRIA RENOVAÇÃO');
          console.log('📋 Para renovar o token:');
          console.log('1. Acesse: https://developers.facebook.com/apps/');
          console.log('2. Selecione seu app do WhatsApp Business API');
          console.log('3. Vá em "WhatsApp > Getting Started"');
          console.log('4. Clique em "Regenerate" no Access Token');
          console.log('5. Copie o novo token');
          console.log('6. Atualize o arquivo .env');
        }
      } else {
        console.log('✅ Token válido');
        console.log('📱 Informações do WhatsApp:');
        console.log('- Nome:', data.name || 'N/A');
        console.log('- Status:', data.verified_name || 'N/A');
      }
    } catch (error) {
      console.log('❌ Erro ao testar token:', error.message);
    }
    
    // Verificar webhook
    console.log('\n📋 3. Verificando configuração do webhook...');
    
    if (webhookUrl) {
      console.log('Webhook URL configurada:', webhookUrl);
      
      // Testar se o webhook está acessível
      try {
        const webhookResponse = await fetch(`${webhookUrl}/whatsapp/test`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook acessível');
        } else {
          console.log('❌ Webhook não acessível');
        }
      } catch (error) {
        console.log('❌ Erro ao testar webhook:', error.message);
      }
    } else {
      console.log('❌ Webhook URL não configurada');
    }
    
    // Instruções para correção
    console.log('\n📋 4. INSTRUÇÕES PARA CORREÇÃO:');
    console.log('====================================');
    console.log('');
    console.log('🔑 RENOVAR TOKEN WHATSAPP:');
    console.log('1. Acesse: https://developers.facebook.com/apps/');
    console.log('2. Selecione seu app do WhatsApp Business API');
    console.log('3. Vá em "WhatsApp > Getting Started"');
    console.log('4. Clique em "Regenerate" no Access Token');
    console.log('5. Copie o novo token (começa com EAAS...)');
    console.log('');
    console.log('📱 CONFIGURAR WEBHOOK:');
    console.log('1. No mesmo painel, vá em "WhatsApp > Webhooks"');
    console.log('2. Clique em "Configure"');
    console.log('3. URL do Webhook: https://atendeai.com.br/webhook/whatsapp-meta');
    console.log('4. Verify Token: (crie um token de verificação)');
    console.log('5. Selecione: messages, message_deliveries');
    console.log('');
    console.log('⚙️ ATUALIZAR .ENV:');
    console.log('1. Abra o arquivo .env');
    console.log('2. Atualize WHATSAPP_META_ACCESS_TOKEN com o novo token');
    console.log('3. Verifique se WHATSAPP_META_PHONE_NUMBER_ID está correto');
    console.log('4. Salve o arquivo');
    console.log('');
    console.log('🧪 TESTAR:');
    console.log('1. Reinicie o servidor: npm start');
    console.log('2. Envie uma mensagem para o WhatsApp');
    console.log('3. Verifique se recebe resposta');
    
    // Criar script de teste
    console.log('\n📋 5. Criando script de teste...');
    
    const testScript = `
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
    console.log('\\n📋 1. Verificando configurações...');
    
    const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.log('❌ Configurações do WhatsApp incompletas');
      return;
    }
    
    console.log('✅ Configurações presentes');
    
    // 2. Testar token
    console.log('\\n📋 2. Testando token...');
    
    const response = await fetch(\`https://graph.facebook.com/v18.0/\${phoneNumberId}?access_token=\${accessToken}\`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Token ainda inválido:', data.error.message);
      return;
    }
    
    console.log('✅ Token válido');
    
    // 3. Testar webhook
    console.log('\\n📋 3. Testando webhook...');
    
    const webhookResponse = await fetch('http://localhost:3001/webhook/whatsapp/test');
    const webhookData = await webhookResponse.json();
    
    if (webhookData.success) {
      console.log('✅ Webhook funcionando');
    } else {
      console.log('❌ Webhook com problemas');
    }
    
    // 4. Testar IA
    console.log('\\n📋 4. Testando IA...');
    
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
    
    console.log('\\n🎉 TESTE CONCLUÍDO - SISTEMA PRONTO!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testWhatsAppAfterFix().catch(console.error);
`;

    const fs = await import('fs');
    fs.writeFileSync('test-whatsapp-after-fix.js', testScript);
    console.log('✅ Script de teste criado: test-whatsapp-after-fix.js');
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Renove o token do WhatsApp Meta');
    console.log('2. Atualize o arquivo .env');
    console.log('3. Execute: node test-whatsapp-after-fix.js');
    console.log('4. Teste enviando uma mensagem para o WhatsApp');
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO:', error);
  }
}

// Executar correção
fixWhatsAppToken().catch(console.error); 