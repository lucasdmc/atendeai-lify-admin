# GUIA PARA ANÁLISE COM CLAUDE OPUS

## 📋 RESUMO DOS PROBLEMAS

Você está enfrentando **3 problemas principais** no sistema WhatsApp:

### 1. QR Code Falha na Leitura
- QR Code é gerado corretamente
- Mas falha ao ser lido pelo WhatsApp
- Agente não consegue conectar

### 2. Erro 500 na VPS
- Edge Function retorna erro 500
- Mas curl direto funciona normalmente
- Problema de conectividade entre Edge Function e VPS

### 3. Falha na Contextualização
- Agente não absorve arquivo de contextualização
- Chatbot não responde adequadamente
- Problema na integração com IA

## 📦 PACOTE DE DADOS

O arquivo `whatsapp-analysis-local-20250716-105848.tar.gz` contém:

### Configurações
- `env.example` - Variáveis de ambiente
- `package.json` - Dependências
- `server.js` - Servidor local

### Frontend
- `frontend/services/` - Serviços de comunicação
- `frontend/hooks-whatsapp/` - Hooks do WhatsApp
- `frontend/components-whatsapp/` - Componentes do WhatsApp
- `frontend/components-agentes/` - Componentes dos Agentes

### Supabase
- `supabase-functions/` - Edge Functions

### Dados
- `data/` - Arquivos de contextualização

## 🔍 PERGUNTAS ESPECÍFICAS

### 1. Análise de Conectividade
**Problema**: Edge Function retorna erro 500, mas curl direto funciona
**Pergunta**: Por que há essa diferença? É problema de headers, timeout, ou autenticação?

### 2. Análise de QR Code
**Problema**: QR Code é gerado mas falha na leitura
**Pergunta**: É problema de timeout, autenticação, ou biblioteca whatsapp-web.js?

### 3. Análise de Contextualização
**Problema**: Agente não absorve arquivo de contextualização
**Pergunta**: Como garantir que o agente carregue e use corretamente o contexto?

### 4. Análise de Arquitetura
**Pergunta**: Há problemas na arquitetura atual que podem estar causando esses problemas?

### 5. Soluções Recomendadas
**Pergunta**: Quais são as melhores práticas para resolver cada problema?

## 🧪 TESTES DISPONÍVEIS

O pacote inclui:
- `test-local-flow.sh` - Script para testar fluxo local
- `VERIFICATION_CHECKLIST.md` - Checklist de verificação
- `EXECUTIVE_SUMMARY.md` - Resumo executivo

## 📊 CONTEXTO TÉCNICO

### Arquitetura Atual
- **Frontend**: React + TypeScript
- **Backend Local**: Node.js + whatsapp-web.js
- **Backend VPS**: Node.js + @whiskeysockets/baileys
- **Edge Function**: Supabase Functions
- **Banco**: Supabase PostgreSQL

### Fluxo Atual
1. Frontend chama Edge Function
2. Edge Function chama VPS
3. VPS gera QR Code
4. QR Code é lido pelo WhatsApp
5. Agente absorve contextualização
6. Chatbot responde

## 🎯 OBJETIVO

Encontrar a **causa raiz** dos 3 problemas e fornecer **soluções específicas** para cada um, considerando:

- Diferenças entre ambientes (local vs VPS)
- Problemas de conectividade
- Timeouts e autenticação
- Integração com WhatsApp
- Processamento de contextualização

## 📝 INSTRUÇÕES PARA CLAUDE OPUS

1. **Analise o código** nos arquivos fornecidos
2. **Identifique padrões** que podem causar os problemas
3. **Compare** requisições curl vs Edge Function
4. **Verifique** configurações de timeout e autenticação
5. **Proponha soluções** específicas para cada problema
6. **Forneça código** de exemplo para as correções
7. **Sugira melhorias** na arquitetura se necessário

---

**Arquivo para compartilhar**: `whatsapp-analysis-local-20250716-105848.tar.gz` 