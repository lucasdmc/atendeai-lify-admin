# 📋 Documentação dos Endpoints - Backend WhatsApp

## 📅 Última atualização: 2025-07-16T21:03:39.103Z

## 🚀 Servidor
- **URL Base:** http://31.97.241.19:3001
- **Ambiente:** Produção
- **Versão:** 1.0.0

## 📊 Endpoints Disponíveis

### 1. GET /health

**Descrição:** Health check detalhado do sistema

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "ISO string",
  "version": "string",
  "uptime": "number",
  "memory": "object",
  "activeSessions": "number",
  "sessions": "array",
  "endpoints": "array",
  "server": "object"
}
```

**Exemplo de uso:**
```bash
curl -X GET http://31.97.241.19:3001/health \
  -H "Content-Type: application/json" \
  
```

---
### 2. POST /api/whatsapp/generate-qr

**Descrição:** Gerar QR Code para um agente

**Body (JSON):**
```json
{
  "agentId": "string (obrigatório)"
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "qrCode": "string (base64)",
  "message": "string",
  "agentId": "string",
  "whatsappNumber": "string",
  "connectionId": "string"
}
```

**Exemplo de uso:**
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"string (obrigatório)"}'
```

---
### 3. GET /api/whatsapp/status/:agentId

**Descrição:** Verificar status de um agente

**Parâmetros de URL:**
```json
{
  "agentId": "string (obrigatório)"
}
```

**Resposta:**
```json
{
  "status": "string (qr|connected|disconnected|auth_failure)",
  "qrCode": "string (base64, se status=qr)",
  "connected": "boolean",
  "connectedAt": "ISO string (se conectado)",
  "lastUpdate": "number"
}
```

**Exemplo de uso:**
```bash
curl -X GET http://31.97.241.19:3001/api/whatsapp/status/:agentId \
  -H "Content-Type: application/json" \
  
```

---
### 4. POST /api/whatsapp/disconnect

**Descrição:** Desconectar um agente

**Body (JSON):**
```json
{
  "agentId": "string (obrigatório)"
}
```

**Resposta:**
```json
{
  "success": "boolean",
  "message": "string"
}
```

**Exemplo de uso:**
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/disconnect \
  -H "Content-Type: application/json" \
  -d '{"agentId":"string (obrigatório)"}'
```

---

## 🔧 Comandos Úteis

### Verificar status do servidor
```bash
curl http://31.97.241.19:3001/health
```

### Ver logs em tempo real
```bash
ssh root@31.97.241.19 "pm2 logs atendeai-backend"
```

### Reiniciar servidor
```bash
ssh root@31.97.241.19 "pm2 restart atendeai-backend"
```

### Ver status PM2
```bash
ssh root@31.97.241.19 "pm2 list"
```

## 📝 Notas

- Todos os endpoints retornam JSON
- O servidor roda na porta 3001
- Logs são gerenciados pelo PM2
- Sessões WhatsApp são mantidas em memória
- Timeout de QR Code: 10 minutos
- Timeout de conexão: 15 minutos

---
*Documentação gerada automaticamente em 2025-07-16T21:03:39.103Z*
