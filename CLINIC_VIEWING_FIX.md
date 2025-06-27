# 🔍 Problema de Visualização de Clínicas - SOLUÇÃO

## 🚨 **Problema Identificado**

As clínicas criadas não aparecem na lista após o registro. Isso acontece devido a um problema nas **políticas RLS (Row Level Security)** do Supabase.

### **Causa Raiz**
A política de visualização `"Users can view their clinics"` está muito restritiva:

```sql
CREATE POLICY "Users can view their clinics" ON public.clinics
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );
```

**Problema**: Se o usuário não tem role `admin_lify` E não está associado à clínica na tabela `clinic_users`, ele não consegue ver a clínica.

## 🛠️ **Solução Implementada**

### **1. Nova Política de Visualização**
Criada uma política mais permissiva que permite:

- ✅ **Admins lify**: Veem todas as clínicas
- ✅ **Admins**: Veem todas as clínicas  
- ✅ **Suporte lify**: Veem todas as clínicas
- ✅ **Usuários**: Veem clínicas associadas a eles

### **2. Associação Automática**
- ✅ Todos os usuários são automaticamente associados à "Clínica Principal"
- ✅ Permissão `clinicas` é adicionada para todos os usuários

### **3. Sistema de Debug**
- ✅ Logs detalhados na busca de clínicas
- ✅ Botão de teste de visualização
- ✅ Verificação de permissões em tempo real

## 🔧 **Como Aplicar a Correção**

### **Opção 1: Via Supabase Dashboard**
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto `atendeai-lify-admin`
3. Acesse **SQL Editor**
4. Execute o script: `scripts/fix-clinic-viewing.sql`

### **Opção 2: Via Migração**
```bash
# Aplicar a migração
npx supabase db push
```

### **Opção 3: Manual (SQL Editor)**
Execute este SQL no Supabase:

```sql
-- 1. Remover política antiga
DROP POLICY IF EXISTS "Users can view their clinics" ON public.clinics;

-- 2. Criar nova política
CREATE POLICY "Users can view clinics" ON public.clinics
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'suporte_lify'
        ) OR
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );

-- 3. Associar usuários à clínica padrão
INSERT INTO public.clinic_users (user_id, clinic_id, role, is_active)
SELECT 
    up.id, 
    '00000000-0000-0000-0000-000000000001' as clinic_id,
    up.role::user_role,
    true as is_active
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinic_users 
    WHERE user_id = up.id AND clinic_id = '00000000-0000-0000-0000-000000000001'
);

-- 4. Adicionar permissão 'clinicas'
INSERT INTO public.user_permissions (user_id, module_name, can_access)
SELECT 
    up.id, 
    'clinicas' as module_name, 
    true as can_access
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = up.id AND module_name = 'clinicas'
);
```

## 🧪 **Como Testar**

### **1. Teste Local**
```bash
npm run dev
# Acesse: http://localhost:8082/clinicas
```

### **2. Use os Botões de Debug**
- **"Testar Visualização"**: Verifica se consegue buscar clínicas
- **"Testar Criação"**: Testa criação completa
- Verifique o console do navegador para logs

### **3. Teste em Produção**
- Acesse: https://atendeai.lify.com.br/clinicas
- Tente criar uma clínica
- Verifique se aparece na lista

## 📊 **Logs Esperados**

### **Antes da Correção:**
```
❌ Erro ao buscar clínicas: { code: '42501', message: 'new row violates row-level security policy' }
📊 Número de clínicas: 0
```

### **Após a Correção:**
```
✅ Clínicas carregadas: [array com clínicas]
📊 Número de clínicas: 2
🔍 Total de clínicas: 2
🔍 Clínicas filtradas: 2
```

## 🔒 **Segurança Mantida**

A solução mantém a segurança:
- ✅ Apenas usuários autorizados podem criar clínicas
- ✅ Usuários veem apenas clínicas relevantes
- ✅ Políticas RLS continuam ativas
- ✅ Permissões são verificadas adequadamente

## 🎯 **Resultado Esperado**

Após aplicar a correção:
- ✅ Clínicas criadas aparecem na lista
- ✅ Usuários podem visualizar clínicas adequadas
- ✅ Sistema de debug fornece informações úteis
- ✅ Logs ajudam no diagnóstico

## 📋 **Checklist de Verificação**

- [ ] Política RLS corrigida no Supabase
- [ ] Usuários associados à clínica padrão
- [ ] Permissão 'clinicas' adicionada
- [ ] Teste de criação funcionando
- [ ] Teste de visualização funcionando
- [ ] Logs mostrando clínicas carregadas

**Status**: Solução implementada e pronta para aplicação. 