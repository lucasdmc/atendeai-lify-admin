#!/bin/bash

echo "=== CORRIGINDO ENDPOINT DE QR CODE ==="

# Parar servidor
ssh root@31.97.241.19 "pm2 stop atendeai-backend"

# Fazer backup
ssh root@31.97.241.19 "cd /root && cp server-baileys-production.js server-baileys-production.js.backup.qr-fix.$(date +%Y%m%d_%H%M%S)"

# Modificar o endpoint para usar QR Code válido
ssh root@31.97.241.19 "cd /root && sed -i 's/mode: \"pairing\"/mode: \"valid\"/' server-baileys-production.js"

# Substituir a função generatePairingQRCode por generateValidWhatsAppQRCode
ssh root@31.97.241.19 "cd /root && sed -i 's/generatePairingQRCode/generateValidWhatsAppQRCode/g' server-baileys-production.js"

# Adicionar a nova função generateValidWhatsAppQRCode
ssh root@31.97.241.19 "cd /root && cat > /tmp/valid-qr-function.js << 'EOF'
// Função para gerar QR Code válido do WhatsApp
async function generateValidWhatsAppQRCode(agentId, whatsappNumber) {
  console.log('[VALID-QR] Gerando QR Code válido do WhatsApp...');
  
  try {
    // QR Code que abre WhatsApp com mensagem (formato válido)
    const message = encodeURIComponent(\`Conectar agente \${agentId}\`);
    const whatsappLink = \`https://wa.me/\${whatsappNumber}?text=\${message}\`;
    
    console.log('[VALID-QR] Link WhatsApp:', whatsappLink);
    
    const qrCodeDataUrl = await qrcode.toDataURL(whatsappLink, {
      width: 512,
      margin: 2,
      color: {
        dark: '#128C7E',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    
    console.log('[VALID-QR] QR Code válido gerado com sucesso');
    return qrCodeDataUrl;
    
  } catch (error) {
    console.error('[VALID-QR] Erro ao gerar QR Code válido:', error);
    
    // Fallback: QR Code com instruções
    const instructionsText = \`WhatsApp Business: \${whatsappNumber}\\nAgente: \${agentId}\\nPor favor, adicione este número manualmente.\`;
    
    const instructionsQR = await qrcode.toDataURL(instructionsText, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return instructionsQR;
  }
}
EOF"

# Substituir a função antiga pela nova
ssh root@31.97.241.19 "cd /root && sed -i '/async function generatePairingQRCode/,/}/d' server-baileys-production.js"

# Inserir a nova função
ssh root@31.97.241.19 "cd /root && sed -i '/\/\/ Adicionar função para gerar QR Code de pairing/a\\' server-baileys-production.js"
ssh root@31.97.241.19 "cd /root && sed -i '/\/\/ Adicionar função para gerar QR Code de pairing/r /tmp/valid-qr-function.js' server-baileys-production.js"

# Reiniciar servidor
ssh root@31.97.241.19 "pm2 start atendeai-backend"

echo "=== CORREÇÃO APLICADA ==="
echo "Teste o QR Code agora!" 