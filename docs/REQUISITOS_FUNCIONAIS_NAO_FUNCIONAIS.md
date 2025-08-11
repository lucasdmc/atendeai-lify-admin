# 📋 REQUISITOS FUNCIONAIS E NÃO FUNCIONAIS
## Sistema AtendeAI Lify Admin - Análise da Lógica Atual

---

## 🎯 **OBJETIVO DO DOCUMENTO**
Este documento traduz a lógica implementada no sistema em requisitos funcionais e não funcionais, permitindo identificar:
- ✅ O que está funcionando corretamente
- ❌ Onde estão os problemas de regra de negócio
- 🔧 O que precisa ser corrigido ou melhorado

---

## 🏗️ **ARQUITETURA ATUAL IMPLEMENTADA**

### **1. Estrutura de Serviços Core**
```
services/core/
├── LLMOrchestratorService.js      # Orquestrador principal de IA
├── ClinicContextManager.js        # Gerenciador de contexto das clínicas
├── AppointmentFlowManager.js      # Gerenciador de fluxo de agendamento
├── GoogleCalendarService.js       # Integração com Google Calendar
└── HumanizationHelpers.js        # Humanização de mensagens
```

### **2. Fluxo de Processamento**
```
WhatsApp Message → Webhook → LLMOrchestratorService → ClinicContextManager → Resposta Personalizada
```

---

## 📋 **REQUISITOS FUNCIONAIS IMPLEMENTADOS**

### **RF001 - Processamento de Mensagens WhatsApp**
- **Descrição**: Sistema deve processar mensagens recebidas via webhook do WhatsApp
- **Implementação**: ✅ Funcionando via `routes/webhook-final.js`
- **Entrada**: Mensagem JSON do WhatsApp Meta
- **Saída**: Resposta processada e enviada de volta

### **RF002 - Gerenciamento de Contexto de Clínicas**
- **Descrição**: Sistema deve carregar e gerenciar contexto específico de cada clínica
- **Implementação**: ✅ Implementado via `ClinicContextManager`
- **Fonte de Dados**: APENAS arquivos JSON em `data/contextualizacao-*.json`
- **Regra**: NUNCA assume ou cria JSONs manualmente

### **RF003 - Orquestração de IA**
- **Descrição**: Sistema deve orquestrar respostas de IA usando OpenAI
- **Implementação**: ✅ Implementado via `LLMOrchestratorService`
- **Modelo**: GPT-4o-mini
- **Funcionalidades**: Detecção de intenção, geração de respostas, memória conversacional

### **RF004 - Sistema de Memória Conversacional**
- **Descrição**: Sistema deve manter histórico de conversas
- **Implementação**: ✅ Implementado via Supabase
- **Armazenamento**: Tabela `conversations` e `messages`

### **RF005 - Integração com Google Calendar**
- **Descrição**: Sistema deve integrar com Google Calendar para agendamentos
- **Implementação**: ✅ Implementado via `GoogleCalendarService`
- **Funcionalidades**: Verificar disponibilidade, criar eventos

### **RF006 - Gerenciamento de Fluxo de Agendamento**
- **Descrição**: Sistema deve gerenciar processo completo de agendamento
- **Implementação**: ✅ Implementado via `AppointmentFlowManager`
- **Funcionalidades**: Validação de horários, confirmação, criação de eventos

### **RF007 - Humanização de Mensagens**
- **Descrição**: Sistema deve gerar mensagens com tom humano e personalizado
- **Implementação**: ✅ Implementado via `HumanizationHelpers`
- **Funcionalidades**: Variação de linguagem, personalidade da clínica

---

## 📋 **REQUISITOS NÃO FUNCIONAIS IMPLEMENTADOS**

### **RNF001 - Performance**
- **Descrição**: Sistema deve responder em tempo adequado
- **Implementação**: ✅ Cache em memória via `ClinicContextManager`
- **Métrica**: Resposta em < 5 segundos

### **RNF002 - Disponibilidade**
- **Descrição**: Sistema deve estar disponível 24/7
- **Implementação**: ✅ Deploy no Railway com healthcheck
- **Métrica**: Uptime > 99%

### **RNF003 - Escalabilidade**
- **Descrição**: Sistema deve suportar múltiplas clínicas
- **Implementação**: ✅ Arquitetura modular e cache inteligente
- **Capacidade**: Suporte a N clínicas via JSONs

### **RNF004 - Segurança**
- **Descrição**: Sistema deve validar webhooks e autenticar usuários
- **Implementação**: ✅ Validação de webhook e middleware de autenticação
- **Proteções**: Rate limiting, validação de entrada

---

## 🔍 **ANÁLISE CRÍTICA DA LÓGICA ATUAL**

### **✅ PONTOS FORTES IDENTIFICADOS**

1. **Arquitetura Modular**: Serviços bem separados e responsabilidades claras
2. **Fonte Única de Dados**: Sistema usa APENAS JSONs da tela de clínicas
3. **Cache Inteligente**: Contexto das clínicas carregado uma vez na inicialização
4. **Fallback Robusto**: Sistema sempre funciona, mesmo com erros
5. **Integração Completa**: WhatsApp + IA + Google Calendar + Supabase

### **❌ PROBLEMAS DE REGRA DE NEGÓCIO IDENTIFICADOS**

#### **P1 - Seleção de Clínica Hardcoded**
- **Problema**: `LLMOrchestratorService.processMessage()` usa `'cardioprime'` hardcoded
- **Impacto**: Sistema só funciona para uma clínica específica
- **Regra Correta**: Deve identificar clínica baseado no número do WhatsApp
- **Localização**: `services/core/llmOrchestratorService.js:45`

#### **P2 - Falta de Mapeamento WhatsApp → Clínica**
- **Problema**: Não existe lógica para mapear número WhatsApp para clínica
- **Impacto**: Sistema não consegue identificar qual clínica atender
- **Regra Correta**: Deve existir mapeamento entre números e clínicas
- **Solução Necessária**: Implementar `ClinicContextManager.getClinicByWhatsApp()`

#### **P3 - Validação de Horário de Funcionamento**
- **Problema**: Lógica de horário existe mas não está integrada ao fluxo principal
- **Impacto**: Sistema pode agendar fora do horário de funcionamento
- **Regra Correta**: Deve validar horário antes de processar agendamento
- **Localização**: `services/core/llmOrchestratorService.js:89`

#### **P4 - Tratamento de Erros Inconsistente**
- **Problema**: Diferentes serviços tratam erros de formas diferentes
- **Impacto**: Experiência do usuário inconsistente
- **Regra Correta**: Padrão único de tratamento de erros
- **Solução Necessária**: Implementar `ErrorHandler` centralizado

#### **P5 - Falta de Validação de Dados de Entrada**
- **Problema**: Sistema não valida formato e conteúdo das mensagens
- **Impacto**: Possíveis crashes com dados malformados
- **Regra Correta**: Validar todas as entradas antes do processamento
- **Solução Necessária**: Implementar middleware de validação

---

## 🚨 **PROBLEMAS CRÍTICOS DE REGRA DE NEGÓCIO**

### **CRÍTICO 1: Identificação de Clínica**
```
❌ ATUAL: clinicKey = 'cardioprime' (hardcoded)
✅ CORRETO: clinicKey = this.getClinicByWhatsApp(phoneNumber)
```

### **CRÍTICO 2: Mapeamento WhatsApp → Clínica**
```
❌ ATUAL: Não existe
✅ CORRETO: Implementar em ClinicContextManager
```

### **CRÍTICO 3: Validação de Horário**
```
❌ ATUAL: Existe mas não é usada
✅ CORRETO: Integrar ao fluxo de agendamento
```

### **CRÍTICO 4: Tratamento de Erros**
```
❌ ATUAL: Inconsistente entre serviços
✅ CORRETO: Padrão único centralizado
```

---

## 🔧 **PLANO DE CORREÇÃO PRIORITÁRIO**

### **FASE 1: Correções Críticas (24h)**
1. Implementar `getClinicByWhatsApp()` no `ClinicContextManager`
2. Corrigir seleção de clínica em `LLMOrchestratorService`
3. Integrar validação de horário ao fluxo principal

### **FASE 2: Melhorias de Qualidade (48h)**
1. Implementar `ErrorHandler` centralizado
2. Adicionar validação de dados de entrada
3. Padronizar tratamento de erros

### **FASE 3: Otimizações (72h)**
1. Melhorar cache de contexto
2. Implementar retry automático
3. Adicionar métricas de performance

---

## 📊 **MÉTRICAS DE QUALIDADE ATUAL**

| Aspecto | Status | Score | Observações |
|---------|--------|-------|-------------|
| **Funcionalidade** | ✅ | 8/10 | Funciona mas com limitações |
| **Arquitetura** | ✅ | 9/10 | Bem estruturado e modular |
| **Regras de Negócio** | ❌ | 4/10 | Problemas críticos identificados |
| **Tratamento de Erros** | ⚠️ | 6/10 | Inconsistente entre serviços |
| **Validação** | ❌ | 3/10 | Falta validação de entrada |
| **Documentação** | ✅ | 8/10 | Bem documentado |

---

## 🎯 **CONCLUSÃO**

O sistema tem uma **arquitetura sólida** e **funcionalidades implementadas**, mas apresenta **problemas críticos de regra de negócio** que impedem seu funcionamento correto em produção:

1. **❌ Não consegue identificar clínicas** baseado no WhatsApp
2. **❌ Funciona apenas para uma clínica hardcoded**
3. **❌ Não valida horários de funcionamento**
4. **❌ Tratamento de erros inconsistente**

**Prioridade máxima**: Corrigir a identificação de clínicas e implementar o mapeamento WhatsApp → Clínica.

---

## 📝 **PRÓXIMOS PASSOS**

1. **Implementar correções críticas** identificadas
2. **Testar funcionalidade** com múltiplas clínicas
3. **Validar regras de negócio** corrigidas
4. **Documentar mudanças** implementadas
5. **Deploy e teste** em produção

---

*Documento gerado em: ${new Date().toLocaleString('pt-BR')}*
*Versão do Sistema: AtendeAI Lify Admin v1.0*
*Status: Análise Crítica Concluída*
