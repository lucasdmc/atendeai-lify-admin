# 🚀 RECUPERAÇÃO APÓS VPS REINICIADA

## ✅ VPS Reiniciada!

Agora que a VPS foi reiniciada, vamos restaurar o sistema WhatsApp.

## 📋 Checklist de Recuperação

### 1. Verificar Conectividade
```bash
# Teste básico
ping -c 3 31.97.241.19

# Teste SSH
ssh root@31.97.241.19 "echo OK"

# Teste porta WhatsApp
curl http://31.97.241.19:3001/health
```

### 2. Verificar Status dos Processos
```bash
ssh root@31.97.241.19 "pm2 list"
```

### 3. Reiniciar Servidor WhatsApp (se necessário)
```bash
ssh root@31.97.241.19 "pm2 restart atendeai-whatsapp-server"
```

### 4. Verificar Logs
```bash
ssh root@31.97.241.19 "pm2 logs atendeai-whatsapp-server --lines 20"
```

### 5. Testar Geração de QR Code
```bash
curl -s -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}' | jq '.'
```

## 🔧 Comandos de Recuperação Automática

### Script Completo de Recuperação:
```bash
#!/bin/bash

echo "🔍 Verificando conectividade..."
if ping -c 1 31.97.241.19 &> /dev/null; then
    echo "✅ VPS online!"
    
    echo "📋 Verificando PM2..."
    ssh root@31.97.241.19 "pm2 list"
    
    echo "🔄 Reiniciando servidor WhatsApp..."
    ssh root@31.97.241.19 "pm2 restart atendeai-whatsapp-server"
    
    echo "⏰ Aguardando inicialização..."
    sleep 10
    
    echo "🧪 Testando QR Code..."
    curl -s -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
      -H "Content-Type: application/json" \
      -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}' | jq '.'
    
    echo "✅ Recuperação concluída!"
else
    echo "❌ VPS ainda offline"
fi
```

## 🎯 Resultado Esperado

Após a recuperação, você deve ver:

### ✅ Health Check:
```json
{
  "status": "ok",
  "timestamp": "2025-07-18T...",
  "server": "Baileys WhatsApp Server (Working)"
}
```

### ✅ QR Code Real:
```json
{
  "success": true,
  "message": "QR Code gerado com sucesso",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhm..."
}
```

## 🆘 Se Houver Problemas

### Problema 1: PM2 não encontrado
```bash
ssh root@31.97.241.19 "npm install -g pm2"
```

### Problema 2: Servidor não inicia
```bash
ssh root@31.97.241.19 "cd /root/LifyChatbot-Node-Server && pm2 start server.js --name atendeai-whatsapp-server"
```

### Problema 3: Dependências faltando
```bash
ssh root@31.97.241.19 "cd /root/LifyChatbot-Node-Server && npm install"
```

### Problema 4: Porta 3001 não responde
```bash
ssh root@31.97.241.19 "netstat -tlnp | grep 3001"
```

## 📊 Status de Monitoramento

- **VPS**: 🔴 Aguardando inicialização
- **SSH**: 🔴 Aguardando
- **Porta 3001**: 🔴 Aguardando
- **PM2**: 🔴 Aguardando
- **QR Code**: 🔴 Aguardando

## 🎉 Próximos Passos

1. **Aguarde 2-3 minutos** para inicialização completa
2. **Execute os testes** de conectividade
3. **Reinicie o servidor WhatsApp** se necessário
4. **Teste a geração de QR Code**
5. **Verifique se o frontend funciona**

---

**Status**: 🔄 Aguardando VPS voltar online  
**Tempo estimado**: 2-5 minutos  
**Próxima verificação**: Automática via monitoramento 