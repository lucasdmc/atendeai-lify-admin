# 🧪 Guia de Teste no Localhost - Sistema de Agendamento com Google Calendar

## 🚀 Pré-requisitos

Antes de testar, certifique-se de que:

- ✅ Node.js 18+ instalado
- ✅ Dependências instaladas (`npm install`)
- ✅ Supabase CLI instalado (`brew install supabase/tap/supabase`)
- ✅ Login no Supabase (`supabase login`)
- ✅ Usuário admin com Google Calendar conectado

## 🔧 Configuração Inicial

### 1. **Iniciar o servidor de desenvolvimento**

```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:8081** (porta 8080 estava ocupada)

### 2. **Configurar as tabelas de agendamento**

Você precisa da **Service Role Key** do Supabase para criar as tabelas:

1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
2. Vá em: Settings > API
3. Copie a **service_role key**
4. Configure a variável de ambiente:

```bash
export SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

5. Execute o script de configuração:

```bash
node scripts/setup-agendamento-localhost.js
```

### 3. **Deploy das Edge Functions**

```bash
# Deploy da função de WhatsApp
supabase functions deploy whatsapp-integration

# Deploy da função de IA
supabase functions deploy ai-chat-gpt4
```

### 4. **Conectar Google Calendar do usuário admin**

1. Acesse: http://localhost:8081
2. Faça login com uma conta Google que será admin
3. Vá para **Agendamentos**
4. Conecte o Google Calendar
5. Verifique se o usuário tem role 'admin' na tabela `user_profiles`

## 🧪 Testando o Sistema

### **Passo 1: Acessar o sistema**

1. Abra o navegador
2. Acesse: **http://localhost:8081**
3. Faça login com Google

### **Passo 2: Testar módulo de Agendamentos**

1. Vá para **Agendamentos** no menu lateral
2. Clique em **Conectar WhatsApp**
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde o status mudar para "Conectado"

### **Passo 3: Testar o chatbot de agendamento**

Envie as seguintes mensagens no WhatsApp para testar o fluxo:

#### **Cenário 1: Agendamento completo**
```
Olá, gostaria de agendar uma consulta
```

O chatbot deve responder pedindo seus dados:
- Nome completo
- Telefone
- Email

#### **Cenário 2: Respostas para o agendamento**
```
Nome: João Silva
Telefone: 5511999999999
Email: joao@teste.com
```

#### **Cenário 3: Escolha de serviço**
```
Quero uma consulta médica
```

#### **Cenário 4: Escolha de profissional**
```
Dr. João Silva
```

#### **Cenário 5: Escolha de data**
```
Amanhã
```

#### **Cenário 6: Escolha de horário**
```
14:00
```

#### **Cenário 7: Confirmação**
```
Sim, confirmar
```

## 🔍 Verificando o Funcionamento

### **1. Logs do Supabase**

Acesse o dashboard do Supabase para ver os logs:
- https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/functions
- Clique em **whatsapp-integration** > **Logs**

### **2. Dados no banco**

Verifique se os dados estão sendo salvos:
- **pacientes**: Dados dos pacientes
- **agendamentos**: Agendamentos confirmados
- **services**: Serviços disponíveis
- **professionals**: Profissionais disponíveis

### **3. Google Calendar**

Verifique se o evento foi criado no Google Calendar:
- Acesse: https://calendar.google.com
- Procure pelo evento criado
- Verifique se os detalhes estão corretos

### **4. Teste via script**

```bash
# Teste básico
node scripts/test-agendamento-localhost.js

# Teste com Google Calendar
node scripts/test-agendamento-google-calendar.js
```

## 🐛 Solução de Problemas

### **Problema: QR Code não aparece**
- Verifique se a Edge Function está deployada
- Verifique se a variável `WHATSAPP_SERVER_URL` está configurada

### **Problema: Chatbot não responde**
- Verifique os logs da Edge Function no Supabase
- Verifique se a função `ai-chat-gpt4` está deployada
- Verifique se o webhook está configurado no servidor WhatsApp

### **Problema: Evento não é criado no Google Calendar**
- Verifique se existe um usuário admin
- Verifique se o usuário admin tem Google Calendar conectado
- Verifique se o token de acesso está válido
- Verifique os logs da Edge Function

### **Problema: Erro 404 nas Edge Functions**
```bash
# Redeploy das funções
supabase functions deploy whatsapp-integration
supabase functions deploy ai-chat-gpt4
```

### **Problema: Tabelas não existem**
```bash
# Execute o script de configuração
export SUPABASE_SERVICE_ROLE_KEY=sua_chave
node scripts/setup-agendamento-localhost.js
```

## 📱 Testando no WhatsApp

### **Mensagens de teste recomendadas:**

1. **Início do agendamento:**
   ```
   Olá, preciso agendar uma consulta
   ```

2. **Dados do paciente:**
   ```
   Nome: Maria Santos
   Telefone: 5511888888888
   Email: maria@teste.com
   ```

3. **Escolha de serviço:**
   ```
   Consulta médica
   ```

4. **Escolha de profissional:**
   ```
   Dr. João Silva
   ```

5. **Escolha de data:**
   ```
   Quinta-feira
   ```

6. **Escolha de horário:**
   ```
   15:30
   ```

7. **Confirmação:**
   ```
   Sim, confirmar agendamento
   ```

## 🎯 Resultado Esperado

Após o teste bem-sucedido, você deve ver:

1. ✅ QR Code aparecendo no frontend
2. ✅ Status "Conectado" no WhatsApp
3. ✅ Chatbot respondendo às mensagens
4. ✅ Fluxo de agendamento funcionando
5. ✅ Dados salvos no banco de dados
6. ✅ Agendamento confirmado no final
7. ✅ **Evento criado no Google Calendar** 🆕
8. ✅ **Lembretes configurados** 🆕

## 📊 Monitoramento

### **Logs importantes para verificar:**

1. **Edge Function logs:**
   - Webhook recebido
   - Processamento da mensagem
   - Resposta enviada
   - **Criação do evento no Google Calendar** 🆕

2. **Banco de dados:**
   - Sessões criadas
   - Agendamentos confirmados
   - Dados do paciente salvos
   - **ID do evento do Google Calendar** 🆕

3. **Google Calendar:**
   - Evento criado com detalhes corretos
   - Lembretes configurados
   - Localização e participantes

4. **Frontend:**
   - Status da conexão
   - QR Code gerado
   - Interface responsiva

## 🚀 Próximos Passos

Após o teste bem-sucedido:

1. **Teste em produção:**
   - Deploy no domínio principal
   - Teste com usuários reais

2. **Melhorias:**
   - Adicionar mais serviços
   - Configurar horários disponíveis
   - Implementar notificações
   - **Sincronização bidirecional com Google Calendar** 🆕

3. **Monitoramento:**
   - Configurar alertas
   - Monitorar performance
   - Coletar feedback dos usuários
   - **Monitorar sincronização de calendário** 🆕

---

**🎉 Parabéns!** Se você chegou até aqui, o sistema de agendamento com integração ao Google Calendar está funcionando corretamente no localhost!
