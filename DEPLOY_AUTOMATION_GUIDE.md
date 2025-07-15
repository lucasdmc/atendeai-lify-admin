# 🚀 Guia de Deploy Automático - Servidor WhatsApp

## 📋 **Situação Atual**

O servidor WhatsApp está rodando em `lify.magah.com.br` (VPS separada) e **NÃO** é atualizado automaticamente quando você faz commit no GitHub.

## 🎯 **Soluções Disponíveis**

### **Opção 1: GitHub Actions (Recomendado para Produção)**

#### **Configuração:**

1. **Adicionar Secrets no GitHub:**
   ```
   VPS_HOST=lify.magah.com.br
   VPS_USERNAME=seu_usuario
   VPS_SSH_KEY=sua_chave_ssh_privada
   ```

2. **Configurar SSH na VPS:**
   ```bash
   # Na VPS
   mkdir -p ~/.ssh
   # Adicionar sua chave pública
   ```

3. **Workflow já criado:** `.github/workflows/deploy-whatsapp-server.yml`

#### **Como usar:**
- Faça commit nas pastas `server/` ou `whatsapp/`
- O GitHub Actions fará deploy automático
- Ou use "Manual trigger" no GitHub

### **Opção 2: Script Local (Mais Simples)**

#### **Configuração:**

1. **Criar arquivo `.env`:**
   ```env
   VPS_HOST=lify.magah.com.br
   VPS_USER=root
   VPS_PATH=/opt/whatsapp-server
   ```

2. **Configurar SSH:**
   ```bash
   ssh-copy-id seu_usuario@lify.magah.com.br
   ```

3. **Executar deploy:**
   ```bash
   node scripts/deploy-whatsapp-automatic.js
   ```

### **Opção 3: Deploy Manual (Atual)**

#### **Processo Manual:**
```bash
# 1. Conectar na VPS
ssh usuario@lify.magah.com.br

# 2. Navegar para o diretório
cd /path/to/whatsapp-server

# 3. Fazer backup
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)

# 4. Parar servidor
pm2 stop whatsapp-server

# 5. Atualizar código
git pull origin main

# 6. Instalar dependências
npm install

# 7. Reiniciar servidor
pm2 restart whatsapp-server

# 8. Verificar status
pm2 status
```

## 🔧 **Implementação Recomendada**

### **Passo 1: Configurar Script Local**

1. **Execute o setup:**
   ```bash
   node scripts/deploy-whatsapp-automatic.js setup
   ```

2. **Configure as variáveis de ambiente**

3. **Teste o deploy:**
   ```bash
   node scripts/deploy-whatsapp-automatic.js
   ```

### **Passo 2: Integrar com Frontend**

Adicione um botão de deploy no painel administrativo:

```typescript
// Em src/pages/Agentes.tsx
const handleDeployWhatsApp = async () => {
  try {
    const response = await fetch('/api/deploy-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deploy' })
    });
    
    if (response.ok) {
      toast({
        title: "Deploy Iniciado",
        description: "Servidor WhatsApp está sendo atualizado...",
      });
    }
  } catch (error) {
    toast({
      title: "Erro",
      description: "Falha no deploy automático",
      variant: "destructive",
    });
  }
};
```

### **Passo 3: Automatizar com Hooks**

```typescript
// Em src/hooks/useWhatsAppDeploy.tsx
export const useWhatsAppDeploy = () => {
  const deployWhatsApp = async () => {
    // Lógica de deploy
  };
  
  const checkDeployStatus = async () => {
    // Verificar status
  };
  
  return { deployWhatsApp, checkDeployStatus };
};
```

## 🎯 **Próximos Passos**

### **Imediato:**
1. ✅ Configurar script local
2. ✅ Testar deploy manual
3. ✅ Implementar botão no frontend

### **Médio Prazo:**
1. 🔄 Configurar GitHub Actions
2. 🔄 Implementar notificações
3. 🔄 Adicionar logs detalhados

### **Longo Prazo:**
1. 🔄 CI/CD completo
2. 🔄 Rollback automático
3. 🔄 Monitoramento avançado

## 🚨 **Importante**

- **Sempre faça backup** antes do deploy
- **Teste em ambiente de desenvolvimento** primeiro
- **Monitore os logs** após cada deploy
- **Tenha um plano de rollback** pronto

## 📞 **Suporte**

Se precisar de ajuda:
1. Verifique os logs: `pm2 logs whatsapp-server`
2. Teste conectividade: `curl https://lify.magah.com.br/health`
3. Verifique status: `pm2 status`

---

**🎯 Resultado:** Deploy automático do servidor WhatsApp sempre que houver mudanças no código! 