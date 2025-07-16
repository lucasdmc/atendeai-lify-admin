# 👥 Sistema de Usuários e Profiles - Configuração e Sincronização

## **📋 Status Atual**

### **✅ Problemas Identificados:**
1. **Perfis sem timezone/language:** 3 usuários sem configurações
2. **Tabela clinic_users não existe:** Relacionamento não implementado
3. **Perfis órfãos:** 3 perfis sem usuário Auth correspondente
4. **Estrutura incompleta:** Faltam algumas colunas na tabela `user_profiles`

### **✅ Usuários Existentes:**
- **Atendente Lify** (atende1@lify.com) - atendente - ✅ Com clínica
- **paulo** (paulo@lify.com) - admin_lify - ❌ Sem clínica (correto)
- **Lucas Admin Lify** (lucasdmc@lify.com) - admin_lify - ❌ Sem clínica (correto)

### **✅ Clínicas Disponíveis:**
- **ESADI** (f3166dcf-6844-4bc6-9ca3-8971ed97c919)
- **Lify** (1c297247-9eb2-40b0-a23c-b3177513264a)
- **Lify1** (00000000-0000-0000-0000-000000000001)
- **MESO** (9b09e415-f5cf-496f-a1f0-29925d09d4b9)

## **🔧 Scripts Disponíveis**

### **1. Estrutura da Tabela User Profiles**
```bash
# Execute no Supabase Dashboard SQL Editor
cat scripts/fix-users-profiles-system.sql
```

### **2. Verificação do Sistema**
```bash
node scripts/verify-users-profiles-system.js
```

## **🎯 Passos para Configuração**

### **Passo 1: Corrigir Estrutura da Tabela**
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `scripts/fix-users-profiles-system.sql`

### **Passo 2: Verificar Sincronização**
```bash
node scripts/verify-users-profiles-system.js
```

## **📊 Estrutura da Tabela User Profiles**

### **Colunas Principais:**
- `id` (UUID) - ID único do perfil
- `user_id` (UUID) - Referência ao usuário Auth
- `name` (TEXT) - Nome do usuário
- `email` (TEXT) - Email do usuário
- `role` (TEXT) - Função do usuário
- `status` (BOOLEAN) - Status ativo/inativo
- `clinic_id` (UUID) - Clínica associada (NULL para admin_lify/suporte_lify)

### **Colunas Adicionais:**
- `timezone` (TEXT) - Fuso horário (padrão: 'America/Sao_Paulo')
- `language` (TEXT) - Idioma (padrão: 'pt-BR')
- `avatar_url` (TEXT) - URL do avatar
- `phone` (TEXT) - Telefone do usuário
- `address` (JSONB) - Endereço do usuário
- `preferences` (JSONB) - Preferências do usuário
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de última atualização

## **🔐 Políticas de Segurança (RLS)**

### **Políticas Configuradas:**
- **SELECT próprio perfil:** Usuário pode ver seu próprio perfil
- **UPDATE próprio perfil:** Usuário pode editar seu próprio perfil
- **SELECT todos (admin):** Admin_lify/suporte_lify podem ver todos
- **UPDATE todos (admin):** Admin_lify/suporte_lify podem editar todos

## **📋 Módulo de Gestão de Usuários no Frontend**

### **Componentes Disponíveis:**
- `CreateUserModal.tsx` - Criar novo usuário
- `EditUserModal.tsx` - Editar usuário existente
- `DeleteUserModal.tsx` - Excluir usuário
- `UserTable.tsx` - Tabela de usuários
- `GestaoUsuarios.tsx` - Página principal de gestão

### **Funcionalidades:**
- ✅ Criar usuários com diferentes roles
- ✅ Editar informações do usuário
- ✅ Excluir usuários (com permissões)
- ✅ Buscar usuários por nome/email
- ✅ Associar usuários a clínicas
- ✅ Validação de dados
- ✅ Controle de status ativo/inativo

## **🔗 Relacionamentos**

### **Usuários → Clínicas:**
- **Admin Lify/Suporte Lify:** Acesso global, sem clínica específica
- **Admin/Gestor/Atendente:** Associados a uma clínica específica
- **Relacionamento:** Via `clinic_id` na tabela `user_profiles`

### **Usuários → Auth:**
- **Criação:** Via Edge Function `create-user-auth`
- **Autenticação:** Supabase Auth
- **Perfil:** Tabela `user_profiles` com dados estendidos

## **🚀 URLs de Produção**

- **Frontend/Admin:** http://localhost:8080 (página Gestão de Usuários)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
- **SQL Editor:** https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql

## **✅ Checklist de Configuração**

- [ ] Executar script de estrutura da tabela user_profiles
- [ ] Adicionar colunas timezone e language
- [ ] Configurar políticas RLS
- [ ] Verificar sincronização
- [ ] Testar módulo de Gestão de Usuários no frontend
- [ ] Validar criação/edição de usuários
- [ ] Testar associação usuários-clínicas

## **🎯 Próximos Passos**

1. **Execute o script SQL** no Supabase Dashboard
2. **Verifique a sincronização** com os scripts Node.js
3. **Teste o módulo de Gestão de Usuários** no frontend
4. **Crie usuários de teste** através da interface
5. **Valide as associações** usuários-clínicas

## **📞 Suporte**

Se houver problemas:
1. Verifique os logs do Supabase
2. Execute os scripts de verificação
3. Confirme as permissões do usuário
4. Verifique se o RLS está configurado corretamente

**Status:** 🔧 **Em Configuração** 