#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuração dos endpoints
const endpoints = [
  {
    method: 'GET',
    path: '/health',
    description: 'Health check detalhado do sistema',
    response: {
      status: 'ok',
      timestamp: 'ISO string',
      version: 'string',
      uptime: 'number',
      memory: 'object',
      activeSessions: 'number',
      sessions: 'array',
      endpoints: 'array',
      server: 'object'
    }
  },
  {
    method: 'POST',
    path: '/api/whatsapp/generate-qr',
    description: 'Gerar QR Code para um agente',
    body: {
      agentId: 'string (obrigatório)'
    },
    response: {
      success: 'boolean',
      qrCode: 'string (base64)',
      message: 'string',
      agentId: 'string',
      whatsappNumber: 'string',
      connectionId: 'string'
    }
  },
  {
    method: 'GET',
    path: '/api/whatsapp/status/:agentId',
    description: 'Verificar status de um agente',
    params: {
      agentId: 'string (obrigatório)'
    },
    response: {
      status: 'string (qr|connected|disconnected|auth_failure)',
      qrCode: 'string (base64, se status=qr)',
      connected: 'boolean',
      connectedAt: 'ISO string (se conectado)',
      lastUpdate: 'number'
    }
  },
  {
    method: 'POST',
    path: '/api/whatsapp/disconnect',
    description: 'Desconectar um agente',
    body: {
      agentId: 'string (obrigatório)'
    },
    response: {
      success: 'boolean',
      message: 'string'
    }
  }
];

// Gerar documentação
function generateEndpointsDocs() {
  const now = new Date().toISOString();
  
  let markdown = `# 📋 Documentação dos Endpoints - Backend WhatsApp

## 📅 Última atualização: ${now}

## 🚀 Servidor
- **URL Base:** http://31.97.241.19:3001
- **Ambiente:** Produção
- **Versão:** 1.0.0

## 📊 Endpoints Disponíveis

`;

  endpoints.forEach((endpoint, index) => {
    markdown += `### ${index + 1}. ${endpoint.method} ${endpoint.path}

**Descrição:** ${endpoint.description}

`;

    if (endpoint.body) {
      markdown += `**Body (JSON):**
\`\`\`json
${JSON.stringify(endpoint.body, null, 2)}
\`\`\`

`;
    }

    if (endpoint.params) {
      markdown += `**Parâmetros de URL:**
\`\`\`json
${JSON.stringify(endpoint.params, null, 2)}
\`\`\`

`;
    }

    markdown += `**Resposta:**
\`\`\`json
${JSON.stringify(endpoint.response, null, 2)}
\`\`\`

**Exemplo de uso:**
\`\`\`bash
curl -X ${endpoint.method} http://31.97.241.19:3001${endpoint.path} \\
  -H "Content-Type: application/json" \\
  ${endpoint.body ? `-d '${JSON.stringify(endpoint.body)}'` : ''}
\`\`\`

---
`;
  });

  markdown += `
## 🔧 Comandos Úteis

### Verificar status do servidor
\`\`\`bash
curl http://31.97.241.19:3001/health
\`\`\`

### Ver logs em tempo real
\`\`\`bash
ssh root@31.97.241.19 "pm2 logs atendeai-backend"
\`\`\`

### Reiniciar servidor
\`\`\`bash
ssh root@31.97.241.19 "pm2 restart atendeai-backend"
\`\`\`

### Ver status PM2
\`\`\`bash
ssh root@31.97.241.19 "pm2 list"
\`\`\`

## 📝 Notas

- Todos os endpoints retornam JSON
- O servidor roda na porta 3001
- Logs são gerenciados pelo PM2
- Sessões WhatsApp são mantidas em memória
- Timeout de QR Code: 10 minutos
- Timeout de conexão: 15 minutos

---
*Documentação gerada automaticamente em ${now}*
`;

  // Salvar arquivo
  fs.writeFileSync('ENDPOINTS.md', markdown);
  console.log('✅ Documentação gerada: ENDPOINTS.md');
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEndpointsDocs();
}

export { generateEndpointsDocs }; 