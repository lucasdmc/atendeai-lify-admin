# ✅ Checklist de Deploy - Backend WhatsApp

## 🚀 Pré-Deploy

### ✅ Preparação Local
- [ ] Verificar se o código está funcionando localmente
- [ ] Testar endpoints localmente
- [ ] Verificar se não há erros de sintaxe
- [ ] Gerar documentação dos endpoints: `node scripts/generate-endpoints-docs.js`

### ✅ Backup da VPS
- [ ] Verificar espaço em disco na VPS
- [ ] Fazer backup do backend atual (automático no script)
- [ ] Verificar se não há processos críticos rodando

## 🔧 Deploy

### ✅ Execução do Script
- [ ] Executar: `bash scripts/deploy-clean-production.sh`
- [ ] Aguardar conclusão do script
- [ ] Verificar se não houve erros

### ✅ Verificações Pós-Deploy
- [ ] **PM2 Status:** Verificar se só há UM processo rodando
- [ ] **Porta 3001:** Confirmar que está livre e escutando
- [ ] **Health Check:** Testar endpoint `/health`
- [ ] **Endpoints:** Testar todos os endpoints principais
- [ ] **Logs:** Verificar se não há erros nos logs

## 🧪 Testes

### ✅ Testes Básicos
- [ ] `curl http://31.97.241.19:3001/health`
- [ ] `curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr -H "Content-Type: application/json" -d '{"agentId":"test"}'`
- [ ] Verificar se retorna JSON válido

### ✅ Testes de Integração
- [ ] Testar geração de QR Code via frontend
- [ ] Verificar se o QR Code aparece
- [ ] Testar conexão de agente
- [ ] Verificar logs em tempo real

## 📋 Comandos de Verificação

### Status do Sistema
```bash
# Verificar PM2
ssh root@31.97.241.19 "pm2 list"

# Verificar porta
ssh root@31.97.241.19 "netstat -tuln | grep 3001"

# Verificar logs
ssh root@31.97.241.19 "pm2 logs atendeai-backend --lines 20"

# Health check
curl http://31.97.241.19:3001/health
```

### Troubleshooting
```bash
# Se houver problemas, reiniciar
ssh root@31.97.241.19 "pm2 restart atendeai-backend"

# Se ainda houver problemas, verificar processos
ssh root@31.97.241.19 "ps aux | grep node"

# Limpar processos antigos se necessário
ssh root@31.97.241.19 "pkill -f 'node.*server.js'"
```

## 🚨 Problemas Comuns

### ❌ Porta 3001 em uso
```bash
ssh root@31.97.241.19 "lsof -ti:3001 | xargs kill -9"
```

### ❌ Múltiplos processos PM2
```bash
ssh root@31.97.241.19 "pm2 delete all && pm2 start server.js --name atendeai-backend"
```

### ❌ Erro de dependências
```bash
ssh root@31.97.241.19 "cd /root/atendeai-lify-admin && npm install --production"
```

### ❌ Erro de permissões
```bash
ssh root@31.97.241.19 "chmod +x /root/atendeai-lify-admin/server.js"
```

## 📊 Monitoramento

### Logs Importantes
- **QR Code gerado:** `QR Code gerado para: [agentId]`
- **WhatsApp conectado:** `Cliente WhatsApp pronto`
- **Erros de conexão:** `Falha na autenticação`
- **Timeouts:** `Timeout de sessão para [agentId]`

### Métricas a Observar
- **Uptime:** Deve ser > 0 após deploy
- **Memory:** Deve estar estável
- **Active Sessions:** Número de agentes conectados
- **Response Time:** Endpoints devem responder rapidamente

## ✅ Pós-Deploy

### ✅ Documentação
- [ ] Atualizar `ENDPOINTS.md` se necessário
- [ ] Verificar se a documentação está correta
- [ ] Comitar mudanças no repositório

### ✅ Comunicação
- [ ] Informar equipe sobre o deploy
- [ ] Monitorar sistema por algumas horas
- [ ] Verificar se não há regressões

---

## 📝 Notas Importantes

1. **Sempre fazer backup antes do deploy**
2. **Verificar se só há UM processo PM2 rodando**
3. **Testar endpoints após deploy**
4. **Monitorar logs por pelo menos 30 minutos**
5. **Ter plano de rollback pronto**

---

*Checklist atualizado em: $(date)*
