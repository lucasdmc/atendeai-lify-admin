# 📋 Instruções Finais - Executar SQL Manualmente

## ⚠️ **ATENÇÃO: AÇÃO NECESSÁRIA**

Infelizmente, não é possível executar SQL via CLI ou API do Supabase por questões de segurança. **Você precisa executar o SQL manualmente.**

---

## 🔧 **PASSOS PARA EXECUTAR:**

### **1. Acessar o Supabase Dashboard**
- **Link:** https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql
- **Login:** Use suas credenciais do Supabase

### **2. Executar o SQL**
Cole e execute o seguinte SQL no SQL Editor:

```sql
-- Adicionar campo clinic_id à tabela whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id 
ON public.whatsapp_conversations(clinic_id);

-- Verificar se foi criado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
  AND column_name = 'clinic_id';
```

### **3. Executar Script para Associar Conversas**
Após executar o SQL, execute no terminal:

```bash
node scripts/associate-conversations-to-clinics.js
```

---

## ✅ **O QUE JÁ ESTÁ PRONTO:**

### **1. Código Frontend Atualizado**
- ✅ `src/pages/Conversas.tsx` - Removida dependência de agentes
- ✅ Lógica simplificada para filtrar por `clinic_id`
- ✅ Busca unificada de mensagens

### **2. Scripts Criados**
- ✅ `scripts/associate-conversations-to-clinics.js` - Para associar conversas
- ✅ `scripts/add-clinic-id-field.js` - Para verificar campo
- ✅ `scripts/execute-sql-via-api.js` - Para verificar status

---

## 🎯 **RESULTADO ESPERADO:**

### **Após executar o SQL e o script:**
1. **Campo `clinic_id`** adicionado à tabela `whatsapp_conversations`
2. **Conversas associadas** às clínicas
3. **Filtro funcionando** no frontend
4. **Admin/Suporte Lify** vendo conversas da clínica selecionada

---

## 🚀 **TESTE FINAL:**

Após executar tudo:
1. Acesse: http://localhost:8080
2. Faça login como admin_lify
3. Selecione a clínica CardioPrime no combobox
4. Verifique se as conversas aparecem corretamente

---

## 📞 **SUPORTE:**

Se tiver problemas:
1. Verifique se o SQL foi executado com sucesso
2. Execute `node scripts/execute-sql-via-api.js` para verificar
3. Verifique os logs do console do navegador

**🚀 Status: Aguardando execução manual do SQL** 