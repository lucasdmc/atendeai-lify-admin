# 🚀 **GUIA: RESET COMPLETO DO BANCO DE DADOS**

## ⚠️ **ATENÇÃO: DESTRUTIVO!**

Este script **DELETA TODOS** os dados existentes e cria um banco completamente novo do zero.

---

## 🎯 **COMO EXECUTAR**

### **Passo 1: Acessar o Supabase Dashboard**
1. Vá para: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: `Lovable Chatbot`

### **Passo 2: Abrir o SQL Editor**
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### **Passo 3: Executar o Script de Reset**
1. Abra o arquivo: `scripts/reset-database-complete.sql`
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** ou pressione `Ctrl+Enter`

---

## 🔄 **O QUE O SCRIPT FAZ**

### **🗑️ PASSO 1: REMOVER TUDO**
- Remove todas as tabelas AI existentes
- Remove todas as tabelas base existentes
- Remove todas as funções existentes
- Remove todos os índices existentes

### **🏗️ PASSO 2: CRIAR DO ZERO**
- Cria extensão pgvector
- Cria 4 tabelas base
- Cria 15 tabelas AI (todos os sprints)
- Cria 30+ índices otimizados
- Cria 9 funções SQL

### **📝 PASSO 3: CONFIGURAR**
- Insere dados iniciais
- Configura todas as permissões
- Configura relacionamentos

---

## 📊 **ESTRUTURA CRIADA**

### **🏗️ TABELAS BASE (4)**
- `clinics` - Clínicas do sistema
- `users` - Usuários do sistema
- `user_profiles` - Perfis dos usuários
- `sessions` - Sessões de usuário

### **🤖 TABELAS AI - TODOS OS SPRINTS (15)**
- **Sprint 1**: `ai_medical_validation`, `ai_lgpd_logs`, `ai_confidence_scores`
- **Sprint 2**: `ai_model_ensemble`, `ai_prompts`, `ai_rate_limits`
- **Sprint 3**: `ai_cache_entries`, `ai_streaming_metrics`, `ai_interactions`
- **Sprint 4**: `ai_emotion_analysis`, `ai_proactive_suggestions`, `ai_multimodal_analysis`, `ai_voice_inputs`, `ai_voice_responses`, `user_voice_preferences`

### **🔧 FUNÇÕES SQL (9)**
- `get_cache_stats()` - Estatísticas do cache
- `get_streaming_stats()` - Estatísticas de streaming
- `get_analytics_stats()` - Estatísticas de analytics
- `get_emotion_stats()` - Estatísticas de emoções
- `get_proactive_stats()` - Estatísticas proativas
- `get_multimodal_stats()` - Estatísticas multimodais
- `get_voice_stats()` - Estatísticas de voz
- `match_cache_entries()` - Busca semântica
- `cleanup_old_cache_entries()` - Limpeza automática

---

## 📈 **ÍNDICES CRIADOS (30+)**

### **🏗️ Índices Base**
- Índices para `clinics`, `users`, `user_profiles`, `sessions`

### **🤖 Índices AI**
- Índices para cache semântico com pgvector
- Índices para analytics e métricas
- Índices para emoções e sugestões
- Índices para multimodal e voz

---

## 📝 **DADOS INICIAIS**

### **🏥 Clínica de Exemplo**
- **Nome**: Clínica ESADI
- **Endereço**: Rua das Flores, 123 - São Paulo, SP
- **Telefone**: (11) 99999-9999
- **Email**: contato@esadi.com.br

### **👤 Usuário Admin**
- **Email**: admin@esadi.com.br
- **Role**: admin
- **Status**: active

---

## ✅ **RESULTADO ESPERADO**

Após executar, você verá:
```
========================================
✅ RESET COMPLETO REALIZADO COM SUCESSO!
========================================
🗑️ Todas as tabelas antigas foram removidas
📊 Tabelas base criadas: 4
📊 Tabelas AI criadas: 15
🔧 Funções criadas: 9
📈 Índices criados: 30+
🔒 Permissões configuradas
📝 Dados iniciais inseridos
========================================
🚀 Sistema 100% resetado e pronto para uso!
========================================
```

---

## 🔍 **VERIFICAÇÃO**

Após executar, você pode verificar se tudo foi criado corretamente:

### **Teste 1: Verificar Tabelas**
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### **Teste 2: Verificar Funções**
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;
```

### **Teste 3: Testar Função**
```sql
SELECT * FROM get_cache_stats();
```

---

## 🎉 **VANTAGENS DO RESET COMPLETO**

✅ **100% limpo** - Sem dados antigos ou conflitos  
✅ **Estrutura perfeita** - Todas as relações corretas  
✅ **Sem erros** - Nenhum problema de dependência  
✅ **Performance otimizada** - Índices configurados  
✅ **Segurança configurada** - Permissões definidas  
✅ **Dados iniciais** - Sistema pronto para uso  

---

## 🚨 **IMPORTANTE**

- **Este script DELETA TODOS os dados existentes**
- **Execute apenas quando tiver certeza**
- **Faça backup se houver dados importantes**
- **Teste primeiro em ambiente de desenvolvimento**

---

## 🎯 **PRÓXIMOS PASSOS**

Após executar com sucesso:

1. **Teste as funções** de estatísticas
2. **Verifique as permissões** no Supabase Dashboard
3. **Configure as variáveis de ambiente** do frontend
4. **Teste a integração** frontend-backend
5. **Implemente os serviços AI** criados nos sprints

**🚀 Agora você tem um banco de dados 100% limpo e funcional!** 