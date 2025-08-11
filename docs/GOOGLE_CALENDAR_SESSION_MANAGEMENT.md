# Sistema de Gerenciamento de Sessões OAuth - Google Calendar

## Visão Geral

Este sistema implementa um gerenciamento robusto e automático de sessões OAuth para integração com o Google Calendar, garantindo que os usuários mantenham acesso contínuo sem necessidade de reautenticação frequente.

## Características Principais

### ✅ **Renovação Automática de Tokens**
- Tokens são renovados automaticamente antes da expiração
- Buffer de 10 minutos para renovação proativa
- Tratamento inteligente de erros de renovação

### ✅ **Monitoramento em Tempo Real**
- Verificação contínua do status da sessão
- Notificações automáticas sobre expiração
- Indicadores visuais de status

### ✅ **Persistência de Sessão**
- Tokens armazenados de forma segura no Supabase
- Sessão mantida entre diferentes abas/navegadores
- Reconexão automática ao fazer login

### ✅ **Serviço de Background**
- Verificação automática a cada 10 minutos
- Renovação proativa de tokens
- Gerenciamento inteligente de recursos

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
├─────────────────────────────────────────────────────────────┤
│  useGoogleCalendar (Hook Principal)                        │
│  ├── useGoogleConnectionManager                            │
│  ├── useGoogleSessionMonitor                               │
│  └── useGoogleCalendarEvents                               │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  GoogleTokenManager                                        │
│  ├── validateAndGetToken()                                 │
│  ├── refreshTokens()                                       │
│  ├── getSessionStatus()                                    │
│  └── BackgroundTokenService                                │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Supabase Database                                         │
│  └── google_calendar_tokens table                          │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. **GoogleTokenManager** (`src/services/google/tokens.ts`)
Gerenciador central de tokens OAuth com funcionalidades de:
- Validação automática de tokens
- Renovação proativa
- Cache inteligente
- Tratamento de erros

### 2. **useGoogleSessionMonitor** (`src/hooks/useGoogleSessionMonitor.tsx`)
Hook React para monitoramento contínuo da sessão:
- Verificação periódica do status
- Notificações automáticas
- Controle de intervalos de verificação

### 3. **BackgroundTokenService** (`src/services/google/backgroundTokenService.ts`)
Serviço de background para:
- Renovação automática de tokens
- Verificação periódica de validade
- Gerenciamento de recursos

### 4. **GoogleSessionStatus** (`src/components/whatsapp/GoogleSessionStatus.tsx`)
Componente visual para exibir:
- Status atual da sessão
- Tempo até expiração
- Ações de reconexão
- Indicadores visuais

## Como Usar

### 1. **Hook Principal**
```typescript
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const MyComponent = () => {
  const {
    isConnected,
    sessionStatus,
    connectToGoogle,
    forceSessionCheck
  } = useGoogleCalendar();

  // sessionStatus contém:
  // - isConnected: boolean
  // - isValid: boolean
  // - expiresAt: string
  // - needsReauth: boolean
  // - lastChecked: Date
  // - timeUntilExpiry: number
};
```

### 2. **Monitoramento de Sessão**
```typescript
import { useGoogleSessionMonitor } from '@/hooks/useGoogleSessionMonitor';

const SessionMonitor = () => {
  const { sessionStatus, forceCheck } = useGoogleSessionMonitor(5 * 60 * 1000);
  
  // Verificação a cada 5 minutos
  // Monitoramento automático quando conectado
};
```

### 3. **Componente de Status**
```typescript
import { GoogleSessionStatus } from '@/components/whatsapp/GoogleSessionStatus';

<GoogleSessionStatus
  sessionStatus={sessionStatus}
  onReconnect={connectToGoogle}
  onRefresh={forceSessionCheck}
/>
```

## Fluxo de Funcionamento

### 1. **Autenticação Inicial**
```
Usuário clica "Conectar" → Redirecionamento OAuth → 
Callback com código → Troca por tokens → 
Salvamento no banco → Início do monitoramento
```

### 2. **Renovação Automática**
```
Token expira em < 10 min → Renovação proativa → 
Novo token salvo → Sessão mantida ativa
```

### 3. **Monitoramento Contínuo**
```
Verificação a cada 5 min → Validação de status → 
Notificações se necessário → Ações automáticas
```

## Configurações

### **Intervalos de Verificação**
```typescript
// src/config/session-config.ts
VALIDATION_CACHE_DURATION: 5 * 60 * 1000,    // 5 min
PERIODIC_CHECK_INTERVAL: 5 * 60 * 1000,      // 5 min
BACKGROUND_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 min
```

### **Buffers de Renovação**
```typescript
PROACTIVE_REFRESH_BUFFER: 10 * 60 * 1000,    // 10 min
BACKGROUND_REFRESH_THRESHOLD: 15 * 60 * 1000, // 15 min
```

## Tratamento de Erros

### **Cenários de Erro**
1. **Token Expirado**: Tentativa de renovação automática
2. **Refresh Token Inválido**: Limpeza automática e solicitação de reautenticação
3. **Falha de Rede**: Retry automático com delay exponencial
4. **Erro de API**: Notificação ao usuário e log detalhado

### **Estratégias de Recuperação**
- Renovação automática com retry
- Fallback para tokens existentes se válidos
- Notificações inteligentes baseadas no contexto
- Limpeza automática de tokens inválidos

## Segurança

### **Armazenamento Seguro**
- Tokens armazenados no Supabase (criptografados)
- Client secret nunca exposto no frontend
- Validação de usuário antes de operações

### **Controle de Acesso**
- Verificação de autenticação em todas as operações
- Isolamento de dados por usuário
- Logs de auditoria para operações sensíveis

## Performance

### **Otimizações**
- Cache de validação para evitar verificações excessivas
- Verificação proativa para evitar expiração durante uso
- Serviço de background para operações não críticas
- Debounce em operações de UI

### **Monitoramento**
- Métricas de performance
- Logs detalhados em desenvolvimento
- Alertas automáticos para problemas

## Troubleshooting

### **Problemas Comuns**

1. **Sessão não persiste**
   - Verificar se tokens estão sendo salvos no banco
   - Confirmar se usuário está autenticado

2. **Renovação automática falha**
   - Verificar logs do BackgroundTokenService
   - Confirmar se refresh token é válido

3. **Notificações não aparecem**
   - Verificar permissões de notificação do navegador
   - Confirmar se toast está configurado

### **Logs de Debug**
```typescript
// Ativar logs detalhados
ENABLE_DEBUG_LOGGING: true,
LOG_TOKEN_REFRESH_ATTEMPTS: true,
LOG_SESSION_VALIDATION: true,
```

## Próximos Passos

### **Melhorias Futuras**
- [ ] Cache mais sofisticado com Redis
- [ ] Métricas avançadas de performance
- [ ] Integração com sistema de alertas
- [ ] Suporte a múltiplas contas Google
- [ ] Sincronização entre dispositivos

### **Monitoramento**
- [ ] Dashboard de status das sessões
- [ ] Alertas proativos para problemas
- [ ] Relatórios de uso e performance
- [ ] Integração com ferramentas de observabilidade

## Conclusão

Este sistema fornece uma solução robusta e automática para gerenciamento de sessões OAuth, garantindo uma experiência de usuário fluida e segura. A arquitetura modular permite fácil manutenção e extensão, enquanto as funcionalidades automáticas reduzem significativamente a necessidade de intervenção manual.
