// Função corrigida para gerar QR Code válido do WhatsApp Business
async function generateSimpleQRCode(agentId, whatsappNumber) {
  console.log('[VALID-QR] Gerando QR Code válido para WhatsApp Business...');
  
  try {
    // QR Code que abre WhatsApp com mensagem específica
    const message = encodeURIComponent(`Olá! Sou o agente ${agentId} do AtendeAI. Como posso ajudar?`);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;
    
    console.log('[VALID-QR] Link WhatsApp Business:', whatsappLink);
    
    // Gerar QR Code com configurações otimizadas
    const qrCodeDataUrl = await qrcode.toDataURL(whatsappLink, {
      width: 512,
      margin: 2,
      color: {
        dark: '#128C7E', // Cor oficial do WhatsApp
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // Alta correção de erro para melhor leitura
    });
    
    console.log('[VALID-QR] QR Code válido gerado com sucesso');
    return qrCodeDataUrl;
    
  } catch (error) {
    console.error('[VALID-QR] Erro ao gerar QR Code válido:', error);
    
    // Fallback: QR Code com instruções claras
    const instructionsText = `WhatsApp Business: ${whatsappNumber}\nAgente: ${agentId}\n\nPara conectar:\n1. Abra o WhatsApp Business\n2. Adicione este número\n3. Envie uma mensagem`;
    
    const instructionsQR = await qrcode.toDataURL(instructionsText, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    return instructionsQR;
  }
} 