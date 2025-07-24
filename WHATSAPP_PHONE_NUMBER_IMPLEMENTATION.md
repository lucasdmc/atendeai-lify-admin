# 📱 **Implementação: Número de Telefone WhatsApp por Clínica**

## 🎯 **Objetivo**

Implementar sistema de gerenciamento de números de telefone WhatsApp por clínica, permitindo que cada clínica tenha seu próprio número, com validação obrigatória para Meta API e opcional para Baileys.

---

## ✅ **Implementação Realizada**

### **1. Estrutura do Banco de Dados**

#### **Migração SQL** (`scripts/add-whatsapp-phone-number-fields.sql`)
```sql
-- Novos campos adicionados à tabela clinics
ALTER TABLE clinics 
ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_verification_status VARCHAR(50) DEFAULT 'pending';

-- Índices e constraints
CREATE INDEX IF NOT EXISTS idx_clinics_whatsapp_phone_number ON clinics(whatsapp_phone_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clinics_whatsapp_phone_number_unique 
ON clinics(whatsapp_phone_number) WHERE whatsapp_phone_number IS NOT NULL;
```

#### **Campos Adicionados:**
- ✅ `whatsapp_phone_number`: Número de telefone da clínica
- ✅ `whatsapp_phone_number_verified`: Se foi verificado na Meta
- ✅ `whatsapp_phone_number_verification_date`: Data da verificação
- ✅ `whatsapp_phone_number_verification_status`: Status da verificação

### **2. Frontend - Componente de Campo**

#### **WhatsAppPhoneNumberField** (`src/components/whatsapp/WhatsAppPhoneNumberField.tsx`)
- ✅ **Formatação Automática**: Converte para formato internacional (+5511999999999)
- ✅ **Validação em Tempo Real**: Verifica formato e disponibilidade
- ✅ **Status Visual**: Badges e ícones para status de verificação
- ✅ **Integração Condicional**: Campos obrigatórios apenas para Meta API
- ✅ **Botão de Verificação**: Verifica número na Meta Business

#### **Funcionalidades:**
```typescript
// Formatação automática
const formatPhoneNumber = (input: string): string => {
  // Remove tudo exceto números e formata para +5511999999999
};

// Validação de formato
const phoneRegex = /^\+55[1-9][0-9]{10}$/;

// Status visual
const getStatusBadge = () => {
  switch (verificationStatus) {
    case 'verified': return <Badge className="bg-green-100 text-green-800">Verificado</Badge>;
    case 'failed': return <Badge variant="destructive">Falha</Badge>;
    case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
  }
};
```

### **3. Frontend - Modal de Clínica Atualizado**

#### **CreateClinicModal** (`src/components/clinics/CreateClinicModal.tsx`)
- ✅ **Campo Integrado**: WhatsAppPhoneNumberField adicionado
- ✅ **Validação Condicional**: Número obrigatório apenas para Meta API
- ✅ **Dados Salvos**: Número e status salvos no banco
- ✅ **Feedback Visual**: Alertas explicativos para cada modalidade

#### **Validações Implementadas:**
```typescript
// Validação para Meta API
if (formData.whatsappIntegrationType === 'meta_api' && !formData.whatsappPhoneNumber.trim()) {
  toast({
    title: "Erro",
    description: "Número de telefone WhatsApp é obrigatório para integração com Meta API.",
    variant: "destructive",
  });
  return;
}
```

### **4. Backend - Serviço de Verificação**

#### **WhatsAppPhoneVerificationService** (`services/whatsappPhoneVerificationService.js`)
- ✅ **Verificação na Meta**: Verifica se número está registrado na Meta Business
- ✅ **Validação de Formato**: Regex para formato brasileiro
- ✅ **Verificação de Unicidade**: Evita números duplicados entre clínicas
- ✅ **Atualização de Status**: Salva status de verificação no banco

#### **Métodos Principais:**
```javascript
// Verificação na Meta API
async verifyPhoneNumber(phoneNumber) {
  // Verifica se número está na lista de números verificados da conta
  const response = await fetch(`https://graph.facebook.com/v18.0/${this.phoneNumberId}`, {
    headers: { 'Authorization': `Bearer ${this.accessToken}` }
  });
}

// Verificação de unicidade
async isPhoneNumberInUse(phoneNumber, excludeClinicId = null) {
  // Verifica se número já está sendo usado por outra clínica
}

// Validação de formato
validatePhoneNumberFormat(phoneNumber) {
  const phoneRegex = /^\+55[1-9][0-9]{10}$/;
  return phoneRegex.test(phoneNumber);
}
```

### **5. Backend - Rotas de Verificação**

#### **whatsapp-verification.js** (`routes/whatsapp-verification.js`)
- ✅ **POST /verify-phone**: Verifica número na Meta Business
- ✅ **POST /validate-phone**: Valida formato e disponibilidade
- ✅ **GET /phone-status/:clinicId**: Obtém status de verificação

#### **Endpoints Implementados:**
```javascript
// Verificação na Meta
POST /api/whatsapp/verify-phone
{
  "phoneNumber": "+5511999999999",
  "clinicId": "uuid-da-clinica"
}

// Validação de formato
POST /api/whatsapp/validate-phone
{
  "phoneNumber": "+5511999999999",
  "clinicId": "uuid-da-clinica"
}

// Status de verificação
GET /api/whatsapp/phone-status/:clinicId
```

### **6. Contexto Atualizado**

#### **ClinicContext** (`src/contexts/ClinicContext.tsx`)
- ✅ **Interface Atualizada**: Adicionados campos de número de telefone
- ✅ **Tipagem Completa**: TypeScript com todos os novos campos
- ✅ **Compatibilidade**: Mantém compatibilidade com código existente

```typescript
interface Clinic {
  // ... campos existentes
  whatsapp_phone_number?: string | null;
  whatsapp_phone_number_verified?: boolean;
  whatsapp_phone_number_verification_date?: string | null;
  whatsapp_phone_number_verification_status?: 'pending' | 'verified' | 'failed' | 'unverified';
}
```

---

## 🔄 **Fluxo de Funcionamento**

### **Cenário 1: Nova Clínica com Meta API (Toggle ON)**

1. **Cadastro da Clínica**:
   - Admin preenche dados básicos
   - Toggle ON para Meta API
   - Campo de número se torna obrigatório

2. **Validação do Número**:
   - Sistema valida formato (+5511999999999)
   - Verifica se não está em uso por outra clínica
   - Botão "Verificar" aparece

3. **Verificação na Meta**:
   - Admin clica em "Verificar"
   - Sistema consulta Meta Business API
   - Status é atualizado (verificado/falha)

4. **Salvamento**:
   - Número e status salvos no banco
   - Clínica pode usar WhatsApp Business

### **Cenário 2: Nova Clínica com Baileys (Toggle OFF)**

1. **Cadastro da Clínica**:
   - Admin preenche dados básicos
   - Toggle OFF para Baileys
   - Campo de número é opcional

2. **Configuração**:
   - Número pode ser deixado em branco
   - Será definido após conexão via QR Code
   - Clínica salva sem número

3. **Conexão Posterior**:
   - Admin conecta via QR Code
   - Número é definido automaticamente
   - Status atualizado para "connected"

### **Cenário 3: Edição de Clínica Existente**

1. **Acesso ao Modal**:
   - Admin edita clínica existente
   - Campos preenchidos com dados atuais
   - Validações aplicadas conforme toggle

2. **Alteração de Modalidade**:
   - Se mudar para Meta API: número se torna obrigatório
   - Se mudar para Baileys: número se torna opcional
   - Validações atualizadas dinamicamente

3. **Atualização**:
   - Dados salvos com novas configurações
   - Status de verificação mantido/atualizado

---

## 🎨 **Interface do Usuário**

### **Campos Obrigatórios**:
- ✅ **Asterisco Vermelho**: `*` para campos obrigatórios
- ✅ **Validação Visual**: Bordas vermelhas para erros
- ✅ **Mensagens Claras**: Explicações específicas para cada modalidade

### **Status de Verificação**:
- 🟢 **Verificado**: Badge verde com ícone de check
- 🔴 **Falha**: Badge vermelho com ícone de X
- 🟡 **Pendente**: Badge amarelo com ícone de relógio
- ⚪ **Não Verificado**: Badge cinza

### **Alertas Informativos**:
- **Meta API**: "Número obrigatório para integração empresarial"
- **Baileys**: "Número opcional, será definido após conexão"
- **Formato**: "Use formato: +5511999999999"
- **Duplicação**: "Número já está sendo usado por outra clínica"

---

## 🔧 **Configuração Técnica**

### **Dependências**:
- ✅ **Frontend**: React, TypeScript, Tailwind CSS
- ✅ **Backend**: Node.js, Express, Supabase
- ✅ **Meta API**: Graph API v18.0
- ✅ **Validação**: Regex para formato brasileiro

### **Variáveis de Ambiente**:
```env
# Meta Business API
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token
```

### **Segurança**:
- ✅ **Validação de Formato**: Regex para prevenir injeção
- ✅ **Verificação de Unicidade**: Evita números duplicados
- ✅ **Autenticação**: Rotas protegidas por middleware
- ✅ **Sanitização**: Dados limpos antes de salvar

---

## 🧪 **Testes Recomendados**

### **Teste 1: Validação de Formato**
1. Inserir número inválido: "123"
2. Verificar se erro é exibido
3. Inserir número válido: "+5511999999999"
4. Verificar se formatação funciona

### **Teste 2: Verificação de Unicidade**
1. Criar clínica A com número "+5511999999999"
2. Tentar criar clínica B com mesmo número
3. Verificar se erro de duplicação é exibido

### **Teste 3: Verificação na Meta**
1. Configurar credenciais da Meta
2. Inserir número registrado na Meta
3. Clicar em "Verificar"
4. Verificar se status muda para "Verificado"

### **Teste 4: Toggle de Modalidade**
1. Criar clínica com Baileys (número opcional)
2. Editar e mudar para Meta API
3. Verificar se número se torna obrigatório
4. Salvar e verificar se funciona

---

## 📋 **Próximos Passos**

### **Melhorias Futuras**:
1. 🔄 **Verificação Automática**: Verificar números automaticamente ao salvar
2. 🔄 **Notificações**: Alertas quando número não está verificado
3. 🔄 **Histórico**: Log de mudanças de configuração
4. 🔄 **Bulk Operations**: Verificar múltiplos números de uma vez

### **Integração com Meta**:
1. 🔄 **Webhook de Verificação**: Atualizar status automaticamente
2. 🔄 **Sincronização**: Manter dados sincronizados com Meta
3. 🔄 **Relatórios**: Estatísticas de verificação

### **Interface**:
1. 🔄 **Tooltips**: Explicações detalhadas sobre cada campo
2. 🔄 **Wizard**: Assistente para configuração inicial
3. 🔄 **Preview**: Visualização de como número aparecerá

---

## ✅ **Status da Implementação**

### **Concluído**:
- ✅ Estrutura do banco de dados
- ✅ Componente de campo com validação
- ✅ Modal de criação atualizado
- ✅ Serviço de verificação no backend
- ✅ Rotas de API implementadas
- ✅ Contexto atualizado
- ✅ Validações e feedback visual

### **Resultado**:
🎯 **Sistema Completo**: Cada clínica pode ter seu próprio número de WhatsApp, com validação obrigatória para Meta API e flexibilidade para Baileys, proporcionando isolamento e controle total por clínica. 