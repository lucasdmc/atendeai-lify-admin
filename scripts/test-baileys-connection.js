#!/usr/bin/env node

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

console.log('🧪 Testando conexão Baileys diretamente...\n');

async function testBaileysConnection() {
  try {
    console.log('1. Verificando versão do Baileys...');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`✅ Baileys version: ${version.join('.')} (latest: ${isLatest})`);
    
    console.log('\n2. Criando diretório de sessão...');
    const sessionDir = path.join(process.cwd(), 'test-session');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    console.log(`✅ Session directory: ${sessionDir}`);
    
    console.log('\n3. Inicializando autenticação...');
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    console.log('✅ Authentication state initialized');
    
    console.log('\n4. Criando socket Baileys...');
    const logger = pino({ level: 'warn' });
    
    const sock = makeWASocket({
      version,
      logger,
      auth: state,
      printQRInTerminal: true, // Imprimir QR no terminal para teste
      browser: ['Chrome (Linux)', '', ''],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 120000,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true
    });
    
    console.log('✅ Baileys socket created');
    
    console.log('\n5. Aguardando QR Code...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('❌ Timeout aguardando QR Code');
        reject(new Error('Timeout'));
      }, 30000); // 30 segundos
      
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('📡 Connection update:', { connection, hasQR: !!qr });
        
        if (qr) {
          console.log('✅ QR Code recebido!');
          
          try {
            const qrCodeData = await qrcode.toDataURL(qr, {
              errorCorrectionLevel: 'M',
              type: 'image/png',
              quality: 0.92,
              margin: 1,
              width: 256
            });
            
            console.log('✅ QR Code gerado com sucesso');
            console.log(`📊 Tamanho do QR Code: ${qrCodeData.length} caracteres`);
            
            clearTimeout(timeout);
            resolve(qrCodeData);
          } catch (error) {
            console.log('❌ Erro ao gerar QR Code:', error.message);
            clearTimeout(timeout);
            reject(error);
          }
        }
        
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          console.log('❌ Connection closed:', { 
            shouldReconnect, 
            error: lastDisconnect?.error?.message 
          });
          
          if (!shouldReconnect) {
            clearTimeout(timeout);
            reject(new Error('Connection closed'));
          }
        }
        
        if (connection === 'open') {
          console.log('✅ Connection opened!');
          clearTimeout(timeout);
          resolve('CONNECTED');
        }
      });
      
      sock.ev.on('creds.update', saveCreds);
      
      sock.ev.on('error', (error) => {
        console.log('❌ Socket error:', error.message);
        clearTimeout(timeout);
        reject(error);
      });
    });
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
    throw error;
  }
}

// Executar teste
testBaileysConnection()
  .then((result) => {
    console.log('\n🎉 Teste concluído com sucesso!');
    if (typeof result === 'string' && result.startsWith('data:image')) {
      console.log('✅ QR Code real gerado!');
    } else if (result === 'CONNECTED') {
      console.log('✅ Conexão estabelecida!');
    }
  })
  .catch((error) => {
    console.log('\n❌ Teste falhou:', error.message);
    process.exit(1);
  }); 