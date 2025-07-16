# 🔧 Correção do Erro 500 - Tabela User Profiles

## 🚨 Problema Atual
Erro 500 na tela de QR Code causado por problemas na tabela `user_profiles`:
```
[Error] Failed to load resource: the server responded with a status of 500 () (user_profiles, line 0)
```

## 🎯 Causa Raiz
O erro está ocorrendo porque:
1. **Recursão infinita nas políticas RLS** da tabela `user_profiles`
2. **Tabela pode não existir** ou estar corrompida
3. **Usuários sem perfil** causando falhas na autenticação

## ✅ Soluções Disponíveis

### **Opção 1: Script Automático (Recomendado)**
```bash
# Execute o script Node.js
node scripts/check-and-fix-user-profiles.js
```

### **Opção 2: Correção Manual via SQL**
1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
2. Vá para **SQL Editor**
3. Execute o script: `scripts/fix-user-profiles-final.sql`

### **Opção 3: Edge Function**
```bash
# Deploy da Edge Function de correção
npx supabase functions deploy fix-user-profiles
```

## 📋 Passos Detalhados

### **Passo 1: Verificar o Problema**
```bash
# Teste se a tabela está acessível
curl -X GET "https://niakqdolcdwxtrkbqmdi.supabase.co/rest/v1/user_profiles?select=*&limit=1" \
  -H "apikey: sua_anon_key" \
  -H "Authorization: Bearer seu_jwt_token"
```

### **Passo 2: Executar Correção**
```bash
# Opção A: Script automático
node scripts/check-and-fix-user-profiles.js

# Opção B: SQL manual
# Copie e cole o conteúdo de scripts/fix-user-profiles-final.sql no SQL Editor
```

### **Passo 3: Verificar Resultado**
```bash
# Teste novamente a tabela
curl -X GET "https://niakqdolcdwxtrkbqmdi.supabase.co/rest/v1/user_profiles?select=*&limit=1" \
  -H "apikey: sua_anon_key" \
  -H "Authorization: Bearer seu_jwt_token"
```

## 🔍 O que o Script Faz

### **1. Verificação da Tabela**
- ✅ Verifica se `user_profiles` existe
- ✅ Cria a tabela se necessário
- ✅ Adiciona colunas faltantes

### **2. Correção das Políticas RLS**
- ✅ Remove políticas problemáticas
- ✅ Cria políticas simples e seguras
- ✅ Evita recursão infinita

### **3. Criação de Perfis**
- ✅ Cria perfis para usuários existentes
- ✅ Define roles corretos (admin_lify, atendente, user)
- ✅ Associa clínicas quando necessário

### **4. Teste Final**
- ✅ Verifica se tudo funciona
- ✅ Conta total de perfis
- ✅ Valida políticas criadas

## 📊 Estrutura da Tabela Corrigida

```sql
CREATE TABLE public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status BOOLEAN DEFAULT true,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

## 🎯 Políticas RLS Corrigidas

```sql
-- Política de leitura
CREATE POLICY "user_profiles_read_policy" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política de inserção
CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política de atualização
CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política de exclusão
CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);
```

## 🚀 Como Testar

### **1. Acesse o Sistema**
```
http://localhost:8080
```

### **2. Faça Login**
- Email: `lucasdmc@lify.com`
- Senha: `123456`

### **3. Vá para Agentes**
```
http://localhost:8080/agentes
```

### **4. Teste o QR Code**
- Clique em "Gerar QR Code"
- Não deve aparecer erro 500
- QR Code deve ser exibido

## 📈 Resultados Esperados

### **✅ Logs que devem aparecer:**
```
🔄 [useAuth] Auth state changed: "SIGNED_IN"
✅ Tabela user_profiles corrigida
✅ QR Code gerado com sucesso
```

### **❌ Logs que NÃO devem mais aparecer:**
```
Failed to load resource: the server responded with a status of 500 () (user_profiles, line 0)
```

## 🔧 Troubleshooting

### **Se o erro persistir:**

1. **Verifique as variáveis de ambiente:**
```bash
# .env deve ter:
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

2. **Limpe o cache do browser:**
```bash
# Ctrl+Shift+R (hard refresh)
# Ou limpe cache manualmente
```

3. **Verifique os logs do Supabase:**
```bash
# No Supabase Dashboard > Logs
# Procure por erros relacionados a user_profiles
```

## 📞 Suporte

Se o problema persistir após executar todas as soluções:

1. **Execute o script de debug:**
```bash
node scripts/check-and-fix-user-profiles.js
```

2. **Verifique os logs:**
```bash
# Console do browser (F12)
# Logs do Supabase Dashboard
```

3. **Teste manualmente:**
```bash
# Teste direto no SQL Editor
SELECT COUNT(*) FROM user_profiles;
```

## 🎉 Resultado Final

Após a correção, você deve ter:
- ✅ Sistema funcionando sem erros 500
- ✅ QR Code sendo exibido corretamente
- ✅ Autenticação funcionando
- ✅ Perfis de usuário criados
- ✅ Políticas RLS funcionando 