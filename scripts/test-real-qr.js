#!/usr/bin/env node

console.log('🔍 Testando geração de QR Code real...\n');

async function testRealQR() {
  try {
    console.log('1. Testando backend Baileys diretamente:');
    
    const response = await fetch('http://31.97.241.19:3001/api/whatsapp/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-real-qr' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Backend respondeu com sucesso');
      console.log('   📊 Resposta:', JSON.stringify(data, null, 2));
      
      if (data.qrCode) {
        console.log('\n2. Analisando QR Code real:');
        console.log(`   Tipo: ${typeof data.qrCode}`);
        console.log(`   Tamanho: ${data.qrCode.length} caracteres`);
        console.log(`   Começa com data:image/png?: ${data.qrCode.startsWith('data:image/png')}`);
        
        // Verificar se é um PNG válido
        try {
          const base64Data = data.qrCode.split(',')[1];
          if (base64Data) {
            const buffer = Buffer.from(base64Data, 'base64');
            console.log(`   Base64 válido: ${buffer.length} bytes`);
            console.log(`   Primeiros bytes: ${buffer.slice(0, 8).toString('hex')}`);
            
            if (buffer.length > 1000) {
              console.log('   ✅ QR Code real detectado (mais de 1KB)');
            } else {
              console.log('   ⚠️ QR Code muito pequeno, pode ser simulado');
            }
          }
        } catch (e) {
          console.log('   ❌ Erro ao decodificar base64:', e.message);
        }
      } else {
        console.log('   ⚠️ QR Code não encontrado na resposta');
      }
    } else {
      console.log(`   ❌ Backend retornou erro: ${response.status}`);
      const errorText = await response.text();
      console.log(`   📊 Erro: ${errorText}`);
    }
    
    console.log('\n3. Testando Edge Function:');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://niakqdolcdwxtrkbqmdi.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
    );
    
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('agent-whatsapp-manager/generate-qr', {
      body: { agentId: '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b' }
    });
    
    if (edgeError) {
      console.log('   ❌ Erro na Edge Function:', edgeError.message);
    } else {
      console.log('   ✅ Edge Function respondeu com sucesso');
      console.log('   📊 Resposta:', JSON.stringify(edgeData, null, 2));
      
      if (edgeData.qrCode && edgeData.qrCode.length > 1000) {
        console.log('   ✅ QR Code real detectado na Edge Function');
      } else {
        console.log('   ⚠️ QR Code pode ser simulado na Edge Function');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testRealQR(); 