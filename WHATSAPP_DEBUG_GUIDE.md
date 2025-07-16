# 🔍 Guia de Debug da Conexão WhatsApp

Este guia contém scripts e instruções para debugar o problema de conexão entre a Edge Function do Supabase e o backend WhatsApp na VPS.

## 📋 Problema Identificado

- **Erro**: 500 "Conexão não autorizada ou encerrada" ao gerar QR Code via Edge Function
- **Status**: Testes diretos via curl funcionam, indicando que o backend está operacional
- **Objetivo**: Identificar diferenças entre requisições da Edge Function vs curl direto

## 🛠️ Scripts Disponíveis

### 1. `scripts/debug-whatsapp-connection.sh`
Script principal com menu interativo para debug completo.

**Funcionalidades:**
- ✅ Adicionar logs de debug ao endpoint
- ✅ Reiniciar backend automaticamente
- ✅ Testar conexão direta
- ✅ Monitorar logs em tempo real
- ✅ Restaurar backup original

### 2. `scripts/upload-debug-script.sh`
Script para upload e execução automática na VPS.

**Como usar:**
1. Edite o IP da VPS no script
2. Execute: `./scripts/upload-debug-script.sh`

### 3. `scripts/execute-debug-manual.sh`
Script para execução manual direta na VPS.

**Como usar:**
1. Faça upload para a VPS: `scp scripts/execute-debug-manual.sh root@SEU_IP_VPS:/root/`
2. Execute na VPS: `chmod +x /root/execute-debug-manual.sh && /root/execute-debug-manual.sh`

## 🚀 Como Executar

### Opção 1: Upload Automático
```bash
# 1. Configure o IP da VPS no script
nano scripts/upload-debug-script.sh
# Altere: VPS_IP="SEU_IP_VPS" para VPS_IP="123.456.789.012"

# 2. Execute o upload
./scripts/upload-debug-script.sh
```

### Opção 2: Execução Manual na VPS
```bash
# 1. Conecte na VPS
ssh root@SEU_IP_VPS

# 2. Faça upload do script
scp scripts/execute-debug-manual.sh root@SEU_IP_VPS:/root/

# 3. Execute na VPS
chmod +x /root/execute-debug-manual.sh
/root/execute-debug-manual.sh
```

### Opção 3: Menu Interativo
```bash
# 1. Faça upload do script principal
scp scripts/debug-whatsapp-connection.sh root@SEU_IP_VPS:/root/

# 2. Execute na VPS
chmod +x /root/debug-whatsapp-connection.sh
/root/debug-whatsapp-connection.sh
```

## 📊 O que o Debug Faz

### 1. Backup Automático
- Cria backup do `server.js` antes de modificar
- Permite restauração em caso de problemas

### 2. Adição de Logs Detalhados
Adiciona ao endpoint `/api/whatsapp/generate-qr`:
```javascript
// Log de todos os detalhes da requisição
logRequestDetails(req, '/api/whatsapp/generate-qr');

// Logs específicos
console.log('🚀 Iniciando geração de QR Code...');
console.log('📋 Headers recebidos:', JSON.stringify(req.headers, null, 2));
console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
```

### 3. Monitoramento em Tempo Real
- Monitora logs do PM2
- Salva requests em `/tmp/whatsapp-requests.log`
- Aguarda 60 segundos para capturar requisições

### 4. Testes de Conectividade
- Testa se o backend responde na porta 3001
- Testa o endpoint diretamente via curl
- Compara respostas

## 🔍 Análise dos Resultados

### Logs Capturados
Os logs incluem:
- **Timestamp**: Quando a requisição chegou
- **Headers**: Todos os headers HTTP
- **Body**: Corpo da requisição
- **IP**: Endereço de origem
- **User-Agent**: Navegador/cliente

### Comparação Esperada
**Requisição via curl (funciona):**
```json
{
  "headers": {
    "content-type": "application/json",
    "user-agent": "curl/7.68.0"
  },
  "body": {
    "agentId": "test-agent"
  }
}
```

**Requisição via Edge Function (falha):**
```json
{
  "headers": {
    "content-type": "application/json",
    "user-agent": "Supabase Edge Function",
    "authorization": "Bearer ..."
  },
  "body": {
    "agentId": "test-agent"
  }
}
```

## 🎯 Possíveis Causas

### 1. Headers de Autenticação
- Edge Function pode estar enviando headers extras
- Backend pode estar rejeitando headers específicos

### 2. Formato do Body
- Diferenças na serialização JSON
- Campos extras ou faltantes

### 3. Timeout de Rede
- Edge Function pode ter timeout menor
- Latência entre Supabase e VPS

### 4. CORS/Origem
- Backend pode estar rejeitando origem da Edge Function
- Headers de origem diferentes

## 🔧 Restauração

Para restaurar o backup original:
```bash
# Na VPS
cp /root/LifyChatbot-Node-Server/server.js.backup /root/LifyChatbot-Node-Server/server.js
pm2 restart LifyChatbot-Node-Server
```

## 📝 Próximos Passos

1. **Execute o debug** usando um dos scripts
2. **Teste a geração de QR Code** pelo frontend durante o monitoramento
3. **Analise os logs** capturados
4. **Compare** com requisições curl diretas
5. **Identifique** as diferenças que causam o erro 500
6. **Ajuste** o backend ou Edge Function conforme necessário

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se o PM2 está rodando: `pm2 list`
2. Verifique logs do PM2: `pm2 logs LifyChatbot-Node-Server`
3. Restaure o backup se necessário
4. Teste conectividade: `curl http://localhost:3001/health`

---

**Autor**: Assistente Claude  
**Data**: $(date)  
**Versão**: 1.0 