#!/usr/bin/env node

// Script para debugar problema de produção
// Verifica onde a URL incorreta está sendo usada

console.log('🔍 DEBUGANDO PROBLEMA DE PRODUÇÃO');
console.log('==================================');

// 1. Verificar variáveis de ambiente
console.log('\n📋 Variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_WHATSAPP_SERVER_URL:', process.env.VITE_WHATSAPP_SERVER_URL);
console.log('VITE_BACKEND_URL:', process.env.VITE_BACKEND_URL);

// 2. Verificar arquivos de configuração
const fs = require('fs');
const path = require('path');

console.log('\n📁 Verificando arquivos de configuração:');

const configFiles = [
    '.env',
    '.env.production',
    'lovable.json',
    'lify.json'
];

configFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('seu-servidor-vps.com')) {
            console.log(`❌ ${file} contém URL incorreta`);
        } else if (content.includes('31.97.241.19')) {
            console.log(`✅ ${file} contém URL correta`);
        } else {
            console.log(`⚠️ ${file} não contém URL do servidor`);
        }
    } else {
        console.log(`⚠️ ${file} não encontrado`);
    }
});

// 3. Verificar configuração do frontend
console.log('\n🎨 Verificando configuração do frontend:');

const environmentFile = 'src/config/environment.ts';
if (fs.existsSync(environmentFile)) {
    const content = fs.readFileSync(environmentFile, 'utf8');
    if (content.includes('31.97.241.19')) {
        console.log('✅ environment.ts contém URL correta');
    } else {
        console.log('❌ environment.ts não contém URL correta');
    }
} else {
    console.log('⚠️ environment.ts não encontrado');
}

// 4. Verificar se o servidor está funcionando
console.log('\n🖥️ Verificando servidor:');

const https = require('https');

function checkServer(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            console.log(`✅ ${url} - Status: ${res.statusCode}`);
            resolve(true);
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${url} - Erro: ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log(`⏰ ${url} - Timeout`);
            req.destroy();
            resolve(false);
        });
    });
}

async function checkServers() {
    const servers = [
        'https://localhost:3001/health',
        'https://31.97.241.19:3001/health'
    ];
    
    for (const server of servers) {
        await checkServer(server);
    }
}

checkServers().then(() => {
    console.log('\n🎯 DIAGNÓSTICO:');
    console.log('================');
    console.log('');
    console.log('Se o erro persiste em produção, pode ser:');
    console.log('');
    console.log('1. 🔄 Cache do navegador:');
    console.log('   - Limpe o cache do navegador');
    console.log('   - Use Ctrl+F5 para forçar reload');
    console.log('');
    console.log('2. ⚙️ Variáveis de ambiente do Lify:');
    console.log('   - Acesse o dashboard do Lify');
    console.log('   - Verifique as variáveis de ambiente');
    console.log('   - Certifique-se que VITE_WHATSAPP_SERVER_URL está correto');
    console.log('');
    console.log('3. 🚀 Deploy necessário:');
    console.log('   - Faça commit das alterações');
    console.log('   - Push para o repositório');
    console.log('   - Aguarde o deploy automático');
    console.log('');
    console.log('4. 🔧 Configuração manual:');
    console.log('   - No dashboard do Lify, adicione:');
    console.log('     VITE_WHATSAPP_SERVER_URL=https://31.97.241.19:3001');
    console.log('     VITE_BACKEND_URL=https://31.97.241.19:3001');
    console.log('');
    console.log('5. 🧪 Teste local:');
    console.log('   - npm run dev');
    console.log('   - Teste a geração de QR Code');
    console.log('   - Verifique se funciona localmente');
}); 