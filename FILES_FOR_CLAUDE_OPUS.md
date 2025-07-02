# 📁 Arquivos Selecionados para Claude Opus

## 🎯 Problemas Identificados e Corrigidos

### 1. **Loop Infinito no useMultiCalendar**
**Problema**: Erro "Maximum update depth exceeded" causando travamento da página de agendamentos

**Arquivos Principais**:
- `src/hooks/useMultiCalendar.tsx` - Hook principal com o loop infinito corrigido
- `src/pages/Agendamentos.tsx` - Componente que usa o hook
- `src/types/calendar.ts` - Tipos relacionados ao estado do calendário

**Arquivos Relacionados**:
- `src/components/agendamentos/CalendarSelector.tsx` - Seletor de calendários
- `src/components/calendar/CalendarView.tsx` - Visualização do calendário
- `src/hooks/useAgendamentosStats.tsx` - Hook de estatísticas
- `src/utils/calendarUtils.ts` - Utilitários do calendário

### 2. **Erro de Foreign Key na Desconexão de Calendários**
**Problema**: Erro 409 ao tentar deletar calendários devido a referências na tabela `calendar_sync_logs`

**Arquivos Principais**:
- `src/hooks/useGoogleUserAuth.tsx` - Hook com função disconnectCalendars corrigida
- `src/services/google/tokens.ts` - Serviço de gerenciamento de tokens
- `src/hooks/useGoogleConnectionManager.tsx` - Gerenciador de conexões

**Arquivos Relacionados**:
- `src/hooks/useGoogleCalendar.tsx` - Hook de integração com Google Calendar
- `src/services/google/calendar.ts` - Serviço de calendário
- `src/components/agendamentos/ConnectionStatusCard.tsx` - Status de conexão

### 3. **Problema de Autenticação Após Reset do Banco**
**Problema**: Usuário undefined e erros 400 após reset do banco de dados

**Arquivos Principais**:
- `src/hooks/useAuth.tsx` - Hook de autenticação
- `src/pages/Auth.tsx` - Página de autenticação
- `src/integrations/supabase/client.ts` - Cliente Supabase

**Scripts de Correção**:
- `scripts/restore-basic-auth.js` - Script para restaurar autenticação
- `scripts/create-user-profiles-table.sql` - SQL para criar tabela user_profiles
- `MANUAL_AUTH_FIX.md` - Instruções manuais de correção

## 🔧 Correções Implementadas

### Correção 1: Loop Infinito
```typescript
// ANTES (problemático)
const [state, setState] = useState<MultiCalendarState>({
  events: [],
  isLoading: false,
  error: null,
  selectedCalendars: [] // ❌ Causava loop
})

// DEPOIS (corrigido)
const [state, setState] = useState<{
  events: GoogleCalendarEvent[]
  isLoading: boolean
  error: string | null
}>({
  events: [],
  isLoading: false,
  error: null
}) // ✅ selectedCalendars removido do estado interno
```

### Correção 2: Foreign Key
```typescript
// ANTES (problemático)
const { error } = await supabase
  .from('user_calendars')
  .delete()
  .eq('user_id', user.id) // ❌ Erro 409 - foreign key constraint

// DEPOIS (corrigido)
// 1. Deletar logs primeiro
await supabase
  .from('calendar_sync_logs')
  .delete()
  .in('user_calendar_id', calendarIds)

// 2. Depois deletar calendários
await supabase
  .from('user_calendars')
  .delete()
  .eq('user_id', user.id) // ✅ Funciona corretamente
```

### Correção 3: Autenticação
```sql
-- Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Confirmar email e criar perfil
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'admin@teste.com';
INSERT INTO public.user_profiles (user_id, email, role) VALUES (...);
```

## 📊 Arquivos de Teste e Debug

### Scripts de Teste:
- `scripts/test-agendamentos-fix.js` - Teste do loop infinito
- `scripts/test-disconnect-fix.js` - Teste da desconexão
- `scripts/check-auth-status.js` - Verificação de autenticação
- `scripts/restore-basic-auth.js` - Restauração de autenticação

### Documentação:
- `AGENDAMENTOS_FIX_SUMMARY.md` - Resumo das correções
- `MANUAL_AUTH_FIX.md` - Instruções manuais
- `FILES_FOR_CLAUDE_OPUS.md` - Este arquivo

## 🎯 Estado Atual

### ✅ Corrigido:
- Loop infinito no useMultiCalendar
- Erro de foreign key na desconexão
- Estrutura de autenticação básica

### 🔄 Em Progresso:
- Restauração completa da autenticação (requer execução manual do SQL)

### 📋 Próximos Passos:
1. Executar SQL manual no Supabase Dashboard
2. Testar login com admin@teste.com / 123456789
3. Verificar navegação para /agendamentos
4. Testar funcionalidade de desconexão de calendários

## 🔍 Pontos de Atenção

### Para o Claude Opus:
1. **Foco nos hooks principais**: `useMultiCalendar.tsx` e `useGoogleUserAuth.tsx`
2. **Verificar padrões de estado**: Evitar dependências circulares
3. **Análise de foreign keys**: Sempre deletar em ordem correta
4. **Estrutura de autenticação**: Verificar integridade entre auth.users e user_profiles

### Para Desenvolvimento Futuro:
1. Implementar testes automatizados para evitar regressões
2. Adicionar validações de estado mais robustas
3. Melhorar tratamento de erros de foreign key
4. Documentar melhor as dependências entre tabelas 