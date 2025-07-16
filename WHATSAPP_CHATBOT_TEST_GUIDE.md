# 🤖 Guia de Teste do Chatbot WhatsApp

## ✅ Status Atual
- ✅ **Servidor WhatsApp:** Funcionando em `http://31.97.241.19:3001`
- ✅ **URL do Webhook:** Corrigida para `https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook`
- ✅ **Chave do Supabase:** Configurada no servidor
- ✅ **Sistema de Agentes:** Pronto para uso

## 🎯 Como Testar o Chatbot

### **Passo 1: Acessar o Sistema**
```
http://localhost:8080
```

### **Passo 2: Fazer Login**
- **Email:** `lucasdmc@lify.com`
- **Senha:** `123456`

### **Passo 3: Ir para o Módulo Agentes**
```
http://localhost:8080/agentes
```

### **Passo 4: Gerar QR Code**
1. Clique no botão **"Gerar QR Code"**
2. Aguarde o QR Code aparecer
3. **NÃO deve aparecer erro 500**

### **Passo 5: Conectar WhatsApp**
1. Abra o **WhatsApp Business** no seu celular
2. Escaneie o QR Code
3. Aguarde a confirmação de conexão

### **Passo 6: Testar o Chatbot**
1. Envie uma mensagem para o número conectado
2. Exemplos de mensagens para testar:
   - `"Olá"`
   - `"Quero agendar uma consulta"`
   - `"Quais são os horários de funcionamento?"`
   - `"Quanto custa uma endoscopia?"`

## 🔍 Verificações Importantes

### **1. Status do Agente**
```bash
curl -X GET http://31.97.241.19:3001/api/whatsapp/status/SEU_AGENT_ID
```

### **2. Logs do Servidor**
```bash
ssh root@31.97.241.19 "pm2 logs atendeai-backend --lines 50"
```

### **3. Logs do Supabase**
- Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
- Vá em **Logs** → **Edge Functions**

## 📊 O que Deve Acontecer

### **✅ Comportamento Correto:**
1. **QR Code:** Aparece sem erro 500
2. **Conexão:** WhatsApp conecta com sucesso
3. **Mensagens:** Chatbot responde automaticamente
4. **Contexto:** Respostas sobre a ESADI (clínica)
5. **Logs:** Mensagens aparecem no console

### **❌ Problemas Comuns:**
1. **Erro 500 no QR Code:** Problema na tabela `user_profiles`
2. **Chatbot não responde:** Webhook não configurado
3. **Conexão falha:** Timeout ou problema de rede
4. **Resposta genérica:** Contexto não carregado

## 🔧 Troubleshooting

### **Se o QR Code não aparecer:**
```bash
# Execute o script de correção
node scripts/check-and-fix-user-profiles.js
```

### **Se o chatbot não responder:**
```bash
# Verificar logs do servidor
ssh root@31.97.241.19 "pm2 logs atendeai-backend --lines 20"

# Verificar logs do Supabase
# Acesse o dashboard do Supabase → Logs
```

### **Se a conexão falhar:**
```bash
# Reiniciar o servidor
ssh root@31.97.241.19 "pm2 restart atendeai-backend"

# Verificar status
curl -X GET http://31.97.241.19:3001/health
```

## 📱 Exemplos de Conversa

### **Teste 1: Informações Básicas**
```
Você: "Olá, boa tarde"
Chatbot: "Olá! Sou a Jessica, assistente virtual da ESADI - Espaço de Saúde do Aparelho Digestivo. Como posso ajudá-lo hoje?"
```

### **Teste 2: Agendamento**
```
Você: "Quero agendar uma consulta"
Chatbot: "Claro! Para agendar uma consulta gastroenterológica, você pode entrar em contato conosco pelos seguintes canais:

📞 Telefone: (47) 3222-0432
📱 WhatsApp: (47) 99963-3223
📧 Email: contato@esadi.com.br

A consulta tem o valor de R$ 280,00. Qual horário prefere?"
```

### **Teste 3: Endereço**
```
Você: "Onde fica a clínica?"
Chatbot: "A ESADI fica localizada em:

📍 Rua Sete de Setembro, 777
🏢 Edifício Stein Office - Sala 511
🏙️ Centro, Blumenau - SC
📮 CEP: 89010-201

Horário de funcionamento:
🕐 Segunda a Quinta: 07:00 às 18:00
🕐 Sexta: 07:00 às 17:00
🕐 Sábado: 07:00 às 12:00
🕐 Domingo: Fechado"
```

## 🎉 Resultado Esperado

Após seguir todos os passos, você deve ter:
- ✅ QR Code gerado sem erros
- ✅ WhatsApp conectado com sucesso
- ✅ Chatbot respondendo automaticamente
- ✅ Respostas contextualizadas sobre a ESADI
- ✅ Sistema funcionando 100%

**Me avise se encontrar algum problema ou se tudo funcionar perfeitamente!** 🚀 