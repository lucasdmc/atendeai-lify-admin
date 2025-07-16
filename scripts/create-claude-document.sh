#!/bin/bash

echo "📄 CRIANDO DOCUMENTO COMPLETO PARA CLAUDE OPUS"
echo "=============================================="

# Criar diretório temporário
TEMP_DIR="claude-document-temp"
mkdir -p "$TEMP_DIR"

echo "📁 Criando diretório temporário: $TEMP_DIR"

# 1. CRIAR RESUMO EXECUTIVO
echo "📋 Criando resumo executivo..."
cat > "$TEMP_DIR/01-RESUMO-EXECUTIVO.md" << 'EOF'
# RESUMO EXECUTIVO - PROBLEMAS DO WHATSAPP

## Contexto do Projeto
Sistema admin-lify: frontend/admin para gerenciar agentes WhatsApp
- **Frontend**: React + TypeScript (porta 8080)
- **Backend Local**: Node.js + whatsapp-web.js (porta 3001)
- **Backend VPS**: Node.js + @whiskeysockets/baileys (31.97.241.19:3001)
- **Edge Function**: Supabase Functions
- **Banco**: Supabase PostgreSQL

## Problemas Identificados

### 1. QR Code Falha na Leitura
- **Sintoma**: QR Code é gerado mas falha ao ser lido pelo WhatsApp
- **Impacto**: Agente não consegue conectar ao WhatsApp
- **Status**: ✅ Resolvido localmente (teste passou)
- **Possíveis Causas**: 
  - Timeout na sessão
  - Problema de autenticação
  - Erro na biblioteca whatsapp-web.js

### 2. Erro 500 na VPS
- **Sintoma**: Edge Function retorna erro 500, mas curl direto funciona
- **Impacto**: Frontend não consegue se comunicar com backend VPS
- **Status**: 🔍 Em investigação
- **Possíveis Causas**:
  - Problema de conectividade entre Edge Function e VPS
  - Erro no endpoint /api/whatsapp/generate-qr
  - Problema de autenticação ou headers

### 3. Falha na Contextualização
- **Sintoma**: Agente não absorve arquivo de contextualização
- **Impacto**: Chatbot não responde adequadamente
- **Status**: 🔍 Em investigação
- **Possíveis Causas**:
  - Problema no carregamento do arquivo JSON
  - Erro no processamento da contextualização
  - Falha na integração com IA

## Fluxo Atual
1. Frontend chama Edge Function
2. Edge Function chama VPS
3. VPS gera QR Code
4. QR Code é lido pelo WhatsApp
5. Agente absorve contextualização
6. Chatbot responde

## Perguntas para Claude Opus
1. Por que Edge Function retorna erro 500 mas curl direto funciona?
2. Por que QR Code falha na leitura após ser gerado?
3. Como garantir que o agente absorva corretamente a contextualização?
4. Há problemas na arquitetura atual?
5. Quais são as melhores práticas para resolver cada problema?
EOF

# 2. CRIAR ANÁLISE TÉCNICA
echo "🔧 Criando análise técnica..."
cat > "$TEMP_DIR/02-ANALISE-TECNICA.md" << 'EOF'
# ANÁLISE TÉCNICA DETALHADA

## Arquitetura do Sistema

### Frontend (React + TypeScript)
- **Porta**: 8080
- **Framework**: Vite + React + TypeScript
- **UI**: Shadcn/ui
- **Estado**: Context API + Hooks

### Backend Local (Node.js + whatsapp-web.js)
- **Porta**: 3001
- **Biblioteca**: whatsapp-web.js
- **Status**: ✅ Funcionando
- **Endpoint**: /api/whatsapp/generate-qr

### Backend VPS (Node.js + @whiskeysockets/baileys)
- **IP**: 31.97.241.19
- **Porta**: 3001
- **Biblioteca**: @whiskeysockets/baileys
- **Status**: ⚠️ Erro 500 via Edge Function

### Edge Function (Supabase Functions)
- **Função**: agent-whatsapp-manager
- **Status**: ⚠️ Retorna erro 500
- **Conectividade**: ✅ Teste simples funciona

## Problemas Técnicos Identificados

### 1. Erro de UUID Inválido (RESOLVIDO)
- **Problema**: Backend usava `temp-${Date.now()}` como connectionId
- **Solução**: Substituído por `uuidv4()`
- **Status**: ✅ Corrigido

### 2. Erro de Variável Indefinida (RESOLVIDO)
- **Problema**: `agentId` não definido no bloco catch
- **Solução**: Adicionada verificação de segurança
- **Status**: ✅ Corrigido

### 3. Erro de Singleton Lock (RESOLVIDO)
- **Problema**: Chrome/Chromium não conseguia criar lock
- **Solução**: Limpeza de sessões antigas
- **Status**: ✅ Corrigido

### 4. Erro 500 na Edge Function (EM INVESTIGAÇÃO)
- **Problema**: Edge Function retorna erro 500
- **Sintoma**: curl direto funciona, Edge Function falha
- **Possíveis Causas**:
  - Timeout na requisição
  - Headers incorretos
  - Problema de autenticação
  - Diferença na estrutura da requisição

## Logs e Evidências

### Backend Local (Funcionando)
```bash
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}'
# Resultado: {"success":true,"message":"Cliente WhatsApp inicializado"}
# Status: 200
```

### Backend VPS (Funcionando via curl)
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-vps"}'
# Resultado: Sucesso
# Status: 200
```

### Edge Function (Falhando)
```bash
# Requisição da Edge Function para VPS
# Resultado: Erro 500
# Mensagem: "Conexão não autorizada ou encerrada"
```
EOF

# 3. CRIAR CÓDIGO RELEVANTE
echo "💻 Coletando código relevante..."

# Servidor local
cp server.js "$TEMP_DIR/03-SERVER-LOCAL.js"

# Edge Function principal
cp supabase/functions/agent-whatsapp-manager/index.ts "$TEMP_DIR/04-EDGE-FUNCTION-INDEX.ts" 2>/dev/null || echo "Edge Function não encontrada"

# Serviços do frontend
cp src/services/aiChatService.ts "$TEMP_DIR/05-AI-CHAT-SERVICE.ts" 2>/dev/null || echo "AI Chat Service não encontrado"
cp src/services/contextualizacaoService.ts "$TEMP_DIR/06-CONTEXTUALIZACAO-SERVICE.ts" 2>/dev/null || echo "Contextualização Service não encontrado"

# Hooks do WhatsApp
cp src/hooks/whatsapp/useWhatsAppActions.tsx "$TEMP_DIR/07-WHATSAPP-ACTIONS-HOOK.tsx" 2>/dev/null || echo "WhatsApp Actions Hook não encontrado"
cp src/hooks/whatsapp/useWhatsAppStatus.tsx "$TEMP_DIR/08-WHATSAPP-STATUS-HOOK.tsx" 2>/dev/null || echo "WhatsApp Status Hook não encontrado"

# Componentes do WhatsApp
cp src/components/whatsapp/QRCodeDisplay.tsx "$TEMP_DIR/09-QR-CODE-DISPLAY.tsx" 2>/dev/null || echo "QR Code Display não encontrado"
cp src/components/whatsapp/ConnectionStatus.tsx "$TEMP_DIR/10-CONNECTION-STATUS.tsx" 2>/dev/null || echo "Connection Status não encontrado"

# 4. CRIAR CONFIGURAÇÕES
echo "⚙️ Coletando configurações..."
cp package.json "$TEMP_DIR/11-PACKAGE-JSON.json"
cp env.example "$TEMP_DIR/12-ENV-EXAMPLE"
cp .env "$TEMP_DIR/13-ENV-CURRENT" 2>/dev/null || echo ".env não encontrado"

# 5. CRIAR DADOS DE CONTEXTUALIZAÇÃO
echo "🤖 Coletando dados de contextualização..."
cp src/data/contextualizacao-esadi.json "$TEMP_DIR/14-CONTEXTUALIZACAO-DATA.json" 2>/dev/null || echo "Dados de contextualização não encontrados"

# 6. CRIAR CHECKLIST DE VERIFICAÇÃO
echo "✅ Criando checklist..."
cat > "$TEMP_DIR/15-VERIFICATION-CHECKLIST.md" << 'EOF'
# CHECKLIST DE VERIFICAÇÃO

## ✅ Pré-requisitos
- [x] Backend local rodando na porta 3001
- [x] Frontend rodando na porta 8080
- [ ] Supabase configurado e acessível
- [x] Variáveis de ambiente configuradas
- [x] Arquivo de contextualização presente

## 🔧 Testes de Conectividade
- [x] Backend local responde via curl
- [x] Frontend consegue acessar backend local
- [ ] Frontend consegue acessar Edge Function
- [ ] Edge Function consegue acessar VPS

## 📱 Testes de WhatsApp
- [x] QR Code é gerado corretamente
- [ ] QR Code pode ser lido pelo WhatsApp
- [ ] Conexão é estabelecida após leitura
- [ ] Sessão persiste após reconexão
- [ ] Agente responde a mensagens

## 🤖 Testes de Contextualização
- [ ] Arquivo JSON é carregado corretamente
- [ ] Contexto é aplicado ao agente
- [ ] Respostas seguem o contexto
- [ ] Memória de conversa funciona
- [ ] Integração com IA funciona

## 🐛 Logs e Debug
- [x] Logs do backend são gerados
- [ ] Logs da Edge Function são gerados
- [ ] Logs do frontend são gerados
- [ ] Erros são capturados e registrados
- [ ] Timeouts são configurados adequadamente
EOF

# 7. CRIAR PERGUNTAS ESPECÍFICAS
echo "❓ Criando perguntas específicas..."
cat > "$TEMP_DIR/16-PERGUNTAS-ESPECIFICAS.md" << 'EOF'
# PERGUNTAS ESPECÍFICAS PARA CLAUDE OPUS

## 1. Análise de Conectividade Edge Function → VPS
**Problema**: Edge Function retorna erro 500, mas curl direto funciona
**Perguntas**:
- Por que há essa diferença entre curl e Edge Function?
- É problema de timeout, headers, ou autenticação?
- Como debugar a diferença entre as requisições?
- Quais headers são necessários para a Edge Function?

## 2. Análise de QR Code e Sessão
**Problema**: QR Code é gerado mas falha na leitura
**Perguntas**:
- É problema de timeout na sessão?
- Há problema na biblioteca whatsapp-web.js?
- Como garantir que a sessão persista?
- Qual a diferença entre whatsapp-web.js e @whiskeysockets/baileys?

## 3. Análise de Contextualização
**Problema**: Agente não absorve arquivo de contextualização
**Perguntas**:
- Como garantir que o arquivo JSON seja carregado?
- Como aplicar o contexto ao agente?
- Como integrar com o sistema de IA?
- Como manter memória de conversa?

## 4. Análise de Arquitetura
**Perguntas**:
- Há problemas na arquitetura atual?
- Como melhorar a comunicação entre componentes?
- Quais são as melhores práticas?
- Como implementar fallbacks?

## 5. Soluções Recomendadas
**Perguntas**:
- Quais são as soluções específicas para cada problema?
- Como implementar cada solução?
- Quais são os próximos passos?
- Como testar as soluções?
EOF

# 8. CRIAR DOCUMENTO PRINCIPAL
echo "📄 Criando documento principal..."
cat > "$TEMP_DIR/00-DOCUMENTO-PRINCIPAL.md" << 'EOF'
# ANÁLISE COMPLETA - PROBLEMAS DO WHATSAPP
## Documento para Claude Opus

### 📋 RESUMO EXECUTIVO
Este documento contém a análise completa dos problemas enfrentados no sistema WhatsApp admin-lify.

**Problemas Principais:**
1. QR Code falha na leitura
2. Erro 500 na VPS via Edge Function
3. Falha na contextualização do agente

### 🔧 ANÁLISE TÉCNICA
Detalhes técnicos de cada problema, logs e evidências.

### 💻 CÓDIGO RELEVANTE
Arquivos de código principais para análise.

### ⚙️ CONFIGURAÇÕES
Configurações do projeto e ambiente.

### ✅ CHECKLIST
Lista de verificação para testes.

### ❓ PERGUNTAS ESPECÍFICAS
Perguntas direcionadas para análise do Claude Opus.

---

**Status Atual:**
- ✅ Backend local funcionando
- ✅ QR Code sendo gerado
- ⚠️ Edge Function com erro 500
- 🔍 Contextualização em investigação

**Próximos Passos:**
1. Analisar diferenças entre curl e Edge Function
2. Investigar problema de contextualização
3. Implementar soluções recomendadas
4. Testar fluxo completo

---

**Arquivos Incluídos:**
- 01-RESUMO-EXECUTIVO.md
- 02-ANALISE-TECNICA.md
- 03-SERVER-LOCAL.js
- 04-EDGE-FUNCTION-INDEX.ts
- 05-AI-CHAT-SERVICE.ts
- 06-CONTEXTUALIZACAO-SERVICE.ts
- 07-WHATSAPP-ACTIONS-HOOK.tsx
- 08-WHATSAPP-STATUS-HOOK.tsx
- 09-QR-CODE-DISPLAY.tsx
- 10-CONNECTION-STATUS.tsx
- 11-PACKAGE-JSON.json
- 12-ENV-EXAMPLE
- 13-ENV-CURRENT
- 14-CONTEXTUALIZACAO-DATA.json
- 15-VERIFICATION-CHECKLIST.md
- 16-PERGUNTAS-ESPECIFICAS.md
EOF

# 9. CRIAR ARQUIVO ZIP
echo "📦 Criando arquivo ZIP..."
zip -r claude-analysis-document.zip "$TEMP_DIR/"

# 10. LIMPEZA
echo "🧹 Limpando arquivos temporários..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ DOCUMENTO CRIADO COM SUCESSO!"
echo "================================"
echo "📦 Arquivo: claude-analysis-document.zip"
echo "📄 Conteúdo: Documento completo para Claude Opus"
echo ""
echo "📋 ARQUIVOS INCLUÍDOS:"
echo "- Resumo executivo dos problemas"
echo "- Análise técnica detalhada"
echo "- Código relevante (servidor, Edge Function, serviços)"
echo "- Configurações do projeto"
echo "- Checklist de verificação"
echo "- Perguntas específicas para análise"
echo ""
echo "🚀 PRONTO PARA COMPARTILHAR COM CLAUDE OPUS!" 