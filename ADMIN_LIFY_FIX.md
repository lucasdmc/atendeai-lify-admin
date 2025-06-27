# 🔧 Correção Completa do Admin Lify

Este documento contém todas as correções necessárias para resolver os problemas de permissões do Admin Lify.

## 🎯 Problemas Identificados

1. **Botão "Criar Nova Clínica" desabilitado**
2. **Botão de deletar clínicas desabilitado**
3. **Permissões `criar_clinicas` e `deletar_clinicas` não configuradas**
4. **Hook useAuth não inclui permissões específicas para admin_lify**
5. **Políticas RLS podem estar incompletas**

## ✅ Correções Aplicadas

### 1. Hook useAuth Corrigido
- ✅ Adicionadas permissões `criar_clinicas` e `deletar_clinicas` para admin_lify
- ✅ Lista completa de permissões para admin_lify

### 2. Migração Criada
- ✅ `supabase/migrations/20250627000000-fix-admin-lify-permissions.sql`
- ✅ Configura todas as permissões necessárias
- ✅ Cria políticas RLS completas
- ✅ Atualiza funções e triggers

### 3. Scripts de Verificação
- ✅ `scripts/fix-admin-lify-permissions.sql` - Script manual
- ✅ `scripts/verify-admin-lify-setup.js` - Verificação automática

## 🚀 Como Aplicar as Correções

### Opção 1: Via Migração (Recomendado)

1. **Aplicar a migração no Supabase:**
   ```bash
   # No Supabase Dashboard > SQL Editor
   # Execute o conteúdo de: supabase/migrations/20250627000000-fix-admin-lify-permissions.sql
   ```

2. **Verificar se funcionou:**
   ```bash
   node scripts/verify-admin-lify-setup.js
   ```

### Opção 2: Via Script Manual

1. **Executar script manual:**
   ```bash
   # No Supabase Dashboard > SQL Editor
   # Execute o conteúdo de: scripts/fix-admin-lify-permissions.sql
   ```

2. **Verificar resultados:**
   ```bash
   node scripts/verify-admin-lify-setup.js
   ```

## 📋 O que o Script Faz

### 1. Configuração do Usuário
- ✅ Define `lucasdmc@lify.com` como `admin_lify`
- ✅ Garante que o usuário tenha todas as permissões

### 2. Permissões do Role
- ✅ Adiciona todas as permissões para `admin_lify`
- ✅ Inclui `criar_clinicas` e `deletar_clinicas`
- ✅ Configura permissões granulares (access, create, read, update, delete)

### 3. Políticas RLS
- ✅ **SELECT**: Visualização de clínicas
- ✅ **INSERT**: Criação de clínicas
- ✅ **UPDATE**: Atualização de clínicas
- ✅ **DELETE**: Exclusão de clínicas

### 4. Funções e Triggers
- ✅ Atualiza `handle_new_user()` para novos usuários
- ✅ Cria `update_user_permissions_on_role_change()`
- ✅ Trigger automático para mudanças de role

### 5. Configurações de Clínica
- ✅ Garante acesso à clínica padrão
- ✅ Cria clínica padrão se não existir

## 🧪 Como Testar

### 1. Teste Local
```bash
npm run dev
# Acesse: http://localhost:8082/clinicas
```

### 2. Verificar Debug Info
- Abra o console do navegador
- Vá para a página de Clínicas
- Verifique as informações de debug

### 3. Testar Funcionalidades
- ✅ Botão "Nova Clínica" deve estar habilitado
- ✅ Botão de deletar deve estar habilitado (exceto para Admin Lify)
- ✅ Criação de clínicas deve funcionar
- ✅ Deleção de clínicas deve funcionar

## 🔍 Verificação Automática

Execute o script de verificação:
```bash
node scripts/verify-admin-lify-setup.js
```

**Resultado esperado:**
```
🎉 CONFIGURAÇÃO CORRETA! O Admin Lify está funcionando perfeitamente.
```

## 📊 Permissões Configuradas

Para o role `admin_lify`:
- ✅ `dashboard` - Acesso ao dashboard
- ✅ `conversas` - Gestão de conversas
- ✅ `conectar_whatsapp` - Conexão WhatsApp
- ✅ `agentes` - Gestão de agentes
- ✅ `agendamentos` - Gestão de agendamentos
- ✅ `clinicas` - Visualização de clínicas
- ✅ `criar_clinicas` - Criação de clínicas
- ✅ `deletar_clinicas` - Exclusão de clínicas
- ✅ `contextualizar` - Contextualização
- ✅ `gestao_usuarios` - Gestão de usuários
- ✅ `configuracoes` - Configurações

## 🚨 Problemas Comuns

### 1. "Variáveis do Supabase não configuradas"
**Solução:** Configure o arquivo `.env` com as credenciais do Supabase

### 2. "Usuário não encontrado"
**Solução:** Verifique se o email está correto no script

### 3. "Permissões não aplicadas"
**Solução:** Execute o script novamente no Supabase

### 4. "Políticas RLS não funcionam"
**Solução:** Verifique se as funções `is_admin_lify()` e `is_lify_admin()` existem

## 📞 Suporte

Se ainda houver problemas após aplicar as correções:

1. Execute o script de verificação
2. Verifique os logs no console do navegador
3. Confirme que as migrações foram aplicadas
4. Teste com um novo usuário admin_lify

## 🎯 Resultado Final

Após aplicar todas as correções:

- ✅ Usuário `lucasdmc@lify.com` será `admin_lify`
- ✅ Terá acesso total a todas as funcionalidades
- ✅ Poderá criar e deletar clínicas
- ✅ Novos usuários admin_lify serão configurados automaticamente
- ✅ Sistema de permissões funcionará corretamente 