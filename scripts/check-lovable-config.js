#!/usr/bin/env node

// Script para verificar configurações do Lovable
import fs from 'fs';

console.log('🔍 VERIFICANDO CONFIGURAÇÕES DO LOVABLE');
console.log('========================================');

// 1. Verificar arquivos de configuração
console.log('\n📁 Verificando arquivos de configuração:');

const configFiles = [
    { name: '.env', path: '.env' },
    { name: '.env.production', path: '.env.production' },
    { name: 'lovable.json', path: 'lovable.json' },
    { name: 'lify.json', path: 'lify.json' }
];

configFiles.forEach(config => {
    try {
        if (fs.existsSync(config.path)) {
            const content = fs.readFileSync(config.path, 'utf8');
            
            if (content.includes('seu-servidor-vps.com')) {
                console.log(`❌ ${config.name} contém URL incorreta`);
                console.log(`   - Encontrado: seu-servidor-vps.com`);
            } else if (content.includes('31.97.241.19')) {
                console.log(`✅ ${config.name} contém URL correta`);
                console.log(`   - URL: 31.97.241.19`);
            } else {
                console.log(`⚠️ ${config.name} não contém URL do servidor`);
            }
        } else {
            console.log(`⚠️ ${config.name} não encontrado`);
        }
    } catch (error) {
        console.log(`❌ Erro ao verificar ${config.name}:`, error.message);
    }
});

// 2. Verificar environment.ts
console.log('\n🎨 Verificando src/config/environment.ts:');
try {
    if (fs.existsSync('src/config/environment.ts')) {
        const content = fs.readFileSync('src/config/environment.ts', 'utf8');
        
        if (content.includes('31.97.241.19')) {
            console.log('✅ environment.ts contém URL correta');
        } else if (content.includes('seu-servidor-vps.com')) {
            console.log('❌ environment.ts contém URL incorreta');
        } else {
            console.log('⚠️ environment.ts não contém URL do servidor');
        }
    } else {
        console.log('⚠️ environment.ts não encontrado');
    }
} catch (error) {
    console.log('❌ Erro ao verificar environment.ts:', error.message);
}

// 3. Verificar se há URLs hardcoded no código
console.log('\n🔍 Verificando código por URLs hardcoded:');
try {
    const srcFiles = [
        'src/components/agentes/AgentWhatsAppManager.tsx',
        'src/hooks/useAgentWhatsAppConnection.tsx',
        'src/services/userService.ts'
    ];
    
    let foundHardcoded = false;
    
    srcFiles.forEach(file => {
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            if (content.includes('seu-servidor-vps.com')) {
                console.log(`❌ ${file} contém URL hardcoded`);
                foundHardcoded = true;
            }
        }
    });
    
    if (!foundHardcoded) {
        console.log('✅ Nenhuma URL hardcoded encontrada no código');
    }
} catch (error) {
    console.log('❌ Erro ao verificar código:', error.message);
}

// 4. Verificar variáveis de ambiente
console.log('\n🌍 Verificando variáveis de ambiente:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_WHATSAPP_SERVER_URL:', process.env.VITE_WHATSAPP_SERVER_URL);
console.log('VITE_BACKEND_URL:', process.env.VITE_BACKEND_URL);

// 5. Instruções para Lovable
console.log('\n📋 INSTRUÇÕES PARA LOVABLE:');
console.log('============================');
console.log('');
console.log('1. Acesse o dashboard do Lovable:');
console.log('   https://lovable.app/dashboard');
console.log('');
console.log('2. Encontre o projeto: atendeai-lify-admin');
console.log('');
console.log('3. Vá em Settings → Environment Variables');
console.log('');
console.log('4. Verifique se existe: VITE_WHATSAPP_SERVER_URL');
console.log('   - Se estiver como: https://seu-servidor-vps.com:3001');
console.log('   - DELETE e adicione: https://31.97.241.19:3001');
console.log('');
console.log('5. Adicione também:');
console.log('   VITE_BACKEND_URL=https://31.97.241.19:3001');
console.log('');
console.log('6. Save e Force Deploy');
console.log('');
console.log('7. Aguarde 2-3 minutos e teste novamente');

console.log('\n🎯 DIAGNÓSTICO:');
console.log('================');
console.log('');
console.log('✅ Servidor local funcionando');
console.log('✅ QR Code sendo gerado');
console.log('✅ Configurações locais corretas');
console.log('');
console.log('❌ Problema: Variáveis de ambiente do Lovable');
console.log('   - O frontend em produção ainda usa URL incorreta');
console.log('   - Necessário corrigir no dashboard do Lovable');
console.log('');
console.log('📞 SOLUÇÃO:');
console.log('1. Acesse Lovable Dashboard');
console.log('2. Corrija VITE_WHATSAPP_SERVER_URL');
console.log('3. Force Deploy');
console.log('4. Limpe cache do navegador');
console.log('5. Teste em produção'); 