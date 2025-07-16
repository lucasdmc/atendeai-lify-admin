# 🏥 Sistema de Clínicas - Configuração e Sincronização

## **📋 Status Atual**

### **✅ Problemas Identificados:**
1. **Tabela `clinics` vazia:** Não há clínicas registradas no banco
2. **Agentes sem clínica:** 1 agente ("Lukita 2") sem clínica associada
3. **RLS ativo:** Tabela com Row Level Security que impede inserções diretas
4. **Estrutura incompleta:** Faltam algumas colunas na tabela `clinics`

## **🔧 Scripts Disponíveis**

### **1. Estrutura da Tabela Clinics**
```bash
# Execute no Supabase Dashboard SQL Editor
cat scripts/ensure-clinics-table.sql
```

### **2. Criar Clínica Padrão**
```bash
# Execute no Supabase Dashboard SQL Editor
cat scripts/create-default-clinic-sql.sql
```

### **3. Sincronização de Clínicas**
```bash
node scripts/sync-clinics-to-table.js
```

### **4. Verificação do Sistema**
```bash
node scripts/verify-clinics-system.js
```

## **🎯 Passos para Configuração**

### **Passo 1: Garantir Estrutura da Tabela**
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `scripts/ensure-clinics-table.sql`

### **Passo 2: Criar Clínica Padrão**
1. No **SQL Editor** do Supabase
2. Execute o script: `scripts/create-default-clinic-sql.sql`
3. Isso criará uma clínica padrão e associará o agente "Lukita 2"

### **Passo 3: Verificar Sincronização**
```bash
node scripts/verify-clinics-system.js
```

## **📊 Estrutura da Tabela Clinics**

### **Colunas Principais:**
- `id` (UUID) - ID único da clínica
- `name` (TEXT) - Nome da clínica
- `address` (JSONB) - Endereço completo
- `phone` (JSONB) - Telefone da clínica
- `email` (JSONB) - Email da clínica
- `created_by` (UUID) - Usuário que criou a clínica
- `timezone` (TEXT) - Fuso horário (padrão: 'America/Sao_Paulo')
- `language` (TEXT) - Idioma (padrão: 'pt-BR')

### **Colunas Adicionais:**
- `working_hours` (JSONB) - Horário de funcionamento
- `specialties` (JSONB) - Especialidades da clínica
- `payment_methods` (JSONB) - Métodos de pagamento
- `insurance_accepted` (JSONB) - Convênios aceitos
- `emergency_contact` (JSONB) - Contato de emergência
- `admin_notes` (TEXT) - Notas administrativas
- `logo_url` (TEXT) - URL do logo
- `primary_color` (TEXT) - Cor primária
- `secondary_color` (TEXT) - Cor secundária

## **🔐 Políticas de Segurança (RLS)**

### **Políticas Configuradas:**
- **SELECT:** Todos podem visualizar clínicas
- **INSERT:** Apenas usuário autenticado pode criar clínicas
- **UPDATE:** Criador da clínica ou admin_lify pode editar
- **DELETE:** Criador da clínica ou admin_lify pode excluir

## **📋 Módulo de Clínicas no Frontend**

### **Componentes Disponíveis:**
- `CreateClinicModal.tsx` - Criar nova clínica
- `EditClinicModal.tsx` - Editar clínica existente
- `DeleteClinicModal.tsx` - Excluir clínica
- `Clinicas.tsx` - Página principal de gestão

### **Funcionalidades:**
- ✅ Criar clínicas com endereço, telefone, email
- ✅ Editar informações da clínica
- ✅ Excluir clínicas (com permissões)
- ✅ Buscar clínicas por nome
- ✅ Validação de dados
- ✅ Integração com Google Places API

## **🔗 Relacionamentos**

### **Agentes → Clínicas:**
- Cada agente pode estar associado a uma clínica
- Relacionamento via `clinic_id` na tabela `agents`
- Agentes sem clínica aparecem como "Sem clínica"

### **Usuários → Clínicas:**
- Usuários podem ser associados a clínicas específicas
- Usuários mestres (admin_lify, suporte_lify) têm acesso global
- Relacionamento via `clinic_id` na tabela `users`

## **🚀 URLs de Produção**

- **Frontend/Admin:** http://localhost:8080 (módulo Clínicas)
- **Supabase Dashboard:** https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
- **SQL Editor:** https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql

## **✅ Checklist de Configuração**

- [ ] Executar script de estrutura da tabela
- [ ] Criar clínica padrão via SQL
- [ ] Associar agentes sem clínica
- [ ] Verificar sincronização
- [ ] Testar módulo de Clínicas no frontend
- [ ] Validar permissões e RLS
- [ ] Testar criação/edição de clínicas

## **🎯 Próximos Passos**

1. **Execute os scripts SQL** no Supabase Dashboard
2. **Verifique a sincronização** com os scripts Node.js
3. **Teste o módulo de Clínicas** no frontend
4. **Crie clínicas reais** através da interface
5. **Associe agentes** às clínicas criadas

## **📞 Suporte**

Se houver problemas:
1. Verifique os logs do Supabase
2. Execute os scripts de verificação
3. Confirme as permissões do usuário
4. Verifique se o RLS está configurado corretamente

**Status:** 🔧 **Em Configuração** 