// Script para verificar a configuração do webhook no Meta Developer Console
import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const ACCESS_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_META_PHONE_NUMBER_ID;

async function checkWebhookConfig() {
  try {
    console.log('🔍 Verificando configuração do webhook...');
    console.log('📱 Phone Number ID:', PHONE_NUMBER_ID);
    console.log('🔑 Access Token:', ACCESS_TOKEN ? 'CONFIGURADO' : 'NÃO CONFIGURADO');

    // Verificar configuração do webhook
    const webhookUrl = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/subscribed_apps`;
    
    const response = await axios.get(webhookUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    console.log('📋 Configuração do webhook:', JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      console.log('✅ Webhook configurado com apps:', data.data.length);
      data.data.forEach(app => {
        console.log(`   - App ID: ${app.id}`);
        console.log(`   - Status: ${app.status || 'N/A'}`);
      });
    } else {
      console.log('❌ Nenhum app configurado para o webhook');
    }

    // Verificar configuração específica do webhook
    const webhookConfigUrl = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}`;
    
    const configResponse = await axios.get(webhookConfigUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const configData = configResponse.data;
    console.log('📱 Configuração do número:', JSON.stringify(configData, null, 2));

  } catch (error) {
    console.error('❌ Erro ao verificar configuração:', error.response?.data || error.message);
  }
}

checkWebhookConfig(); 