# 🏥 Associação de Usuários a Clínicas - IMPLEMENTAÇÃO

## 📋 **Resumo da Funcionalidade**

Implementação do sistema de associação de usuários a clínicas, onde:
- **Administradores Lify** e **Suporte Lify**: Acesso a todas as clínicas via seletor no menu superior
- **Demais usuários**: Associados a uma clínica específica, sem acesso ao seletor

## 🗄️ **Estrutura do Banco de Dados**

### **1. Tabela `clinic_users` (Nova)**
```sql
CREATE TABLE public.clinic_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);
```

### **2. Tabela `user_profiles` (Atualizada)**
- Adicionada coluna `clinic_id` para referência direta
- Usuários `admin_lify` e `suporte_lify` podem ter `clinic_id` NULL

### **3. Políticas RLS Atualizadas**
- **Visualização de clínicas**: Baseada em `clinic_users` e role do usuário
- **Acesso global**: Apenas para `admin_lify` e `suporte_lify`

## 🔧 **Como Implementar**

### **Passo 1: Executar Script SQL**
Execute o script `scripts/setup-user-clinic-association.sql` no Supabase Dashboard:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto `atendeai-lify-admin`
3. Acesse **SQL Editor**
4. Execute o script completo

### **Passo 2: Verificar Implementação**
Execute o script de teste:
```bash
SUPABASE_SERVICE_ROLE_KEY=<sua_chave> node scripts/test-user-clinic-association.js
```

### **Passo 3: Testar no Frontend**
1. Faça login como `admin_lify` ou `suporte_lify`
2. Verifique se o seletor de clínicas aparece no menu superior direito
3. Teste a mudança de clínica
4. Faça login como usuário normal e verifique que não há seletor

## 🎯 **Comportamento Esperado**

### **Para Administradores Lify e Suporte Lify:**
- ✅ **Seletor de clínicas** visível no menu superior direito
- ✅ **Acesso a todas as clínicas** do sistema
- ✅ **Mudança de contexto** ao selecionar clínica diferente
- ✅ **Feedback visual** ao alterar clínica

### **Para Demais Usuários:**
- ❌ **Sem seletor** de clínicas
- ✅ **Acesso apenas à clínica associada**
- ✅ **Contexto fixo** baseado na associação

## 📊 **Dados de Exemplo**

### **Usuários Existentes Serão Associados:**
- **admin_lify**: Sem clínica específica (acesso global)
- **suporte_lify**: Sem clínica específica (acesso global)
- **admin**: Associado à "Clínica Principal"
- **gestor**: Associado à "Clínica Principal"
- **atendente**: Associado à "Clínica Principal"

### **Clínica Padrão Criada:**
- **ID**: `00000000-0000-0000-0000-000000000001`
- **Nome**: "Clínica Principal"
- **Email**: `contato@clinicaprincipal.com`

## 🔒 **Segurança**

### **Políticas RLS Implementadas:**
1. **`clinic_users`**: Usuários veem apenas suas associações
2. **`clinics`**: Visualização baseada em associações e role
3. **Funções auxiliares**: `is_admin_lify()` e `has_global_clinic_access()`

### **Validações Frontend:**
1. **Seletor visível** apenas para perfis com acesso global
2. **Contexto de clínica** mantido durante a sessão
3. **Feedback visual** para mudanças de contexto

## 🧪 **Testes Recomendados**

### **1. Teste de Permissões:**
```bash
# Testar como admin_lify
# Verificar seletor visível e funcional

# Testar como usuário normal
# Verificar seletor não visível
```

### **2. Teste de Associações:**
```bash
# Executar script de teste
node scripts/test-user-clinic-association.js
```

### **3. Teste de Funcionalidade:**
- Criar nova clínica
- Associar usuário à nova clínica
- Verificar acesso restrito

## 🚀 **Próximos Passos**

### **1. Interface de Gerenciamento:**
- Criar página para gerenciar associações usuário-clínica
- Permitir que admins associem usuários a clínicas

### **2. Filtros por Clínica:**
- Implementar filtros em todas as páginas baseados na clínica selecionada
- Garantir que dados sejam filtrados corretamente

### **3. Auditoria:**
- Log de mudanças de contexto de clínica
- Histórico de associações usuário-clínica

## 📝 **Arquivos Modificados**

### **Backend:**
- `scripts/setup-user-clinic-association.sql` (NOVO)
- Políticas RLS da tabela `clinics`
- Funções auxiliares no banco

### **Frontend:**
- `src/components/ClinicSelector.tsx` (ATUALIZADO)
- `src/components/Header.tsx` (ATUALIZADO)
- `src/contexts/ClinicContext.tsx` (EXISTENTE)

### **Testes:**
- `scripts/test-user-clinic-association.js` (NOVO)

## ⚠️ **Observações Importantes**

1. **Usuários existentes** serão automaticamente associados à "Clínica Principal"
2. **Admin Lify e Suporte Lify** mantêm acesso global sem associação específica
3. **Políticas RLS** garantem segurança no nível do banco
4. **Contexto de clínica** é mantido durante a sessão do usuário

## 🆘 **Solução de Problemas**

### **Seletor não aparece:**
- Verificar se o usuário tem role `admin_lify` ou `suporte_lify`
- Verificar se a tabela `clinic_users` foi criada
- Verificar políticas RLS da tabela `clinics`

### **Erro de permissão:**
- Verificar se as funções `is_admin_lify()` e `has_global_clinic_access()` foram criadas
- Verificar se as políticas RLS estão corretas

### **Usuário sem acesso:**
- Verificar se o usuário está associado a uma clínica na tabela `clinic_users`
- Verificar se a associação está ativa (`is_active = true`) 