# Sistema de Agendamento Inteligente - Resumo

## 🎯 Objetivo

Implementar um sistema de agendamento inteligente no chatbot da ESADI que permita aos pacientes agendar consultas e exames de forma automatizada e intuitiva via WhatsApp.

## 🏗️ Arquitetura do Sistema

### Componentes Principais

1. **Serviço de Agendamento Inteligente** (`src/services/agendamentoInteligenteService.ts`)
   - Gerenciamento de conversas de agendamento
   - Processamento de mensagens por etapa
   - Integração com banco de dados
   - Validação de dados

2. **Tabelas de Banco de Dados** (`scripts/setup-agendamento-tables.sql`)
   - `pacientes` - Cadastro de pacientes
   - `agendamentos` - Agendamentos realizados
   - `conversas_agendamento` - Histórico de conversas
   - `disponibilidade_horarios` - Controle de agenda
   - `historico_agendamentos` - Log de mudanças

3. **Edge Function Atualizada** (`supabase/functions/whatsapp-integration/index.ts`)
   - Integração com sistema de agendamento
   - Processamento inteligente de mensagens
   - Criação automática de pacientes e agendamentos

## 🔄 Fluxo de Agendamento

### Etapas do Processo

1. **Início** - Usuário solicita agendamento
2. **Coleta de Dados** - Nome e telefone do paciente
3. **Escolha do Serviço** - Consulta ou exame específico
4. **Escolha do Profissional** - Médico preferido
5. **Escolha da Data** - Data disponível
6. **Escolha do Horário** - Horário disponível
7. **Confirmação** - Confirmação final do agendamento

### Serviços Disponíveis

- **Consulta Gastroenterológica** - R$ 280,00
- **Endoscopia Digestiva Alta** - R$ 450,00
- **Colonoscopia** - R$ 650,00
- **Teste Respiratório para H. Pylori** - R$ 180,00

### Profissionais Disponíveis

- **Dr. Carlos Eduardo Silva** (CRM-SC 12345)
  - Especialidades: Gastroenterologia e Endoscopia
  - Experiência: Mais de 25 anos

- **Dr. João da Silva** (CRM-SC 9999)
  - Especialidades: Endoscopia, Colonoscopia e Hepatologia
  - Experiência: Mais de 10 anos

## 💾 Estrutura do Banco de Dados

### Tabela: pacientes
```sql
CREATE TABLE pacientes (
    id UUID PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255),
    data_nascimento DATE,
    cpf VARCHAR(14),
    convenio VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Tabela: agendamentos
```sql
CREATE TABLE agendamentos (
    id UUID PRIMARY KEY,
    paciente_id UUID REFERENCES pacientes(id),
    profissional_id VARCHAR(50) NOT NULL,
    servico_id VARCHAR(50) NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'agendado',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### Tabela: conversas_agendamento
```sql
CREATE TABLE conversas_agendamento (
    id UUID PRIMARY KEY,
    telefone VARCHAR(20) NOT NULL,
    dados_conversa JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

## 🤖 Funcionalidades do Chatbot

### Processamento Inteligente

- **Detecção de Intenção**: Identifica quando o usuário quer agendar
- **Coleta Estruturada**: Coleta dados de forma organizada
- **Validação**: Valida dados em tempo real
- **Confirmação**: Confirma agendamento antes de salvar
- **Tratamento de Erros**: Gerencia erros e reinicia processo

### Respostas Contextuais

- **Personalizadas**: Usa nome do paciente nas respostas
- **Informativas**: Fornece detalhes completos dos serviços
- **Orientativas**: Guia o usuário pelo processo
- **Confirmação**: Mostra resumo antes de confirmar

### Integração com WhatsApp

- **Envio Automático**: Envia respostas via WhatsApp
- **Formatação**: Usa formatação rica (negrito, emojis)
- **Confirmação**: Envia confirmação detalhada
- **Lembretes**: Inclui informações importantes

## 🔧 Funcionalidades Técnicas

### Controle de Estado

```typescript
interface ConversaAgendamento {
  paciente_id?: string;
  etapa: 'inicio' | 'coleta_dados' | 'escolha_servico' | 
        'escolha_profissional' | 'escolha_data' | 
        'escolha_horario' | 'confirmacao' | 'finalizado';
  dados_coletados: {
    nome?: string;
    telefone?: string;
    servico_desejado?: string;
    profissional_preferido?: string;
    data_preferida?: string;
    horario_preferido?: string;
  };
  tentativas: number;
  ultima_interacao: string;
}
```

### Validações Implementadas

- **Telefone**: Formato e comprimento
- **Serviço**: Existência na lista
- **Profissional**: Disponibilidade
- **Data**: Formato e disponibilidade
- **Horário**: Disponibilidade

### Tratamento de Erros

- **Dados Inválidos**: Solicita correção
- **Serviço Não Encontrado**: Lista opções
- **Erro de Sistema**: Mensagem amigável
- **Timeout**: Reinicia processo

## 📊 Monitoramento e Logs

### Logs Implementados

- **Conversas**: Histórico completo de interações
- **Agendamentos**: Log de criação e modificação
- **Erros**: Detalhamento de falhas
- **Performance**: Tempo de resposta

### Métricas Disponíveis

- **Taxa de Conversão**: Agendamentos completados
- **Tempo Médio**: Duração do processo
- **Abandono**: Pontos de desistência
- **Erros**: Tipos e frequência

## 🧪 Testes Implementados

### Cenários de Teste

1. **Agendamento Completo - Consulta**
   - Fluxo completo para consulta
   - Validação de dados
   - Confirmação final

2. **Agendamento Completo - Exame**
   - Fluxo para exame específico
   - Seleção de profissional
   - Confirmação

3. **Agendamento com Profissional Qualquer**
   - Seleção automática
   - Disponibilidade
   - Confirmação

4. **Cancelamento no Final**
   - Desistência na confirmação
   - Reinício do processo

### Script de Teste

```bash
node scripts/test-agendamento-chatbot.js
```

## 🚀 Próximos Passos

### Melhorias Planejadas

1. **Integração com Google Calendar**
   - Sincronização automática
   - Verificação de disponibilidade real
   - Bloqueio de horários

2. **Sistema de Lembretes**
   - Lembretes automáticos
   - Confirmação de presença
   - Cancelamento facilitado

3. **Reagendamento**
   - Processo de remarcação
   - Histórico de mudanças
   - Notificação de alterações

4. **Relatórios**
   - Dashboard de agendamentos
   - Métricas de performance
   - Análise de tendências

### Funcionalidades Avançadas

1. **Inteligência Artificial**
   - Sugestão de horários
   - Detecção de padrões
   - Otimização de agenda

2. **Integração com Convênios**
   - Verificação de cobertura
   - Autorização automática
   - Cobrança diferenciada

3. **Sistema de Fidelidade**
   - Histórico de atendimentos
   - Benefícios para pacientes recorrentes
   - Programa de indicações

## 📞 Suporte e Manutenção

### Monitoramento

- **Logs em Tempo Real**: Dashboard do Supabase
- **Alertas**: Notificações de erros
- **Backup**: Backup automático dos dados
- **Performance**: Monitoramento de resposta

### Manutenção

- **Atualizações**: Deploy automático
- **Backup**: Backup diário
- **Segurança**: Políticas RLS
- **Escalabilidade**: Arquitetura preparada

---

**Status**: ✅ Implementado e Testado  
**Versão**: 1.0.0  
**Data**: 30/06/2024  
**Branch**: `feature/agendamento-chatbot` 