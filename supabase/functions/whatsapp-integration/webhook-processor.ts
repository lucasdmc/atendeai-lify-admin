
import { corsHeaders } from './config.ts';
import { ContactManager } from './contact-manager.ts';
import { processAndRespondWithAI } from './ai-processor.ts';

export async function handleWebhook(data: any, supabase: any) {
  console.log('=== PROCESSANDO WEBHOOK ===');
  console.log('📥 Dados do webhook recebidos:', JSON.stringify(data, null, 2));

  try {
    if (data.event === 'message.received' && data.data) {
      console.log('✅ Evento de mensagem recebida detectado');
      console.log('📱 Dados da mensagem:', JSON.stringify(data.data, null, 2));
      
      const messageContent = data.data.message || 'Mensagem não suportada';
      const fromNumber = data.data.from;
      
      console.log(`📞 Mensagem de: ${fromNumber}`);
      console.log(`💬 Conteúdo: ${messageContent}`);

      // Extract contact name
      const contactName = ContactManager.extractContactName(data.data);
      console.log(`👤 Nome do contato final: ${contactName || 'Não encontrado'}`);

      // Find or create conversation
      const conversationId = await ContactManager.findOrCreateConversation(
        fromNumber, 
        contactName, 
        messageContent, 
        supabase
      );

      // Save received message
      await ContactManager.saveReceivedMessage(
        conversationId, 
        messageContent, 
        data.data.timestamp, 
        supabase
      );

      // Process with AI
      console.log('🤖 Iniciando processamento com IA...');
      try {
        await processAndRespondWithAI(fromNumber, messageContent, supabase);
        console.log('✅ Processamento com IA concluído');
      } catch (aiError) {
        console.error('❌ Erro no processamento com IA:', aiError);
      }
    } else {
      console.log('ℹ️ Webhook recebido mas não é uma mensagem:', data.event || 'evento não identificado');
      console.log('📄 Dados completos do webhook:', JSON.stringify(data, null, 2));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro crítico ao processar webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
