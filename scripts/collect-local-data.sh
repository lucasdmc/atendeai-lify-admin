#!/bin/bash

echo "🔍 COLETANDO DADOS LOCAIS PARA ANÁLISE"
echo "======================================="

# Criar diretório de análise
ANALYSIS_DIR="whatsapp-analysis-local-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$ANALYSIS_DIR"

echo "📁 Criando diretório: $ANALYSIS_DIR"

# 1. COLETAR CONFIGURAÇÕES
echo "⚙️ Coletando configurações..."
cp env.example "$ANALYSIS_DIR/" 2>/dev/null || echo "env.example não encontrado"
cp .env "$ANALYSIS_DIR/" 2>/dev/null || echo ".env não encontrado"
cp package.json "$ANALYSIS_DIR/"
cp server.js "$ANALYSIS_DIR/"

# 2. COLETAR CÓDIGO DO FRONTEND
echo "🖥️ Coletando código do frontend..."
mkdir -p "$ANALYSIS_DIR/frontend"

# Serviços
cp -r src/services/ "$ANALYSIS_DIR/frontend/services/" 2>/dev/null || echo "src/services/ não encontrado"

# Hooks do WhatsApp
cp -r src/hooks/whatsapp/ "$ANALYSIS_DIR/frontend/hooks-whatsapp/" 2>/dev/null || echo "src/hooks/whatsapp/ não encontrado"

# Componentes do WhatsApp
cp -r src/components/whatsapp/ "$ANALYSIS_DIR/frontend/components-whatsapp/" 2>/dev/null || echo "src/components/whatsapp/ não encontrado"

# Componentes dos Agentes
cp -r src/components/agentes/ "$ANALYSIS_DIR/frontend/components-agentes/" 2>/dev/null || echo "src/components/agentes/ não encontrado"

# 3. COLETAR DADOS DO SUPABASE
echo "☁️ Coletando dados do Supabase..."
cp -r supabase/functions/ "$ANALYSIS_DIR/supabase-functions/" 2>/dev/null || echo "supabase/functions/ não encontrado"

# 4. COLETAR DADOS DE CONTEXTUALIZAÇÃO
echo "🤖 Coletando dados de contextualização..."
cp -r src/data/ "$ANALYSIS_DIR/data/" 2>/dev/null || echo "src/data/ não encontrado"

# 5. CRIAR RESUMO EXECUTIVO
echo "📋 Criando resumo executivo..."
cat > "$ANALYSIS_DIR/EXECUTIVE_SUMMARY.md" << 'EOF'
# RESUMO EXECUTIVO - PROBLEMAS DO WHATSAPP

## Problemas Identificados

### 1. QR Code Falha na Leitura
- **Sintoma**: QR Code é gerado mas falha ao ser lido
- **Impacto**: Agente não consegue conectar ao WhatsApp
- **Possíveis Causas**: 
  - Timeout na sessão
  - Problema de autenticação
  - Erro na biblioteca whatsapp-web.js

### 2. Erro 500 na VPS
- **Sintoma**: VPS retorna erro 500 ao tentar conexão
- **Impacto**: Frontend não consegue se comunicar com backend
- **Possíveis Causas**:
  - Problema de conectividade entre Edge Function e VPS
  - Erro no endpoint /api/whatsapp/generate-qr
  - Problema de autenticação ou headers

### 3. Falha na Contextualização
- **Sintoma**: Agente não absorve arquivo de contextualização
- **Impacto**: Chatbot não responde adequadamente
- **Possíveis Causas**:
  - Problema no carregamento do arquivo JSON
  - Erro no processamento da contextualização
  - Falha na integração com IA

## Arquivos Coletados

### Configurações
- `env.example` - Exemplo de variáveis de ambiente
- `.env` - Configurações atuais (se disponível)
- `package.json` - Dependências do projeto
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

## Perguntas para Claude Opus

1. **Análise de Conectividade**: Por que a Edge Function retorna erro 500 mas curl direto funciona?

2. **Análise de QR Code**: Por que o QR Code falha na leitura após ser gerado?

3. **Análise de Contextualização**: Como garantir que o agente absorva corretamente o arquivo de contextualização?

4. **Análise de Arquitetura**: Há problemas na arquitetura atual que podem estar causando esses problemas?

5. **Soluções Recomendadas**: Quais são as melhores práticas para resolver cada problema?

## Próximos Passos

1. Compartilhar este pacote completo com Claude Opus
2. Analisar logs detalhados do backend
3. Verificar diferenças entre requisições curl vs Edge Function
4. Testar conectividade entre componentes
5. Implementar soluções recomendadas
EOF

# 6. CRIAR SCRIPT DE TESTE LOCAL
echo "🧪 Criando script de teste local..."
cat > "$ANALYSIS_DIR/test-local-flow.sh" << 'EOF'
#!/bin/bash

echo "🧪 TESTE LOCAL DO FLUXO WHATSAPP"
echo "================================"

# Teste 1: Backend local
echo "1. Testando backend local..."
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 2: Verificar se o servidor está rodando
echo "2. Verificando se o servidor está rodando..."
ps aux | grep "node server.js" | grep -v grep

# Teste 3: Verificar portas em uso
echo "3. Verificando portas em uso..."
lsof -i :3001
EOF

chmod +x "$ANALYSIS_DIR/test-local-flow.sh"

# 7. CRIAR CHECKLIST DE VERIFICAÇÃO
echo "✅ Criando checklist de verificação..."
cat > "$ANALYSIS_DIR/VERIFICATION_CHECKLIST.md" << 'EOF'
# CHECKLIST DE VERIFICAÇÃO

## ✅ Pré-requisitos
- [ ] Backend local rodando na porta 3001
- [ ] Supabase configurado e acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivo de contextualização presente

## 🔧 Testes de Conectividade
- [ ] Backend local responde via curl
- [ ] Frontend consegue acessar backend local
- [ ] Frontend consegue acessar Edge Function

## 📱 Testes de WhatsApp
- [ ] QR Code é gerado corretamente
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
- [ ] Logs do backend são gerados
- [ ] Logs da Edge Function são gerados
- [ ] Logs do frontend são gerados
- [ ] Erros são capturados e registrados
- [ ] Timeouts são configurados adequadamente
EOF

# 8. COMPRIMIR PACOTE
echo "📦 Comprimindo pacote de análise..."
tar -czf "$ANALYSIS_DIR.tar.gz" "$ANALYSIS_DIR"

echo ""
echo "✅ COLETA LOCAL CONCLUÍDA!"
echo "=========================="
echo "📁 Diretório criado: $ANALYSIS_DIR"
echo "📦 Arquivo compactado: $ANALYSIS_DIR.tar.gz"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Compartilhar $ANALYSIS_DIR.tar.gz com Claude Opus"
echo "2. Executar: ./$ANALYSIS_DIR/test-local-flow.sh"
echo "3. Verificar: $ANALYSIS_DIR/VERIFICATION_CHECKLIST.md"
echo "4. Ler: $ANALYSIS_DIR/EXECUTIVE_SUMMARY.md"
echo ""
echo "🔍 ARQUIVOS IMPORTANTES:"
echo "- $ANALYSIS_DIR/EXECUTIVE_SUMMARY.md (Resumo dos problemas)"
echo "- $ANALYSIS_DIR/VERIFICATION_CHECKLIST.md (Checklist de testes)"
echo "- $ANALYSIS_DIR/test-local-flow.sh (Script de teste)"
echo ""
echo "📊 DADOS COLETADOS:"
echo "- Configurações do projeto"
echo "- Código do frontend"
echo "- Edge Functions do Supabase"
echo "- Arquivos de contextualização" 