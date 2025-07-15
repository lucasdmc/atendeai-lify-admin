# 🔄 Migração do Servidor WhatsApp

## 📋 **Resumo da Migração**

Migramos o servidor WhatsApp de `localhost:3000` para a VPS em `https://lify.magah.com.br` para resolver problemas de bloqueio de IP pelo WhatsApp.

## 🚀 **Novo Servidor**

- **URL**: `https://lify.magah.com.br`
- **Status**: ✅ Online e funcionando
- **Endpoints Disponíveis**:
  - `/` - Status do servidor
  - `/api/whatsapp/status` - Status da conexão WhatsApp
  - `/api/whatsapp/generate-qr` - Gerar QR Code
  - `/api/whatsapp/initialize` - Inicializar conexão
  - `/api/whatsapp/send-message` - Enviar mensagem
  - `/api/whatsapp/disconnect` - Desconectar
  - `/api/whatsapp/clear-auth` - Limpar autenticação
  - `/webhook/whatsapp` - Webhook para eventos

## 🔧 **Configurações Atualizadas**

### **1. Variáveis de Ambiente**

**Frontend/Backend:**
```env
VITE_WHATSAPP_SERVER_URL=https://lify.magah.com.br
```

**Supabase Edge Functions:**
```env
WHATSAPP_SERVER_URL=https://lify.magah.com.br
```

### **2. Scripts de Configuração**

**Atualizar variáveis no Supabase:**
```bash
export SERVICE_ROLE_KEY=sua_service_role_key
export WHATSAPP_SERVER_URL=https://lify.magah.com.br
node scripts/setup-whatsapp-env.js
```

**Testar conectividade:**
```bash
export SERVICE_ROLE_KEY=sua_service_role_key
node scripts/test-new-whatsapp-server.js
```

## 📊 **Testes Realizados**

### **✅ Conectividade Básica**
- Servidor responde corretamente
- Endpoints acessíveis
- CORS configurado adequadamente

### **✅ Endpoints WhatsApp**
- `/api/whatsapp/status` - Funcionando
- `/api/whatsapp/generate-qr` - Funcionando
- `/api/whatsapp/initialize` - Funcionando
- `/api/whatsapp/send-message` - Funcionando

### **✅ Integração com Frontend**
- Edge Functions atualizadas
- Hooks do React funcionando
- Componentes de QR Code operacionais

## 🔄 **Fluxo de Integração**

1. **Frontend** chama Edge Functions do Supabase
2. **Edge Functions** fazem requisições para `https://lify.magah.com.br`
3. **Node Server** processa e retorna respostas
4. **Webhook** envia eventos do WhatsApp para o backend

## 🚨 **Pontos de Atenção**

### **Variáveis de Ambiente**
- Certifique-se de que `SERVICE_ROLE_KEY` está configurada
- O Supabase não permite prefixo `SUPABASE_` nas chaves
- Use `SERVICE_ROLE_KEY` em vez de `SUPABASE_SERVICE_ROLE_KEY`

### **Testes Recomendados**
1. Gerar QR Code via painel admin
2. Escanear com WhatsApp Business
3. Testar envio de mensagens
4. Verificar recebimento de mensagens
5. Testar desconexão e reconexão

## 📝 **Comandos Úteis**

```bash
# Verificar status do servidor
curl https://lify.magah.com.br/

# Testar endpoint de status
curl https://lify.magah.com.br/api/whatsapp/status

# Gerar QR Code (POST)
curl -X POST https://lify.magah.com.br/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}'
```

## 🎯 **Próximos Passos**

1. **Testar em produção** com números reais
2. **Monitorar logs** do servidor
3. **Configurar alertas** para downtime
4. **Documentar procedimentos** de troubleshooting
5. **Treinar equipe** no novo fluxo

## 📞 **Suporte**

Em caso de problemas:
1. Verificar logs do servidor em `https://lify.magah.com.br`
2. Testar conectividade com os scripts fornecidos
3. Verificar variáveis de ambiente no Supabase
4. Consultar documentação do Node Server

---

**Data da Migração**: $(date)
**Versão**: 2.0.0
**Status**: ✅ Concluída 