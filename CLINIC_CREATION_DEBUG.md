# 🔍 Diagnóstico - Criação de Clínicas

## 🚨 **Problema Identificado**

A criação de clínicas não está funcionando em produção. Baseado na análise do código, identifiquei possíveis causas:

### **1. Problemas de Permissões (RLS)**
- ✅ Políticas RLS configuradas corretamente
- ✅ Função `is_admin_lify()` implementada
- ✅ Permissão `criar_clinicas` definida para role `admin_lify`

### **2. Possíveis Causas**

#### **A. Usuário sem Permissão Adequada**
- O usuário atual pode não ter role `admin_lify`
- Permissão `criar_clinicas` pode não estar atribuída
- Política RLS pode estar bloqueando a inserção

#### **B. Problemas de Migração**
- Migrações podem não ter sido aplicadas em produção
- Funções SQL podem não existir no banco de produção

#### **C. Problemas de Autenticação**
- Token de autenticação pode estar expirado
- Contexto de autenticação pode não estar sendo passado corretamente

## 🛠️ **Soluções Implementadas**

### **1. Sistema de Debug**
- ✅ Componente de debug no modal de criação
- ✅ Logs detalhados no console
- ✅ Verificação de permissões em tempo real
- ✅ Botão de teste para diagnóstico

### **2. Melhorias no Código**
- ✅ Validação de permissões antes da criação
- ✅ Tratamento específico de erros
- ✅ Mensagens de erro mais informativas
- ✅ Verificação de role do usuário

### **3. Utilitário de Teste**
- ✅ Função `testClinicCreation()` para diagnóstico completo
- ✅ Função `checkUserPermissions()` para verificar permissões
- ✅ Teste automático de inserção e limpeza

## 🔧 **Como Usar o Sistema de Debug**

### **1. Acesse a Página de Clínicas**
```
http://localhost:5173/clinicas
```

### **2. Verifique as Informações de Debug**
- Role do usuário atual
- Permissões disponíveis
- Status da permissão `criar_clinicas`

### **3. Execute o Teste de Criação**
- Clique no botão "Testar Criação" (apenas em desenvolvimento)
- Verifique o console do navegador para logs detalhados
- Analise os resultados do teste

### **4. Tente Criar uma Clínica**
- Preencha o formulário
- Verifique os logs no console
- Identifique onde o processo falha

## 📋 **Checklist de Verificação**

### **Para o Usuário Atual:**
- [ ] Role é `admin_lify`?
- [ ] Permissão `criar_clinicas` está presente?
- [ ] Usuário está autenticado corretamente?

### **Para o Banco de Dados:**
- [ ] Tabela `clinics` existe?
- [ ] Políticas RLS estão ativas?
- [ ] Função `is_admin_lify()` existe?
- [ ] Migrações foram aplicadas?

### **Para as Políticas RLS:**
- [ ] Política "Admins can create clinics" está ativa?
- [ ] Política verifica `is_admin_lify(auth.uid())`?
- [ ] Política permite inserção para admins?

## 🎯 **Próximos Passos**

### **1. Teste Local**
```bash
npm run dev
# Acesse http://localhost:5173/clinicas
# Execute o teste de criação
# Verifique os logs no console
```

### **2. Verificação em Produção**
- Acesse https://atendeai.lify.com.br/clinicas
- Abra o console do navegador
- Tente criar uma clínica
- Verifique os erros no console

### **3. Correção Baseada nos Resultados**
- Se for problema de permissão: Atualizar role do usuário
- Se for problema de RLS: Verificar políticas no Supabase
- Se for problema de migração: Aplicar migrações pendentes

## 📊 **Logs Esperados**

### **Sucesso:**
```
🔍 Debug - Criando clínica:
👤 User ID: [user-id]
👑 User Role: admin_lify
🔐 User Permissions: [dashboard, conversas, ..., criar_clinicas]
✅ Permissão verificada, inserindo clínica...
✅ Clínica criada com sucesso: [data]
```

### **Erro de Permissão:**
```
❌ Usuário não tem permissão para criar clínicas
❌ Erro do Supabase: { code: '42501', message: 'new row violates row-level security policy' }
```

### **Erro de Banco:**
```
❌ Erro ao criar clínica: { code: '42P01', message: 'relation "clinics" does not exist' }
```

## 🔒 **Configuração de Segurança**

### **Políticas RLS Ativas:**
```sql
-- Política para criação (apenas admin_lify)
CREATE POLICY "Admins can create clinics" ON public.clinics
    FOR INSERT WITH CHECK (
        public.is_admin_lify(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### **Função de Verificação:**
```sql
CREATE OR REPLACE FUNCTION public.is_admin_lify(user_id uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = $1 AND role = 'admin_lify'
    );
$$;
```

## 🎯 **Resultado Esperado**

Após a implementação das correções:
- ✅ Usuários com role `admin_lify` podem criar clínicas
- ✅ Sistema de debug fornece informações claras
- ✅ Tratamento de erros é informativo
- ✅ Logs ajudam no diagnóstico de problemas

**Status**: Sistema de diagnóstico implementado e pronto para uso. 