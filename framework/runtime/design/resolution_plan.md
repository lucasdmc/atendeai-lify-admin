# Plano de Resolução - Gaps e Divergências

## Estratégia Geral

**Regra de Decisão**: Conforme especificação, **priorizar documentação** sobre comportamento atual quando houver divergência.

## 1. RF08 - Sistema de Priorização Avançada (CRÍTICO)

### Gap Identificado:
- **Implementado**: Ordenação de serviços por prioridade na exibição
- **Missing**: Lógica para remanejar eventos existentes de menor prioridade
- **Missing**: Sistema de cores baseado em prioridade no Google Calendar

### Plano de Resolução:

#### 1.1 Implementar Event Reallocation Logic
**Ação**: Atualizar código
**Arquivo**: `services/core/appointmentFlowManager.js`
**Implementação**:
```javascript
async checkForPriorityConflicts(selectedSlot, selectedService, clinicContext) {
  // 1. Buscar eventos existentes no slot
  // 2. Verificar prioridades relativas
  // 3. Se prioridade maior, realocar evento existente
  // 4. Notificar paciente do evento realocado
}

async reallocateEvent(existingEvent, newSlot, clinicContext) {
  // 1. Mover evento para novo horário
  // 2. Enviar notificação WhatsApp para paciente
  // 3. Aplicar marcação de "realocado" no calendar
}
```

**Justificativa**: Requisito funcional obrigatório (RF08)
**Risco**: ALTO - Funcionalidade crítica não implementada
**Prazo**: 2-3 dias de desenvolvimento

#### 1.2 Sistema de Cores Google Calendar
**Ação**: Atualizar código  
**Arquivo**: `services/core/googleCalendarService.js`
**Implementação**:
```javascript
const priorityColorMap = {
  'urgencia': 11, // Vermelho
  'retorno': 8,   // Amarelo  
  'consulta': 1,  // Azul
  'exame': 2,     // Verde
  'procedimento': 6 // Laranja
};
```

**Justificativa**: Melhora experiência visual e facilita identificação
**Risco**: BAIXO - Funcionalidade visual
**Prazo**: 1 dia

### Cronograma:
- **Semana 1**: Implementar lógica de detecção de conflitos
- **Semana 2**: Implementar realocação automática + notificações
- **Semana 3**: Sistema de cores + testes

---

## 2. Migração de Schema (PENDENTE)

### Gap Identificado:
- **Status**: Migration SQL criada mas não aplicada
- **File**: `framework/runtime/design/database/20250818090000_schema_unificacao_whatsapp_google.sql`

### Plano de Resolução:

#### 2.1 Aplicar Migration
**Ação**: Deploy database  
**Comando**: 
```bash
cd supabase
supabase migration up
```

**Justificativa**: Schema desatualizado pode causar inconsistências
**Risco**: ALTO - Breaking changes em produção
**Prazo**: 1-2 horas

#### 2.2 Scripts de Backfill
**Ação**: Criar scripts
**Arquivos necessários**:
- `scripts/migrate-whatsapp-mappings.sql`
- `scripts/migrate-google-tokens.sql`
- `scripts/validate-migration.sql`

**Justificativa**: Preservar dados existentes durante migração
**Risco**: ALTO - Perda de dados
**Prazo**: 1 dia

### Cronograma:
- **Hoje**: Validar migration em ambiente dev
- **Amanhã**: Aplicar em staging + testes
- **+2 dias**: Deploy produção com janela de manutenção

---

## 3. ErrorBoundary e Toast Review (MÉDIO)

### Gap Identificado:
- **Frontend**: ErrorBoundary pode não capturar todos os erros
- **UX**: Toasts podem não ser informativos o suficiente

### Plano de Resolução:

#### 3.1 ErrorBoundary Enhancement
**Ação**: Atualizar código
**Arquivo**: `src/components/ErrorBoundary.tsx`
**Implementação**:
- Captura de erros assíncronos
- Logs estruturados com correlation ID
- Fallback UI mais informativo
- Reset automático após erro

**Justificativa**: Melhora experiência em caso de erro
**Risco**: BAIXO - Melhoria incremental
**Prazo**: 1 dia

#### 3.2 Toast System Review  
**Ação**: Atualizar código
**Arquivo**: `src/components/ui/toaster.tsx`
**Implementação**:
- Categorização por severidade
- Ações contextuais (retry, contact support)
- Persistência de mensagens críticas
- Integração com sistema de logs

**Justificativa**: Melhor comunicação de status ao usuário
**Risco**: BAIXO - UX improvement
**Prazo**: 1 dia

### Cronograma:
- **Semana 2**: ErrorBoundary enhancement
- **Semana 2**: Toast system review

---

## 4. Testes Automatizados (ALTO)

### Gap Identificado:
- **Missing**: Testes unitários para webhook handlers
- **Missing**: Testes de integração para fluxo WhatsApp
- **Missing**: Testes end-to-end

### Plano de Resolução:

#### 4.1 Unit Tests - Webhook Handlers
**Ação**: Criar testes
**Arquivo**: `tests/unit/webhook-handlers.test.js`
**Coverage**:
- Verificação de webhook
- Idempotência de mensagens
- Parsing de payloads Meta
- Error handling

**Justificativa**: Garantir estabilidade do endpoint crítico
**Risco**: BAIXO - Não afeta produção
**Prazo**: 2 dias

#### 4.2 Integration Tests - WhatsApp Flow
**Ação**: Criar testes
**Arquivo**: `tests/integration/whatsapp-flow.test.js`
**Coverage**:
- Fluxo completo: webhook → DB → LLM → response
- Modo simulação vs real
- Persistência de conversas
- Context manager integration

**Justificativa**: Validar fluxo end-to-end crítico
**Risco**: BAIXO - Ambiente isolado
**Prazo**: 3 dias

#### 4.3 QA Checklist Manual
**Ação**: Criar checklist
**Arquivo**: `tests/manual/qa-checklist.md`
**Coverage**:
- Cenários de uso comum
- Edge cases críticos
- Performance benchmarks
- Security validations

**Justificativa**: Validação humana complementar
**Risco**: BAIXO - Processo manual
**Prazo**: 1 dia

### Cronograma:
- **Semana 3**: Unit tests
- **Semana 4**: Integration tests  
- **Semana 4**: QA checklist

---

## 5. Priorização de Implementação

### Crítico (Esta Semana):
1. **Migração Database** - Risco de inconsistência
2. **RF08 - Detecção de Conflitos** - Funcionalidade obrigatória

### Alto (Próximas 2 Semanas):
3. **RF08 - Realocação Completa** - Completar funcionalidade
4. **Testes Unitários** - Garantir estabilidade

### Médio (Próximas 3-4 Semanas):
5. **ErrorBoundary/Toast Review** - Melhorar UX
6. **Testes de Integração** - Coverage completo

### Baixo (Background):
7. **Sistema de Cores** - Enhancement visual
8. **QA Manual** - Processo contínuo

---

## 6. Riscos e Mitigações

### Riscos Altos:
1. **Migration Breaking Changes**
   - **Mitigação**: Test em staging primeiro
   - **Rollback**: Backup completo pré-migration
   
2. **RF08 Complexity**
   - **Mitigação**: Implementação incremental
   - **Fallback**: Escalação humana se falhar

### Riscos Médios:
3. **Performance Impact**
   - **Mitigação**: Benchmarks antes/depois
   - **Monitoring**: Alerts em produção

### Riscos Baixos:
4. **Compatibilidade Frontend**
   - **Mitigação**: Testes em múltiplos browsers
   - **Graceful degradation**: Fallbacks para funcionalidades

---

## 7. Definição de Sucesso

### Critérios de Aceite:
- ✅ RF08 completamente implementado e testado
- ✅ Migration aplicada sem perda de dados  
- ✅ Cobertura de testes > 80% em módulos críticos
- ✅ Zero regressões em funcionalidades existentes
- ✅ Performance mantida ou melhorada

### Métricas de Validação:
- **Functional**: Todos RFs testados e funcionando
- **Performance**: Response time < 2s (RNF01)
- **Reliability**: Uptime > 99% durante migration
- **Quality**: Code coverage > 80%

---

**Status**: APROVADO para implementação
**Owner**: Expert Developer
**Timeline**: 4 semanas
**Next Action**: Iniciar migração database em ambiente dev
