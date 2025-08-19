# 📋 BACKLOG - FEATURE DE AGENDAMENTO WHATSAPP

## 🎯 **OBJETIVO**
Este documento contém todos os itens pendentes, melhorias futuras e correções que foram identificadas durante o desenvolvimento e revisão da feature de agendamento WhatsApp.

---

## 🚨 **PROBLEMAS CRÍTICOS RESOLVIDOS**
- ✅ **Problema de Roteamento:** Feature sendo ignorada com mensagem padrão sobre telefone
- ✅ **Inicialização do AppointmentFlowManager:** Falha silenciosa na inicialização
- ✅ **Estrutura do Intent:** Problema de `{ intent: '...' }` vs `{ name: '...' }`
- ✅ **Sistema de Fallbacks:** Falta de respostas úteis quando sistema falha

---

## 🔧 **MELHORIAS TÉCNICAS PENDENTES**

### **[MEDIUM] Limite de Retry para Inicialização**
**Arquivo:** `services/core/llmOrchestratorService.js`  
**Localização:** Linha 183  
**Problema:** Retry logic pode causar loops infinitos em caso de falha persistente  
**Solução:** Implementar limite máximo de tentativas com backoff exponencial

```javascript
static async initializeAppointmentFlow(maxRetries = 3) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      // ... lógica de inicialização
      return this.appointmentFlowManager;
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error(`Falha na inicialização após ${maxRetries} tentativas`);
      }
      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
}
```

### **[MEDIUM] Lock para Inicialização Simultânea**
**Arquivo:** `services/core/llmOrchestratorService.js`  
**Problema:** Múltiplas inicializações simultâneas podem causar race conditions  
**Solução:** Implementar lock para evitar inicializações duplicadas

```javascript
static initializationLock = null;

static async initializeAppointmentFlow() {
  if (this.initializationLock) {
    return this.initializationLock;
  }
  
  this.initializationLock = this._doInitialize();
  return this.initializationLock;
}
```

### **[LOW] Configuração de Logs Configurável**
**Arquivos:** Todos os arquivos de serviço  
**Problema:** Logs excessivos em produção podem impactar performance  
**Solução:** Implementar níveis de log configuráveis via variáveis de ambiente

```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level, message, data) {
  if (LOG_LEVEL === 'debug' || level === 'error') {
    console.log(`[${level.toUpperCase()}] ${message}`, data);
  }
}
```

---

## 🧪 **TESTES PENDENTES**

### **[HIGH] Testes Unitários**
**Status:** Não implementados  
**Arquivos a testar:**
- `services/core/llmOrchestratorService.js`
- `services/core/appointmentFlowManager.js`
- `services/core/toolsRouter.js`
- `services/core/intentDetector.js`

**Cobertura necessária:**
- Inicialização de serviços
- Detecção de intents
- Roteamento de mensagens
- Gerenciamento de estado do fluxo
- Tratamento de erros

### **[MEDIUM] Testes de Integração**
**Status:** Parcialmente implementados  
**Melhorias necessárias:**
- Testes com banco de dados real (Supabase)
- Testes de integração com Google Calendar
- Testes de webhook do WhatsApp
- Testes de contexto da clínica

### **[LOW] Testes de Performance**
**Status:** Não implementados  
**Métricas a testar:**
- Tempo de resposta do sistema
- Uso de memória
- Latência de inicialização
- Throughput de mensagens

---

## 📊 **MONITORAMENTO E OBSERVABILIDADE**

### **[MEDIUM] Métricas de Sistema**
**Implementar:**
- Contadores de mensagens processadas
- Latência média de resposta
- Taxa de erro por tipo de intent
- Status de saúde dos serviços
- Uso de recursos (CPU, memória)

### **[LOW] Alertas Automáticos**
**Configurar:**
- Falha na inicialização do AppointmentFlowManager
- Taxa de erro acima do limite
- Latência acima do threshold
- Falha na integração com Google Calendar

---

## 🔒 **SEGURANÇA E COMPLIANCE**

### **[MEDIUM] Validação de Entrada**
**Implementar:**
- Sanitização de mensagens do WhatsApp
- Validação de números de telefone
- Rate limiting por usuário
- Proteção contra spam

### **[LOW] Auditoria e Logs de Segurança**
**Implementar:**
- Logs de todas as ações de agendamento
- Rastreamento de mudanças de estado
- Histórico de tentativas de acesso
- Compliance com LGPD

---

## 🚀 **FEATURES FUTURAS**

### **[LOW] Agendamento Recorrente**
**Descrição:** Permitir agendamento de consultas recorrentes  
**Implementação:**
- Interface para configurar frequência
- Integração com Google Calendar para eventos recorrentes
- Lembretes automáticos

### **[LOW] Confirmação por SMS/Email**
**Descrição:** Enviar confirmação por outros canais além do WhatsApp  
**Implementação:**
- Integração com serviço de SMS
- Integração com serviço de email
- Templates personalizáveis

### **[LOW] Dashboard de Agendamentos**
**Descrição:** Interface administrativa para visualizar e gerenciar agendamentos  
**Implementação:**
- Lista de agendamentos por data
- Filtros por status e clínica
- Ações de cancelamento/reagendamento
- Relatórios e métricas

---

## 🗄️ **MELHORIAS DE BANCO DE DADOS**

### **[MEDIUM] Otimização de Queries**
**Arquivo:** `services/core/flowStateStore.js`  
**Melhorias:**
- Índices para consultas frequentes
- Cache de contexto da clínica
- Paginação para listas grandes
- Limpeza automática de estados antigos

### **[LOW] Backup e Recuperação**
**Implementar:**
- Backup automático dos dados de agendamento
- Estratégia de recuperação em caso de falha
- Versionamento de dados críticos

---

## 📱 **MELHORIAS DE UX**

### **[MEDIUM] Mensagens de Erro Mais Amigáveis**
**Arquivo:** `services/core/appointmentFlowManager.js`  
**Melhorias:**
- Mensagens específicas para cada tipo de erro
- Sugestões de ação para o usuário
- Fallbacks mais inteligentes
- Suporte a múltiplos idiomas

### **[LOW] Personalização de Interface**
**Implementar:**
- Temas personalizáveis por clínica
- Logos e cores da marca
- Mensagens personalizadas
- Horários de funcionamento específicos

---

## 🔄 **REFATORAÇÃO E MANUTENÇÃO**

### **[MEDIUM] Separação de Responsabilidades**
**Arquivo:** `services/core/llmOrchestratorService.js`  
**Problema:** Classe muito grande com muitas responsabilidades  
**Solução:** Dividir em serviços menores e mais focados

### **[LOW] Padronização de Código**
**Implementar:**
- ESLint com regras específicas do projeto
- Prettier para formatação
- Husky para pre-commit hooks
- Conventional Commits

---

## 📈 **ESCALABILIDADE**

### **[MEDIUM] Cache Distribuído**
**Implementar:**
- Redis para cache de contexto da clínica
- Cache de tokens do Google Calendar
- Cache de estados de fluxo
- Invalidação inteligente de cache

### **[LOW] Load Balancing**
**Implementar:**
- Múltiplas instâncias do serviço
- Balanceamento de carga
- Health checks
- Auto-scaling

---

## 🎯 **PRIORIZAÇÃO RECOMENDADA**

### **FASE 1 (Próximas 2 semanas):**
1. **[HIGH]** Implementar testes unitários
2. **[MEDIUM]** Limite de retry para inicialização
3. **[MEDIUM]** Lock para inicialização simultânea

### **FASE 2 (Próximas 4 semanas):**
1. **[MEDIUM]** Métricas de sistema
2. **[MEDIUM]** Validação de entrada
3. **[MEDIUM]** Otimização de queries

### **FASE 3 (Próximas 8 semanas):**
1. **[LOW]** Configuração de logs configurável
2. **[LOW]** Testes de performance
3. **[LOW]** Cache distribuído

---

## 📝 **NOTAS DE IMPLEMENTAÇÃO**

### **Critérios de Aceitação para Cada Item:**
- Código deve ser testado (unit + integration)
- Documentação deve ser atualizada
- Performance deve ser medida antes e depois
- Logs devem ser adicionados para monitoramento

### **Processo de Review:**
- Todos os itens devem passar pelo `delivery_reviewer`
- Testes devem cobrir cenários de sucesso e falha
- Métricas devem ser coletadas e analisadas
- Usuários finais devem validar melhorias de UX

---

**Status:** Backlog criado e priorizado  
**Versão:** 1.0  
**Data:** 2025-01-18  
**Responsável:** Feature Delivery Orchestrator  
**Próxima Revisão:** Após implementação da FASE 1
