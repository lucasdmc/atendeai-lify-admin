
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Atualizando métricas do dashboard...');

    // Calcular novas conversas (hoje)
    const { data: novasConversasData, error: novasConversasError } = await supabase
      .from('whatsapp_conversations')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date().toISOString().split('T')[0]);

    if (novasConversasError) {
      console.error('Erro ao buscar novas conversas:', novasConversasError);
    }

    const novasConversas = novasConversasData?.length || 0;

    // Calcular conversas aguardando resposta
    const { data: todasConversas, error: conversasError } = await supabase
      .from('whatsapp_conversations')
      .select(`
        id,
        whatsapp_messages!inner(
          id,
          message_type,
          created_at
        )
      `)
      .gte('whatsapp_messages.created_at', new Date().toISOString().split('T')[0]);

    let aguardandoResposta = 0;
    if (!conversasError && todasConversas) {
      for (const conversa of todasConversas) {
        const mensagens = conversa.whatsapp_messages as any[];
        const temMensagemRecebida = mensagens.some(m => m.message_type === 'received');
        const temRespostaEnviada = mensagens.some(m => m.message_type === 'sent');
        
        if (temMensagemRecebida && !temRespostaEnviada) {
          aguardandoResposta++;
        }
      }
    }

    // Calcular tempo médio do chatbot
    const { data: mensagensData, error: mensagensError } = await supabase
      .from('whatsapp_messages')
      .select('conversation_id, message_type, timestamp, created_at')
      .gte('created_at', new Date().toISOString().split('T')[0])
      .order('conversation_id, timestamp');

    let tempoMedioChatbot = 0;
    if (!mensagensError && mensagensData) {
      const temposResposta: number[] = [];
      const conversas: { [key: string]: any[] } = {};
      
      // Agrupar mensagens por conversa
      mensagensData.forEach(msg => {
        if (!conversas[msg.conversation_id]) {
          conversas[msg.conversation_id] = [];
        }
        conversas[msg.conversation_id].push(msg);
      });

      // Calcular tempo de resposta para cada conversa
      Object.values(conversas).forEach(mensagens => {
        for (let i = 0; i < mensagens.length - 1; i++) {
          const msgUsuario = mensagens[i];
          const proximaMsg = mensagens[i + 1];
          
          if (msgUsuario.message_type === 'received' && proximaMsg.message_type === 'sent') {
            const tempo1 = new Date(msgUsuario.timestamp || msgUsuario.created_at).getTime();
            const tempo2 = new Date(proximaMsg.timestamp || proximaMsg.created_at).getTime();
            const diferenca = (tempo2 - tempo1) / 1000; // converter para segundos
            
            if (diferenca > 0 && diferenca < 300) { // máximo 5 minutos para ser considerado resposta automática
              temposResposta.push(diferenca);
            }
          }
        }
      });

      if (temposResposta.length > 0) {
        tempoMedioChatbot = temposResposta.reduce((a, b) => a + b, 0) / temposResposta.length;
      }
    }

    // Atualizar ou inserir métricas na tabela
    const hoje = new Date().toISOString().split('T')[0];
    
    // Inserir/atualizar novas conversas
    await supabase
      .from('dashboard_metrics')
      .upsert({
        metric_name: 'novas_conversas',
        metric_value: novasConversas,
        metric_date: hoje
      }, {
        onConflict: 'metric_name,metric_date'
      });

    // Inserir/atualizar aguardando resposta
    await supabase
      .from('dashboard_metrics')
      .upsert({
        metric_name: 'aguardando_resposta',
        metric_value: aguardandoResposta,
        metric_date: hoje
      }, {
        onConflict: 'metric_name,metric_date'
      });

    // Inserir/atualizar tempo médio chatbot
    await supabase
      .from('dashboard_metrics')
      .upsert({
        metric_name: 'tempo_medio_chatbot',
        metric_value: Math.round(tempoMedioChatbot),
        metric_date: hoje
      }, {
        onConflict: 'metric_name,metric_date'
      });

    console.log('Métricas atualizadas:', {
      novasConversas,
      aguardandoResposta,
      tempoMedioChatbot: Math.round(tempoMedioChatbot)
    });

    return new Response(JSON.stringify({
      success: true,
      metrics: {
        novas_conversas: novasConversas,
        aguardando_resposta: aguardandoResposta,
        tempo_medio_chatbot: Math.round(tempoMedioChatbot)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao atualizar métricas:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
