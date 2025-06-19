
export const downloadConversation = async (conversationId: string, conversationName: string, supabase: any) => {
  try {
    // Buscar todas as mensagens da conversa
    const { data: messages, error } = await supabase
      .from('whatsapp_messages')
      .select('content, message_type, timestamp')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    // Formatar as mensagens para texto
    const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR');
    };

    let conversationText = `Conversa WhatsApp - ${conversationName}\n`;
    conversationText += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
    conversationText += `Total de mensagens: ${messages?.length || 0}\n`;
    conversationText += '\n' + '='.repeat(50) + '\n\n';

    if (messages && messages.length > 0) {
      messages.forEach((message) => {
        const sender = message.message_type === 'sent' ? 'Você' : conversationName;
        const time = formatTimestamp(message.timestamp);
        conversationText += `[${time}] ${sender}: ${message.content}\n\n`;
      });
    } else {
      conversationText += 'Nenhuma mensagem encontrada.\n';
    }

    // Criar e baixar o arquivo
    const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversa_whatsapp_${conversationName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Erro ao baixar conversa:', error);
    return false;
  }
};
