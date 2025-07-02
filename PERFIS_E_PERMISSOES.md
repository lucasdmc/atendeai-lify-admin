# Perfis e Permissões - Sistema Lify AtendeAÍ

## Visão Geral

O sistema implementa uma hierarquia de 5 perfis de usuário com diferentes níveis de acesso aos módulos e clínicas.

## Perfis Disponíveis

### 1. **Atendente**
- **Escopo**: Clínica específica
- **Módulos de Acesso**:
  - Conectar QR Code
  - Agendamentos
  - Conversas
  - Dashboard
- **Descrição**: Acesso básico para atendimento ao cliente

### 2. **Gestor**
- **Escopo**: Clínica específica
- **Módulos de Acesso**:
  - Conectar QR Code
  - Agendamentos
  - Conversas
  - Dashboard
  - Agentes de IA
  - Contextualização
- **Descrição**: Acesso intermediário com gestão de agentes e contextualização

### 3. **Administrador**
- **Escopo**: Clínica específica
- **Módulos de Acesso**:
  - Conectar QR Code
  - Agendamentos
  - Conversas
  - Dashboard
  - Agentes de IA
  - Contextualização
  - Gestão de Usuários
  - Configurações
- **Descrição**: Acesso completo à clínica (exceto módulo Clínicas)

### 4. **Suporte Lify**
- **Escopo**: Todas as clínicas
- **Módulos de Acesso**:
  - Conectar QR Code
  - Agendamentos
  - Conversas
  - Dashboard
  - Agentes de IA
  - Contextualização
  - Gestão de Usuários
  - Configurações
- **Descrição**: Acesso total exceto módulo Clínicas

### 5. **Administrador Lify**
- **Escopo**: Todas as clínicas
- **Módulos de Acesso**:
  - Conectar QR Code
  - Agendamentos
  - Conversas
  - Dashboard
  - Agentes de IA
  - Contextualização
  - Gestão de Usuários
  - Clínicas
  - Configurações
- **Descrição**: Acesso total a todos os módulos

## Implementação Técnica

### Arquivos Principais

1. **`src/components/users/UserRoleUtils.ts`**
   - Define as permissões por perfil
   - Funções utilitárias para verificação de acesso
   - Cores e labels dos perfis

2. **`src/hooks/useAuth.tsx`**
   - Gerencia autenticação e permissões do usuário
   - Carrega permissões baseadas no role do usuário

3. **`src/components/Sidebar.tsx`**
   - Filtra itens do menu baseado nas permissões
   - Usa `hasPermission()` para verificar acesso

### Funções Utilitárias

```typescript
// Verificar se usuário tem acesso a um módulo
hasPermission(userRole, 'dashboard')

// Verificar se usuário tem acesso global às clínicas
hasGlobalClinicAccess(userRole)

// Verificar se usuário pode gerenciar clínicas
canManageClinics(userRole)

// Obter escopo de acesso às clínicas
getClinicAccessScope(userRole)
```

## Configuração no Banco de Dados

### Tabelas Envolvidas

1. **`user_profiles`**
   - Armazena o perfil (role) de cada usuário
   - Campo `role` define o perfil

2. **`role_permissions`**
   - Define as permissões por perfil
   - Campos: `role`, `module_name`, `can_access`, etc.

3. **`clinic_users`**
   - Associa usuários a clínicas específicas
   - Usado para perfis com escopo de clínica específica

### Scripts de Configuração

1. **`scripts/setup-role-permissions.sql`**
   - Configura todas as permissões por perfil
   - Deve ser executado no SQL Editor do Supabase

2. **`scripts/setup-current-user-admin-lify.sql`**
   - Configura usuário atual como admin_lify
   - Útil para setup inicial

## Como Usar

### 1. Configurar Permissões no Banco
```sql
-- Execute no SQL Editor do Supabase
\i scripts/setup-role-permissions.sql
```

### 2. Configurar Usuário Admin
```sql
-- Execute no SQL Editor do Supabase
\i scripts/setup-current-user-admin-lify.sql
```

### 3. Verificar Configuração
```bash
# Verificar perfil do usuário atual
node scripts/list-user-profiles.js
```

## Controle de Acesso por Clínica

### Perfis com Acesso Global
- **admin_lify**: Acesso a todas as clínicas
- **suporte_lify**: Acesso a todas as clínicas

### Perfis com Acesso Específico
- **admin**: Acesso apenas à clínica associada
- **gestor**: Acesso apenas à clínica associada
- **atendente**: Acesso apenas à clínica associada

### Associação Usuário-Clínica
A tabela `clinic_users` controla qual usuário tem acesso a qual clínica:

```sql
INSERT INTO clinic_users (user_id, clinic_id, role, is_active)
VALUES ('user-uuid', 'clinic-uuid', 'admin', true);
```

## Segurança

### Row Level Security (RLS)
- Todas as tabelas principais têm RLS habilitado
- Policies baseadas no role do usuário
- Verificação de associação usuário-clínica

### Validação Frontend
- Sidebar filtra itens baseado nas permissões
- Componentes verificam permissões antes de renderizar
- Redirecionamento automático para páginas permitidas

## Próximos Passos

1. **Implementar controle de acesso por clínica** nos componentes
2. **Criar interface para gerenciar associações usuário-clínica**
3. **Adicionar validações de permissão** em todas as páginas
4. **Implementar auditoria** de ações por perfil 