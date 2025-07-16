# 🚀 Scripts para Servidor de Desenvolvimento

## ✅ Status Atual

O servidor está **rodando na porta 8080** conforme solicitado!

- **URL Local**: http://localhost:8080/
- **URL Network**: http://192.168.1.15:8080/
- **Status**: ✅ Funcionando

## 📋 Scripts Disponíveis

### 1. Script Automático (Recomendado)
```bash
./scripts/start-dev-8080.sh
```
- Limpa automaticamente as portas 8080, 8081, 8082
- Mata processos conflitantes
- Inicia o servidor na porta 8080
- Verifica se as portas estão livres

### 2. Script Básico
```bash
./scripts/start-dev-server.sh
```
- Versão mais simples do script acima
- Limpa portas e inicia servidor

### 3. Comando Manual
```bash
npm run dev
```
- Comando padrão do Vite
- Tenta porta 8080, se ocupada vai para 8081, 8082, etc.

## 🔧 Como Usar

### Para sempre usar a porta 8080:
```bash
./scripts/start-dev-8080.sh
```

### Para parar o servidor atual:
```bash
pkill -f "vite"
```

### Para verificar portas em uso:
```bash
lsof -i :8080
lsof -i :8081
lsof -i :8082
```

## 🎯 Configuração do Vite

O arquivo `vite.config.ts` já está configurado para usar a porta 8080:

```typescript
server: {
  host: "::",
  port: 8080,
  // ...
}
```

## 📱 URLs de Acesso

- **Local**: http://localhost:8080/
- **Network**: http://192.168.1.15:8080/
- **WhatsApp Test**: Acesse a página de Agentes para testar a sincronização

## 🚨 Solução de Problemas

### Se a porta 8080 estiver ocupada:
```bash
# Matar processo na porta 8080
lsof -ti :8080 | xargs kill -9

# Ou usar o script automático
./scripts/start-dev-8080.sh
```

### Se o servidor não iniciar:
```bash
# Limpar cache
npm run clean

# Reinstalar dependências
npm install

# Iniciar novamente
./scripts/start-dev-8080.sh
```

## ✅ Status Final

- **Servidor**: ✅ Rodando na porta 8080
- **WhatsApp**: ✅ Sistema funcional
- **Frontend**: ✅ Pronto para teste
- **Scripts**: ✅ Configurados

**Próximo passo**: Acesse http://localhost:8080/ e teste a sincronização do WhatsApp! 