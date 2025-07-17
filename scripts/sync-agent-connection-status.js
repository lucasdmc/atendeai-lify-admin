import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAgentConnectionStatus() {
  console.log('🔄 Sincronizando status do agente...');
  
  try {
    // 1. Verificar status do agente no servidor WhatsApp
    const agentId = '36e62010-e74a-4eaa-b1f7-4037d4721b81';
    
    console.log('📡 Verificando status do agente:', agentId);
    const statusResponse = await fetch(`http://31.97.241.19:3001/api/whatsapp/status/${agentId}`);
    const statusData = await statusResponse.json();
    
    console.log('📊 Status do servidor:', statusData);
    
    if (statusData.status === 'connected') {
      console.log('✅ Agente está conectado no servidor');
      
      // 2. Criar/atualizar registro na tabela agent_whatsapp_connections
      const { data: existingConnection, error: fetchError } = await supabase
        .from('agent_whatsapp_connections')
        .select('*')
        .eq('agent_id', agentId)
        .eq('connection_status', 'connected')
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar conexão existente:', fetchError);
        return;
      }
      
      if (existingConnection) {
        console.log('🔄 Atualizando conexão existente...');
        const { error: updateError } = await supabase
          .from('agent_whatsapp_connections')
          .update({
            connection_status: 'connected',
            last_connection_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConnection.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar conexão:', updateError);
        } else {
          console.log('✅ Conexão atualizada com sucesso');
        }
      } else {
        console.log('➕ Criando nova conexão...');
        const { error: insertError } = await supabase
          .from('agent_whatsapp_connections')
          .insert({
            agent_id: agentId,
            whatsapp_number: '5547997192447', // Número do agente
            whatsapp_name: 'Teste final 1',
            connection_status: 'connected',
            last_connection_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('❌ Erro ao criar conexão:', insertError);
        } else {
          console.log('✅ Nova conexão criada com sucesso');
        }
      }
      
      // 3. Verificar se a sincronização funcionou
      const { data: connections, error: verifyError } = await supabase
        .from('agent_whatsapp_connections')
        .select('*')
        .eq('agent_id', agentId);
      
      if (verifyError) {
        console.error('❌ Erro ao verificar conexões:', verifyError);
      } else {
        console.log('📊 Conexões encontradas:', connections?.length || 0);
        console.log('✅ Sincronização concluída!');
      }
      
    } else {
      console.log('❌ Agente não está conectado no servidor');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar sincronização
syncAgentConnectionStatus().then(() => {
  console.log('🎉 Processo de sincronização finalizado!');
}); 