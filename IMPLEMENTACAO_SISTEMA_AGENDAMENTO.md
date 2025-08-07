# Sistema de Agendamento via WhatsApp - Implementação Completa

## 📋 Resumo da Implementação

O sistema de agendamento foi implementado seguindo os requisitos especificados:

1. **Reconhecimento de intenção** → Agendamento detectado
2. **Consulta Google Calendar** → Horários livres verificados
3. **Apresentação de opções** → Usuário escolhe horário
4. **Criação do evento** → Tanto no Google Calendar quanto no sistema interno

## 🏗️ Arquitetura do Sistema

### Componentes Principais

#### 1. **AppointmentService** (`src/services/appointmentService.ts`)
- Reconhecimento de intenções de agendamento
- Consulta de horários disponíveis no Google Calendar
- Criação, reagendamento e cancelamento de agendamentos
- Integração com banco de dados local

#### 2. **AppointmentConversationService** (`src/services/appointmentConversationService.ts`)
- Gerenciamento do fluxo de conversação
- Coleta de dados do paciente
- Validação de informações
- Confirmação de agendamento

#### 3. **ContextualizacaoService** (`src/services/contextualizacaoService.ts`)
- Gerenciamento de dados das clínicas
- Horários de funcionamento
- Especialidades e profissionais
- Configurações específicas

#### 4. **Webhook Integrado** (`routes/webhook-contextualized.js`)
- Processamento de mensagens do WhatsApp
- Integração com sistema de agendamento
- Respostas automáticas

## 🔄 Fluxo de Agendamento

### 1. **Reconhecimento de Intenção**
```
Usuário: "Quero agendar uma consulta"
Sistema: Detecta APPOINTMENT_CREATE
```

### 2. **Coleta de Dados**
```
Sistema: "Qual é o seu nome completo?"
Usuário: "João Silva"
Sistema: "Agora preciso da sua data de nascimento (DD/MM/AAAA)"
Usuário: "15/03/1990"
```

### 3. **Seleção de Serviço**
```
Sistema: "Qual tipo de atendimento?"
1️⃣ Consulta médica
2️⃣ Exame
3️⃣ Procedimento
```

### 4. **Busca de Horários**
```
Sistema: Consulta Google Calendar + JSON de contextualização
Resultado: Horários livres dentro do funcionamento da clínica
```

### 5. **Apresentação de Opções**
```
Sistema: "Horários disponíveis para hoje:"
1️⃣ 14:00 - 14:30
2️⃣ 15:00 - 15:30
3️⃣ 16:00 - 16:30
```

### 6. **Confirmação**
```
Sistema: "Confirme os dados:"
👤 Nome: João Silva
📅 Data: 2024-01-15
⏰ Horário: 14:00 - 14:30
🏥 Serviço: consulta médica
```

### 7. **Criação do Evento**
```
Sistema: Cria evento no Google Calendar
Sistema: Salva no banco de dados local
Sistema: Envia confirmação via WhatsApp
```

## 📊 Dados Coletados

### Obrigatórios:
- **Nome completo do paciente**
- **Telefone** (via WhatsApp)
- **Data de nascimento**
- **Tipo de consulta/exame**
- **Horário escolhido**

### Opcionais:
- **Observações/queixa principal**
- **Se é primeira consulta**
- **Convênio**

## 🔧 Configurações

### JSON de Contextualização
```json
{
  "clinica": {
    "horario_funcionamento": {
      "segunda": {"abertura": "08:00", "fechamento": "18:00"},
      "terca": {"abertura": "08:00", "fechamento": "18:00"}
    },
    "profissionais": [
      {
        "tempo_consulta_padrao": 30,
        "especialidades": ["Cardiologia"]
      }
    ]
  }
}
```

### Integração Google Calendar
- Verificação de eventos existentes
- Criação de novos eventos
- Sincronização com sistema interno

## 🚀 Como Usar

### 1. **Teste Local**
```bash
node test-appointment-system.js
```

### 2. **Via WhatsApp**
Envie mensagem para o número configurado:
```
"Quero agendar uma consulta"
```

### 3. **Fluxo Completo**
O sistema guiará o usuário através de:
1. Coleta de dados pessoais
2. Seleção de tipo de serviço
3. Escolha de horário disponível
4. Confirmação final

## 🔄 Funcionalidades Adicionais

### Reagendamento
```
Usuário: "Quero reagendar minha consulta"
Sistema: Busca agendamentos existentes
Sistema: Cancela evento original
Sistema: Cria novo agendamento
```

### Cancelamento
```
Usuário: "Quero cancelar meu agendamento"
Sistema: Cancela no Google Calendar
Sistema: Atualiza status no banco
Sistema: Confirma cancelamento
```

## 📈 Benefícios

1. **Automatização completa** do processo de agendamento
2. **Integração com Google Calendar** para sincronização
3. **Validação de horários** baseada no funcionamento da clínica
4. **Coleta estruturada** de dados do paciente
5. **Confirmação automática** via WhatsApp
6. **Flexibilidade** para diferentes tipos de serviço

## 🔒 Segurança e Validação

- Validação de formato de data
- Verificação de horários disponíveis
- Confirmação antes da criação
- Tratamento de erros robusto
- Logs detalhados para auditoria

## 📝 Próximos Passos

1. **Teste em produção** com dados reais
2. **Ajuste de horários** baseado em feedback
3. **Integração com sistemas** da clínica
4. **Relatórios e analytics** de agendamentos
5. **Notificações automáticas** de lembrete

---

**Status**: ✅ Implementação Completa
**Versão**: 1.0.0
**Data**: Janeiro 2024 