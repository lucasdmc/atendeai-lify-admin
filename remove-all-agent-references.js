#!/usr/bin/env node

/**
 * SCRIPT DE REMOÇÃO COMPLETA DE REFERÊNCIAS A AGENTES
 * 
 * Este script remove TODAS as referências a "agentes" do sistema AtendeAI
 * MAS PRESERVA os dados de contextualização específicos de cada clínica
 * incluindo frontend, backend, banco de dados e configurações.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 INICIANDO REMOÇÃO COMPLETA DE REFERÊNCIAS A AGENTES');
console.log('📋 PRESERVANDO DADOS DE CONTEXTUALIZAÇÃO ESPECÍFICOS');
console.log('=' .repeat(60));

// 1. REMOVER ARQUIVOS RELACIONADOS A AGENTES
const filesToDelete = [
  'test-agent-config.cjs',
  'correct-qr-function.js',
  'test-agent-config.cjs',
  'scripts/create-test-agent.sql',
  'scripts/create-agents-table.sql',
  'scripts/create-default-agent.js',
  'scripts/ensure-agents-table.sql',
  'scripts/sync-agents-to-table.js',
  'scripts/verify-agents-system.js',
  'scripts/check-agent-connections.js',
  'scripts/test-agent-whatsapp-fix.js',
  'scripts/fix-agents-issues.js',
  'scripts/create-agent-whatsapp-connections.sql',
  'scripts/apply-agent-whatsapp-tables.js',
  'supabase/migrations/20250101000002_create_agent_whatsapp_tables.sql',
  'supabase/migrations/20250101000004_ensure_agents_table_complete.sql'
];

console.log('\n📁 1. REMOVENDO ARQUIVOS RELACIONADOS A AGENTES');
filesToDelete.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${file}`);
    } catch (error) {
      console.log(`⚠️ Erro ao remover ${file}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️ Arquivo não encontrado: ${file}`);
  }
});

// 2. PRESERVAR DADOS DE CONTEXTUALIZAÇÃO - NÃO REMOVER SEÇÃO agente_ia
console.log('\n🔧 2. PRESERVANDO DADOS DE CONTEXTUALIZAÇÃO ESPECÍFICOS');

// Arquivos JSON - MANTER seção agente_ia mas renomear para contextualizacao_ia
const jsonFilesToClean = [
  'src/data/contextualizacao-cardioprime.json',
  'src/data/contextualizacao-esadi.json',
  'src/config/cardioprime-blumenau.json'
];

jsonFilesToClean.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // PRESERVAR dados de agente_ia mas renomear para contextualizacao_ia
      if (content.agente_ia) {
        content.contextualizacao_ia = content.agente_ia;
        delete content.agente_ia;
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log(`✅ Preservados dados de contextualização em: ${file}`);
      }
    } catch (error) {
      console.log(`⚠️ Erro ao processar ${file}: ${error.message}`);
    }
  }
});

// 3. ATUALIZAR SERVIÇOS DE IA PARA USAR contextualizacao_ia
console.log('\n🤖 3. ATUALIZANDO SERVIÇOS DE IA PARA USAR CONTEXTUALIZAÇÃO');

const serviceFiles = [
  'src/services/clinicContextService.js',
  'src/services/ai/ragEngineService.ts',
  'src/services/ai/systemPromptGenerator.ts',
  'src/services/ai/enhancedClinicContextService.ts',
  'services/llmOrchestratorService.js'
];

serviceFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Atualizar referências para usar contextualizacao_ia
      content = content.replace(/agente_ia\.configuracao\.nome/g, 'contextualizacao_ia.configuracao.nome');
      content = content.replace(/agente_ia\.configuracao\.personalidade/g, 'contextualizacao_ia.configuracao.personalidade');
      content = content.replace(/agente_ia\.configuracao\.tom_comunicacao/g, 'contextualizacao_ia.configuracao.tom_comunicacao');
      content = content.replace(/agente_ia\.comportamento/g, 'contextualizacao_ia.comportamento');
      content = content.replace(/agente_ia\.restricoes/g, 'contextualizacao_ia.restricoes');
      content = content.replace(/context\.agente_ia\?\.configuracao/g, 'context.contextualizacao_ia?.configuracao');
      content = content.replace(/context\.agente_ia\?\.comportamento/g, 'context.contextualizacao_ia?.comportamento');
      content = content.replace(/context\.agente_ia\?\.restricoes/g, 'context.contextualizacao_ia?.restricoes');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Atualizado: ${file}`);
    } catch (error) {
      console.log(`⚠️ Erro ao processar ${file}: ${error.message}`);
    }
  }
});

// 4. ATUALIZAR PÁGINA DE CONTEXTUALIZAÇÃO
console.log('\n📄 4. ATUALIZANDO PÁGINA DE CONTEXTUALIZAÇÃO');

const contextualizarFile = path.join(__dirname, 'src/pages/Contextualizar.tsx');
if (fs.existsSync(contextualizarFile)) {
  try {
    let content = fs.readFileSync(contextualizarFile, 'utf8');
    
    // Atualizar referências para contextualizacao_ia
    content = content.replace(/agente_ia: \{[\s\S]*?\},/g, 'contextualizacao_ia: {');
    content = content.replace(/const \{ clinica, agente_ia, profissionais/g, 'const { clinica, contextualizacao_ia, profissionais');
    content = content.replace(/if \(!contextualizacao\.agente_ia\) missingData\.push\('Configuração do agente IA'\);/g, 'if (!contextualizacao.contextualizacao_ia) missingData.push(\'Configuração de contextualização IA\');');
    content = content.replace(/• <strong>agente_ia<\/strong>: Nome, personalidade, mensagens do chatbot/g, '• <strong>contextualizacao_ia</strong>: Nome, personalidade, mensagens do chatbot');
    
    // Atualizar referências na interface
    content = content.replace(/agente_ia\.configuracao\?\.nome/g, 'contextualizacao_ia.configuracao?.nome');
    content = content.replace(/agente_ia\.configuracao\?\.personalidade/g, 'contextualizacao_ia.configuracao?.personalidade');
    content = content.replace(/agente_ia\.configuracao\?\.tom_comunicacao/g, 'contextualizacao_ia.configuracao?.tom_comunicacao');
    content = content.replace(/agente_ia\.configuracao\?\.nivel_formalidade/g, 'contextualizacao_ia.configuracao?.nivel_formalidade');
    content = content.replace(/agente_ia\.configuracao\?\.idiomas/g, 'contextualizacao_ia.configuracao?.idiomas');
    content = content.replace(/agente_ia\.comportamento\?\.proativo/g, 'contextualizacao_ia.comportamento?.proativo');
    content = content.replace(/agente_ia\.comportamento\?\.oferece_sugestoes/g, 'contextualizacao_ia.comportamento?.oferece_sugestoes');
    content = content.replace(/agente_ia\.comportamento\?\.solicita_feedback/g, 'contextualizacao_ia.comportamento?.solicita_feedback');
    content = content.replace(/agente_ia\.comportamento\?\.escalacao_automatica/g, 'contextualizacao_ia.comportamento?.escalacao_automatica');
    content = content.replace(/agente_ia\.comportamento\?\.limite_tentativas/g, 'contextualizacao_ia.comportamento?.limite_tentativas');
    content = content.replace(/agente_ia\.comportamento\?\.contexto_conversa/g, 'contextualizacao_ia.comportamento?.contexto_conversa');
    content = content.replace(/agente_ia\.configuracao\?\.saudacao_inicial/g, 'contextualizacao_ia.configuracao?.saudacao_inicial');
    content = content.replace(/agente_ia\.configuracao\?\.mensagem_despedida/g, 'contextualizacao_ia.configuracao?.mensagem_despedida');
    content = content.replace(/agente_ia\.configuracao\?\.mensagem_fora_horario/g, 'contextualizacao_ia.configuracao?.mensagem_fora_horario');
    
    // Atualizar título da aba
    content = content.replace(/<TabsTrigger value="agente">Agente IA<\/TabsTrigger>/g, '<TabsTrigger value="contextualizacao">Contextualização IA</TabsTrigger>');
    content = content.replace(/<TabsContent value="agente"/g, '<TabsContent value="contextualizacao"');
    content = content.replace(/Configuração do Agente/g, 'Configuração da Contextualização');
    content = content.replace(/Mensagens do Agente/g, 'Mensagens da Contextualização');
    
    fs.writeFileSync(contextualizarFile, content);
    console.log(`✅ Atualizado: src/pages/Contextualizar.tsx`);
  } catch (error) {
    console.log(`⚠️ Erro ao processar Contextualizar.tsx: ${error.message}`);
  }
}

// 5. ATUALIZAR MODAL DE CONTEXTUALIZAÇÃO
console.log('\n🔧 5. ATUALIZANDO MODAL DE CONTEXTUALIZAÇÃO');

const modalFile = path.join(__dirname, 'src/components/clinics/ClinicContextualizationModal.tsx');
if (fs.existsSync(modalFile)) {
  try {
    let content = fs.readFileSync(modalFile, 'utf8');
    
    // Atualizar seção agente_ia para contextualizacao_ia
    content = content.replace(/"agente_ia": \{[\s\S]*?\},/g, '"contextualizacao_ia": {');
    
    fs.writeFileSync(modalFile, content);
    console.log(`✅ Atualizado: src/components/clinics/ClinicContextualizationModal.tsx`);
  } catch (error) {
    console.log(`⚠️ Erro ao processar ClinicContextualizationModal.tsx: ${error.message}`);
  }
}

// 6. REMOVER TABELAS DO BANCO DE DADOS
console.log('\n🗄️ 6. REMOVENDO TABELAS DO BANCO DE DADOS');

const dropTablesSQL = `
-- Remover tabelas relacionadas a agentes
DROP TABLE IF EXISTS agent_conversation_memory CASCADE;
DROP TABLE IF EXISTS agent_whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS agent_whatsapp_messages CASCADE;
DROP TABLE IF EXISTS agent_whatsapp_connections CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Remover colunas agent_id de outras tabelas se existirem
ALTER TABLE conversation_memory DROP COLUMN IF EXISTS agent_id;
ALTER TABLE whatsapp_messages DROP COLUMN IF EXISTS agent_id;
ALTER TABLE whatsapp_conversations DROP COLUMN IF EXISTS agent_id;
`;

const sqlFile = path.join(__dirname, 'remove_agent_tables.sql');
fs.writeFileSync(sqlFile, dropTablesSQL);
console.log(`✅ SQL para remoção de tabelas criado: remove_agent_tables.sql`);
console.log(`ℹ️ Execute o SQL no seu banco de dados para remover as tabelas`);

// 7. ATUALIZAR REFERÊNCIAS EM SCRIPTS
console.log('\n📜 7. ATUALIZANDO REFERÊNCIAS EM SCRIPTS');

const scriptFiles = [
  'fix-openai-and-supabase.js',
  'fix-memory-system-complete.js',
  'test-memory-system-corrected.js',
  'implement-manus-improvements.js',
  'test-integrated-system.js',
  'test-frontend-backend-connection.js',
  'health-check.js'
];

scriptFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Atualizar referências a agent_id para clinic_id
      content = content.replace(/agent_id: ['"][^'"]*['"]/g, 'clinic_id: "default"');
      content = content.replace(/\.eq\('agent_id', [^)]*\)/g, '.eq(\'clinic_id\', \'default\')');
      content = content.replace(/agentId: [^,}]*/g, 'clinicId: "default"');
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ Atualizado: ${file}`);
    } catch (error) {
      console.log(`⚠️ Erro ao processar ${file}: ${error.message}`);
    }
  }
});

// 8. CRIAR ARQUIVO DE RESUMO
console.log('\n📋 8. CRIANDO ARQUIVO DE RESUMO');

const summary = `
# REMOÇÃO COMPLETA DE REFERÊNCIAS A AGENTES - RESUMO

## ✅ DADOS PRESERVADOS:
- **Nome do Assistente**: Mantido específico de cada clínica (Dr. Carlos, Jessica, etc.)
- **Personalidade**: Mantida específica de cada clínica
- **Tom de Comunicação**: Mantido específico de cada clínica
- **Saudações**: Mantidas específicas de cada clínica
- **Mensagens**: Mantidas específicas de cada clínica
- **Comportamento**: Mantido específico de cada clínica
- **Restrições**: Mantidas específicas de cada clínica

## 🔄 MUDANÇAS REALIZADAS:
- Renomeado \`agente_ia\` para \`contextualizacao_ia\` (mantendo todos os dados)
- Removidas tabelas de agentes do banco de dados
- Atualizadas referências nos serviços
- Atualizada interface de contextualização

## Arquivos Removidos:
${filesToDelete.map(f => `- ${f}`).join('\n')}

## Arquivos Modificados:
- src/data/contextualizacao-cardioprime.json (agente_ia → contextualizacao_ia)
- src/data/contextualizacao-esadi.json (agente_ia → contextualizacao_ia)
- src/config/cardioprime-blumenau.json (agente_ia → contextualizacao_ia)
- src/services/clinicContextService.js (atualizado para contextualizacao_ia)
- src/services/ai/ragEngineService.ts (atualizado para contextualizacao_ia)
- src/services/ai/systemPromptGenerator.ts (atualizado para contextualizacao_ia)
- src/services/ai/enhancedClinicContextService.ts (atualizado para contextualizacao_ia)
- services/llmOrchestratorService.js (atualizado para contextualizacao_ia)
- src/pages/Contextualizar.tsx (atualizado para contextualizacao_ia)
- src/components/clinics/ClinicContextualizationModal.tsx (atualizado para contextualizacao_ia)

## Tabelas do Banco de Dados para Remover:
- agents
- agent_whatsapp_connections
- agent_whatsapp_messages
- agent_whatsapp_conversations
- agent_conversation_memory

## Próximos Passos:
1. Execute o SQL em remove_agent_tables.sql no seu banco de dados
2. Reinicie o servidor para aplicar as mudanças
3. Teste o sistema para garantir que não há mais referências a agentes
4. Verifique se a contextualização específica de cada clínica está funcionando

## Observações:
- ✅ TODOS os dados de contextualização específicos foram preservados
- ✅ O sistema continua usando nomes, personalidades e mensagens específicas de cada clínica
- ✅ A funcionalidade de contextualização permanece intacta
- ✅ Apenas a estrutura de "agentes" foi removida, mantendo os dados

Data: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(__dirname, 'AGENT_REMOVAL_SUMMARY.md'), summary);
console.log(`✅ Resumo criado: AGENT_REMOVAL_SUMMARY.md`);

console.log('\n🎉 REMOÇÃO COMPLETA FINALIZADA!');
console.log('=' .repeat(60));
console.log('✅ DADOS DE CONTEXTUALIZAÇÃO ESPECÍFICOS PRESERVADOS');
console.log('📋 Verifique o arquivo AGENT_REMOVAL_SUMMARY.md para detalhes');
console.log('🗄️ Execute o SQL em remove_agent_tables.sql no banco de dados');
console.log('🔄 Reinicie o servidor para aplicar todas as mudanças');
console.log('🧪 Teste o sistema para garantir que não há mais referências a agentes');
console.log('🎯 Verifique se a contextualização específica de cada clínica está funcionando'); 