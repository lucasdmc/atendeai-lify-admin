# Configuração da Google Places API

Este guia explica como configurar a Google Places API para o sistema de busca de endereços.

## 🎯 Funcionalidades

- **Busca por CEP**: Usa a API gratuita do ViaCEP
- **Autocompletar de endereços**: Usa a Google Places API
- **Preenchimento automático**: Cidade, estado e CEP são preenchidos automaticamente

## 🔧 Configuração da Google Places API

### 1. Criar projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Places API**:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Places API"
   - Clique em "Enable"

### 2. Criar chave de API

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "API Key"
3. Copie a chave gerada

### 3. Configurar restrições (recomendado)

1. Clique na chave criada
2. Em "Application restrictions", selecione "HTTP referrers"
3. Adicione os domínios permitidos:
   - `localhost:8080/*` (desenvolvimento)
   - `seu-dominio.com/*` (produção)
4. Em "API restrictions", selecione "Restrict key"
5. Selecione apenas "Places API"

### 4. Configurar variável de ambiente

1. Copie o arquivo `.env.example` para `.env`
2. Adicione sua chave de API:
   ```
   VITE_GOOGLE_PLACES_API_KEY=sua_chave_aqui
   ```

## 🧪 Testando a configuração

### Teste manual

1. Inicie o servidor de desenvolvimento: `npm run dev`
2. Vá para a página de Clínicas
3. Clique em "Nova Clínica"
4. No campo de endereço:
   - Digite um CEP (ex: 01310-100) e clique em buscar
   - Ou digite um endereço e aguarde as sugestões

### Teste via script

```bash
node scripts/test-address-service.js
```

## 💰 Custos

- **ViaCEP**: Gratuito (sem limites)
- **Google Places API**: 
  - $17 por 1000 requisições
  - $5 por 1000 requisições de detalhes
  - $200 de crédito gratuito mensal

## 🚨 Limitações

- Google Places API requer chave válida
- Sem chave, apenas busca por CEP funciona
- Sugestões aparecem após 3 caracteres
- Debounce de 300ms para evitar muitas requisições

## 🔍 Debug

Para verificar se a API está funcionando:

1. Abra o console do navegador
2. Vá para a página de criação de clínica
3. Digite um endereço
4. Verifique os logs no console

## 📝 Exemplo de uso

```typescript
import { AddressInput } from '@/components/ui/address-input';

<AddressInput
  value={address}
  onChange={setAddress}
  onAddressComplete={(data) => {
    setAddress(data.address);
    setCity(data.city);
    setState(data.state);
  }}
  placeholder="Digite o endereço ou CEP"
/>
``` 