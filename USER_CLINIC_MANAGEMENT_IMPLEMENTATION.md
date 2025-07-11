# 🏥 Gestão de Usuários e Clínicas - IMPLEMENTAÇÃO COMPLETA

## 📋 **Resumo da Funcionalidade**

Implementação do sistema de associação de usuários a clínicas, onde:
- **Administradores Lify** e **Suporte Lify**: Usuários mestres com acesso global a todas as clínicas
- **Demais usuários**: Associados a uma clínica específica, sem acesso ao seletor global
- **Gestão de Usuários**: Interface atualizada para selecionar clínica na criação/edição

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
Execute o script `scripts/setup-user-clinic-association-final.sql` no Supabase Dashboard:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para o projeto `atendeai-lify-admin`
3. Acesse **SQL Editor**
4. Execute o script completo

### **Passo 2: Deploy da Edge Function**
```bash
# Deploy da função atualizada
npx supabase functions deploy create-user-auth
```

### **Passo 3: Verificar Implementação**
Execute o script de teste:
```bash
SUPABASE_SERVICE_ROLE_KEY=<sua_chave> node scripts/test-user-clinic-management.js
```

### **Passo 4: Testar no Frontend**
1. Faça login como `admin_lify` ou `suporte_lify`
2. Vá para **Gestão de Usuários**
3. Teste a criação de usuários com diferentes roles
4. Verifique se a seleção de clínica aparece corretamente

## 🎯 **Regras de Negócio**

### **Usuários Mestres (Sem Clínica Específica)**
- **Admin Lify**: Acesso total a todas as clínicas
- **Suporte Lify**: Acesso total exceto criação de clínicas
- **Comportamento**: Não precisam estar associados a uma clínica específica
- **Interface**: Veem seletor de clínicas no menu superior

### **Usuários Normais (Com Clínica Específica)**
- **Admin**: Acesso completo a uma clínica específica
- **Gestor**: Acesso intermediário a uma clínica específica
- **Atendente**: Acesso básico a uma clínica específica
- **Comportamento**: Devem estar associados a uma clínica específica
- **Interface**: Não veem seletor de clínicas

## 🖥️ **Interface de Gestão de Usuários**

### **Criação de Usuário**
- **Campo Clínica**: Aparece apenas para roles que precisam de associação
- **Validação**: Obrigatório para usuários normais
- **Informação**: Mostra aviso para usuários mestres

### **Edição de Usuário**
- **Campo Clínica**: Aparece apenas para roles que precisam de associação
- **Atualização**: Sincroniza com tabela `clinic_users`
- **Limpeza**: Remove associações quando usuário vira mestre

## 🔍 **Funcionalidades Implementadas**

### **1. Backend (SQL)**
- ✅ Tabela `clinic_users` criada
- ✅ Coluna `clinic_id` adicionada em `user_profiles`
- ✅ Políticas RLS configuradas
- ✅ Funções auxiliares criadas
- ✅ Associações automáticas configuradas

### **2. Edge Function**
- ✅ Parâmetro `clinicId` adicionado
- ✅ Validação de clínica obrigatória
- ✅ Criação de associação em `clinic_users`
- ✅ Rollback em caso de erro

### **3. Frontend**
- ✅ Modal de criação atualizado
- ✅ Modal de edição atualizado
- ✅ Seleção condicional de clínica
- ✅ Validações de interface
- ✅ Informações contextuais

### **4. Testes**
- ✅ Script de teste completo
- ✅ Verificação de estrutura
- ✅ Teste de criação via Edge Function
- ✅ Verificação de associações

## 🚀 **Como Testar**

### **1. Teste de Criação de Usuário Mestre**
1. Acesse **Gestão de Usuários**
2. Clique em **Novo Usuário**
3. Selecione role **Admin Lify** ou **Suporte Lify**
4. Verifique que o campo clínica não aparece
5. Verifique a mensagem informativa
6. Crie o usuário

### **2. Teste de Criação de Usuário Normal**
1. Acesse **Gestão de Usuários**
2. Clique em **Novo Usuário**
3. Selecione role **Atendente**, **Gestor** ou **Admin**
4. Verifique que o campo clínica aparece
5. Selecione uma clínica
6. Crie o usuário

### **3. Teste de Edição**
1. Edite um usuário existente
2. Mude o role de normal para mestre
3. Verifique que o campo clínica desaparece
4. Mude o role de mestre para normal
5. Verifique que o campo clínica aparece

### **4. Teste de Seletor de Clínicas**
1. Faça login como Admin Lify ou Suporte Lify
2. Verifique se o seletor aparece no menu superior
3. Teste a mudança de clínica
4. Faça login como usuário normal
5. Verifique que o seletor não aparece

## 🔧 **Solução de Problemas**

### **Erro: "Clínica é obrigatória"**
- **Causa**: Usuário normal criado sem clínica
- **Solução**: Selecionar uma clínica no formulário

### **Erro: "Foreign key violation"**
- **Causa**: Clínica não existe ou foi deletada
- **Solução**: Verificar se a clínica existe na tabela `clinics`

### **Erro: "Permission denied"**
- **Causa**: Políticas RLS muito restritivas
- **Solução**: Verificar se as políticas estão corretas

### **Campo clínica não aparece**
- **Causa**: Role selecionado é de usuário mestre
- **Solução**: Selecionar um role que precisa de clínica

## 📊 **Verificação Final**

Execute o script de teste para verificar se tudo está funcionando:

```bash
# Configurar variável de ambiente
export SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui

# Executar teste
node scripts/test-user-clinic-management.js
```

### **Resultados Esperados**
- ✅ Todas as tabelas existem
- ✅ Usuários associados corretamente
- ✅ Edge Function funciona
- ✅ Interface atualizada
- ✅ Políticas RLS funcionando

## 🎉 **Conclusão**

O sistema está completamente implementado e pronto para uso. A gestão de usuários agora permite:

1. **Criar usuários mestres** sem associação a clínica específica
2. **Criar usuários normais** com associação obrigatória a clínica
3. **Editar usuários** com mudança dinâmica de associações
4. **Controlar acesso** baseado em role e clínica
5. **Manter consistência** entre todas as tabelas

O sistema está preparado para escalar com múltiplas clínicas e usuários, mantendo a segurança e organização dos dados. 