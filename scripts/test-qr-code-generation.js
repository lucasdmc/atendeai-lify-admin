#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testando geração de QR Code...\n');

async function testQRCodeGeneration() {
  try {
    const agentId = '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b';
    
    console.log('1. Testando Edge Function generate-qr:');
    console.log(`   Agent ID: ${agentId}`);
    
    const { data, error } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId }
    });
    
    if (error) {
      console.log('   ❌ Erro:', error.message);
      console.log('   📊 Detalhes do erro:', error);
      return;
    }
    
    console.log('   ✅ Sucesso!');
    console.log('   📊 Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.qrCode) {
      console.log('\n2. Analisando QR Code:');
      console.log(`   Tipo: ${typeof data.qrCode}`);
      console.log(`   Tamanho: ${data.qrCode.length} caracteres`);
      console.log(`   Começa com data:image?: ${data.qrCode.startsWith('data:image')}`);
      console.log(`   Começa com data:image/png?: ${data.qrCode.startsWith('data:image/png')}`);
      console.log(`   Começa com data:image/jpeg?: ${data.qrCode.startsWith('data:image/jpeg')}`);
      
      // Testar se é um base64 válido
      try {
        const base64Data = data.qrCode.split(',')[1];
        if (base64Data) {
          const buffer = Buffer.from(base64Data, 'base64');
          console.log(`   Base64 válido: ${buffer.length} bytes`);
          console.log(`   Primeiros bytes: ${buffer.slice(0, 8).toString('hex')}`);
          
          // Verificar se é um PNG válido (deve começar com 89 50 4E 47)
          if (buffer.slice(0, 4).toString('hex') === '89504e47') {
            console.log('   ✅ Formato PNG válido detectado');
          } else {
            console.log('   ⚠️ Não parece ser um PNG válido');
          }
        } else {
          console.log('   ❌ Não é um data URL válido');
        }
      } catch (e) {
        console.log('   ❌ Erro ao decodificar base64:', e.message);
      }
      
      // Mostrar primeiros 100 caracteres do QR Code
      console.log(`   Primeiros 100 chars: ${data.qrCode.substring(0, 100)}...`);
    } else {
      console.log('   ⚠️ QR Code não encontrado na resposta');
    }
    
    console.log('\n3. Testando backend diretamente:');
    try {
      const backendResponse = await fetch('https://atendeai-backend-production.up.railway.app/api/whatsapp/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('   ✅ Backend respondeu com sucesso');
        console.log('   📊 Resposta do backend:', JSON.stringify(backendData, null, 2));
        
        if (backendData.qrCode) {
          console.log(`   QR Code do backend: ${backendData.qrCode.substring(0, 50)}...`);
        } else {
          console.log('   ⚠️ Backend não retornou QR Code');
        }
      } else {
        console.log(`   ❌ Backend retornou erro: ${backendResponse.status}`);
        const errorText = await backendResponse.text();
        console.log(`   📊 Erro: ${errorText}`);
      }
    } catch (backendError) {
      console.log('   ❌ Erro ao conectar com backend:', backendError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testQRCodeGeneration(); 