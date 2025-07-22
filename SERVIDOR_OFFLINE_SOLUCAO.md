# 🚨 SERVIDOR OFFLINE - SOLUÇÃO

## ❌ Problema Identificado

O servidor VPS (`31.97.241.19`) está **completamente offline**:
- ❌ Não responde ao ping
- ❌ Não responde na porta 3001
- ❌ SSH não está funcionando

## 🔍 Diagnóstico

### Possíveis Causas:
1. **VPS offline** - Servidor desligado ou reiniciando
2. **Problema de rede** - Firewall ou configuração de rede
3. **Problema de hardware** - VPS com problema físico
4. **Suspensão de conta** - Problema de pagamento ou limite
5. **Ataque DDoS** - Servidor sob ataque

## 🛠️ Soluções

### 1. Verificar Status da VPS
```
1. Acesse o painel de controle da sua VPS
2. Verifique se o servidor está online
3. Verifique se há alertas ou problemas
4. Verifique se a conta está ativa
```

### 2. Reiniciar a VPS (se necessário)
```
1. No painel de controle, clique em "Reiniciar"
2. Aguarde 2-3 minutos para o servidor subir
3. Teste novamente a conectividade
```

### 3. Verificar Configurações de Rede
```
1. Verifique se a porta 3001 está aberta
2. Verifique se o firewall está configurado
3. Verifique se há regras de segurança bloqueando
```

### 4. Verificar Logs da VPS
```
1. Acesse o console da VPS (se disponível)
2. Verifique se há erros de sistema
3. Verifique se há problemas de disco ou memória
```

## 🧪 Testes de Conectividade

### Teste 1: Ping
```bash
ping -c 3 31.97.241.19
```

### Teste 2: Porta 3001
```bash
curl -s --connect-timeout 10 http://31.97.241.19:3001/health
```

### Teste 3: SSH
```bash
ssh -o ConnectTimeout=10 root@31.97.241.19 "echo OK"
```

## 📋 Checklist de Recuperação

- [ ] Verificar status da VPS no painel
- [ ] Reiniciar VPS se necessário
- [ ] Aguardar 2-3 minutos após reinicialização
- [ ] Testar ping: `ping -c 3 31.97.241.19`
- [ ] Testar porta: `curl http://31.97.241.19:3001/health`
- [ ] Testar SSH: `ssh root@31.97.241.19 "pm2 list"`
- [ ] Se tudo OK, reiniciar servidor WhatsApp

## 🚀 Após Recuperação

Quando o servidor estiver online novamente:

1. **Reiniciar servidor WhatsApp:**
   ```bash
   ssh root@31.97.241.19 "pm2 restart atendeai-whatsapp-server"
   ```

2. **Verificar logs:**
   ```bash
   ssh root@31.97.241.19 "pm2 logs atendeai-whatsapp-server --lines 20"
   ```

3. **Testar QR Code:**
   ```bash
   curl -s -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
     -H "Content-Type: application/json" \
     -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}' | jq '.'
   ```

## 🆘 Se o Problema Persistir

### Contatar Suporte da VPS:
1. **Problema de hardware** - Solicitar migração para outro servidor
2. **Problema de rede** - Solicitar verificação de conectividade
3. **Problema de configuração** - Solicitar assistência técnica

### Alternativas Temporárias:
1. **Migrar para outra VPS** temporariamente
2. **Usar servidor local** para desenvolvimento
3. **Configurar novo servidor** se necessário

## 📞 Informações de Contato

- **VPS Provider**: [Nome do provedor]
- **Ticket de Suporte**: [Número do ticket]
- **Servidor IP**: 31.97.241.19
- **Porta**: 3001

---

**Status Atual**: 🔴 OFFLINE  
**Última Verificação**: $(date)  
**Próxima Ação**: Verificar painel de controle da VPS 