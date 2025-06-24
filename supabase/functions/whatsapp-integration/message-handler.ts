
import { corsHeaders } from './config.ts';
import { sendMessage } from './message-sender.ts';
import { handleWebhook } from './webhook-processor.ts';

export { sendMessage, handleWebhook };
