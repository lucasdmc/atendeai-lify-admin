import { Request, Response } from 'express';

/**
 * Handler para webhooks da API oficial do WhatsApp (Meta)
 * Recebe eventos de mensagens e status
 */
export function whatsappMetaWebhookHandler(req: Request, res: Response) {
  // Log do payload recebido
  console.log('[WhatsApp Meta Webhook] Payload recebido:', JSON.stringify(req.body, null, 2));

  // TODO: Adicionar processamento de mensagens, status, etc.

  res.status(200).send('OK');
} 