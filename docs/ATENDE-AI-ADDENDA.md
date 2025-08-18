## Addenda técnica do Atende Aí

Este documento complementa `docs/ATENDE-AI-Definicao-Tecnica.md` e consolida:
- RNFs com metas numéricas
- Cenários de aceitação em Gherkin por RF prioritários
- Esquema atualizado do `contextualization_json`
- Regras do Modo Simulação (persistência e UI)
- Matriz de permissões por perfil x ação/tela
- Plano de testes por RF e camadas

### 1. RNFs com metas numéricas
- Backend
  - Webhook receive→resposta: P95 ≤ 1200 ms; P99 ≤ 2500 ms
  - Operações Google Calendar: P95 ≤ 1800 ms; P99 ≤ 3500 ms
  - Erros 5xx (mensal): ≤ 0.5%; timeouts ≤ 0.2%
- Frontend
  - LCP P75 ≤ 2.5 s; INP P75 ≤ 200 ms; TTFB API P95 ≤ 300 ms
- Disponibilidade
  - Webhook/APIs críticas: ≥ 99.9% mensal; demais rotas: ≥ 99.5%
- Segurança
  - Senhas: bcrypt ≥ 12; tokens com expiração; logs sem PII sensível; 2FA opcional para Admin/Administrador
- Rate limiting
  - Por conversa: ≤ 10 msgs/min; burst 5. Por IP Admin: 100 req/min
- Confiabilidade agendamento
  - Idempotency-key em criação de evento; constraint para evitar double-booking
- Observabilidade
  - 100% das requisições com traceId, clinicId, conversationId; logs estruturados; métricas por fluxo

### 2. Esquema atualizado do `contextualization_json`
Campos obrigatórios por clínica (fonte única de configuração):

```json
{
  "clinica": {
    "informacoes_basicas": {
      "nome": "string",
      "tipo": "string",
      "especialidade": "string"
    },
    "localizacao": {
      "endereco_principal": {
        "logradouro": "string",
        "numero": "string",
        "complemento": "string",
        "bairro": "string",
        "cidade": "string",
        "estado": "string",
        "cep": "string"
      }
    },
    "contatos": {
      "telefone_principal": "string",
      "whatsapp": "+5511999999999",
      "email_principal": "string"
    },
    "horario_funcionamento": {
      "segunda": [{ "inicio": "08:00", "fim": "18:00" }]
    }
  },
  "servicos": {
    "consultas": [{ "id": "cardio", "nome": "Consulta Cardiologia" }],
    "exames": [],
    "procedimentos": []
  },
  "profissionais": [
    { "id": "dr-joao", "nome_completo": "Dr. João" }
  ],
  "politicas": {
    "agendamento": {
      "antecedencia_minima_horas": 24,
      "antecedencia_maxima_dias": 90,
      "priorizacao": ["urgencia", "retorno", "exame"]
    }
  },
  "google_calendar": {
    "timezone": "America/Sao_Paulo",
    "calendarios": [
      { "level": "service", "service_key": "cardio", "calendar_id": "cal_servico_a" },
      { "level": "professional", "professional_key": "dr-joao", "calendar_id": "cal_dr_joao" }
    ]
  },
  "agente_ia": {
    "configuracao": {
      "nome": "Assistente Virtual",
      "tom_comunicacao": "Formal",
      "mensagem_fora_horario": "No momento estamos fora do horário de atendimento."
    }
  }
}
```

Observações:
- A priorização do RF08 é configurável por clínica em `politicas.agendamento.priorizacao`.
- Múltiplos calendários por serviço/profissional via `google_calendar.calendarios`.

### 3. Modo Simulação: regras e persistência
- Backend
  - Se `clinics.simulation_mode = true`, o envio ao WhatsApp é bloqueado (short-circuit) e respostas são marcadas como simulação
  - Persistência obrigatória: `conversations.simulation_mode=true`, `messages.simulation_mode=true`
- Frontend
  - Badges/avisos visuais quando em simulação
  - Ações que enviam ao WhatsApp ficam bloqueadas ou claramente sinalizadas
  - Indicador global na tela de Clínicas e na tela de Conversas
- Logs/Métricas
  - Eventos: simulation_message_saved, simulation_response_saved, simulation_mode_on/off

### 4. Matriz de permissões por perfil x ação/tela (mínimo inicial)
- Perfis: Admin Lify, Suporte Lify, Gestor, Administrador, Atendente
- Regras iniciais:
  - Clínicas (CRUD): Admin Lify, Administrador
  - Usuários (CRUD): Admin Lify, Administrador
  - Conversas (leitura): todos; envio: Atendente+, com política de simulação aplicada
  - Agendamentos (tela): Gestor+, criação/edição conforme associação de calendário
  - Contextualização (leitura): Gestor+; edição: Admin Lify, Administrador

### 5. Cenários Gherkin por RF prioritários

RF02 – Contextualização por clínicas
```
Dado que a clínica X possui contextualization_json válido com contatos, horários, serviços, profissionais, politicas e google_calendar
Quando o fluxo do chatbot precisa de dados dessa clínica
Então o sistema carrega o JSON do banco (tabela clinics) e rejeita fallbacks locais
E retorna erro claro se o JSON estiver ausente ou inválido
```

RF03 – Modo Simulação
```
Dado que clinics.simulation_mode=true para a clínica X
Quando o webhook recebe a mensagem "Quero agendar"
Então a mensagem e a resposta são salvas com simulation_mode=true
E nenhuma mensagem é enviada ao WhatsApp real
E a UI da tela de Conversas exibe indicadores de simulação
```

RF07 – Agendamento via chatbot (Google Calendar)
```
Dado que o serviço "Consulta Cardiologia" está associado ao calendar_id "cal_servico_a"
Quando o usuário confirma o horário 10:00 do dia 15/08
Então o sistema cria o evento em "cal_servico_a" com idempotency-key da conversa
E não permite dois eventos sobrepostos para o mesmo profissional e horário
```

RF09 – Confirmação de agendamento
```
Dado um agendamento criado com sucesso
Quando a clínica define confirmação automática no JSON
Então o sistema envia a confirmação ao canal correto (ou salva simulado se simulation_mode)
```

RF06 – Agendamento (tela)
```
Dado que a clínica possui múltiplos calendários configurados
Quando o usuário filtra por serviço/profissional
Então a tela lista eventos do(s) calendar_id(s) mapeados no JSON
```

### 6. Plano de testes por RF e camadas
- Unitários: `ClinicContextManager`, roteamento por WhatsApp, formatação de respostas, seleção de calendário
- Integração: webhook + LLMOrchestrator + Supabase mocks; simulação on/off; criação de eventos com idempotência
- E2E: conversa ponta-a-ponta até criação de evento; alternância de simulação; permissões por perfil
- Observabilidade/Perf: asserts de traceId/clinicId, P95 em rotas críticas, taxa de erro máxima

### 7. Problemas atuais (extraídos do documento principal)
- P01 Dashboard: métricas não carregam e precisam ser definidas e implementadas
- P02 Tela de Conversas: padronizar indicadores de simulação e estados de erro
- Observação: manteremos esta lista sincronizada com a seção 7 do documento principal


