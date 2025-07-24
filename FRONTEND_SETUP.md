# 🚀 Front-end AtendeAí - Configuração e Execução

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Git

## 🛠️ Instalação

1. **Navegue para o diretório do front-end:**
   ```bash
   cd atendeai-lify-admin
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

## 🎯 Executando o Front-end

### Opção 1: Script Principal (Recomendado)
```bash
npm start
```
ou
```bash
./start-frontend.sh
```

### Opção 2: Comando Direto
```bash
npm run dev:8080
```

### Opção 3: Comando Padrão (pode usar porta diferente)
```bash
npm run dev
```

## 🌐 Acesso

Após iniciar o servidor, o front-end estará disponível em:
- **URL Local**: http://localhost:8080
- **URL de Rede**: http://[seu-ip]:8080 (se configurado com --host)

## 📱 Funcionalidades

- ✅ Servidor configurado para porta 8080 por padrão
- ✅ Hot reload automático
- ✅ Verificação automática de portas em uso
- ✅ Script de inicialização simplificado

## 🔧 Configurações

### Vite Config (vite.config.ts)
- **Porta**: 8080
- **Alias**: @ -> ./src
- **Build**: Cache busting com timestamp
- **Plugins**: React

### Scripts Disponíveis
- `npm start` - Inicia o servidor na porta 8080
- `npm run dev:8080` - Inicia o servidor na porta 8080
- `npm run dev` - Inicia o servidor na porta padrão do Vite
- `npm run build` - Build para produção
- `npm run preview` - Preview do build

## 🚨 Solução de Problemas

### Porta 8080 em uso
O script automaticamente mata processos na porta 8080 antes de iniciar.

### Erro de dependências
```bash
npm install
```

### Limpar cache
```bash
npm run clean
```

## 📝 Logs

O servidor mostra logs em tempo real:
- ✅ VITE v5.4.19 ready in XXX ms
- ✅ Local: http://localhost:8080/
- ✅ Network: use --host to expose

## 🎉 Status

✅ **Front-end configurado e funcionando na porta 8080!** 