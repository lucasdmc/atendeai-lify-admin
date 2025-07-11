import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndAddClinicId() {
  try {
    console.log('🚀 Verificando e adicionando campo clinic_id...');
    
    // 1. Verificar se a tabela user_calendars existe
    console.log('\n1. Verificando tabela user_calendars...');
    const { data: calendars, error: calendarsError } = await supabase
      .from('user_calendars')
      .select('*')
      .limit(1);
    
    if (calendarsError) {
      console.error('❌ Erro ao acessar tabela user_calendars:', calendarsError);
      return;
    }
    
    console.log('✅ Tabela user_calendars acessível');
    
    // 2. Verificar se o campo clinic_id existe
    console.log('\n2. Verificando campo clinic_id...');
    const { data: sampleCalendar, error: sampleError } = await supabase
      .from('user_calendars')
      .select('clinic_id')
      .limit(1);
    
    if (sampleError && sampleError.message.includes('clinic_id')) {
      console.log('⚠️ Campo clinic_id não existe, será necessário adicionar via migration');
      console.log('💡 Execute: supabase migration new add_clinic_id_to_user_calendars');
    } else {
      console.log('✅ Campo clinic_id já existe');
    }
    
    // 3. Verificar clínicas disponíveis (sem campo is_active)
    console.log('\n3. Verificando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('id, name, created_at');
    
    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }
    
    console.log(`✅ Encontradas ${clinics.length} clínicas:`, clinics.map(c => c.name));
    
    // 4. Verificar calendários sem clinic_id
    console.log('\n4. Verificando calendários sem clinic_id...');
    const { data: calendarsWithoutClinic, error: withoutClinicError } = await supabase
      .from('user_calendars')
      .select('id, user_id, calendar_name, clinic_id')
      .is('clinic_id', null);
    
    if (withoutClinicError) {
      console.log('⚠️ Não foi possível verificar calendários sem clinic_id:', withoutClinicError.message);
    } else {
      console.log(`📊 Encontrados ${calendarsWithoutClinic.length} calendários sem clinic_id`);
      
      if (calendarsWithoutClinic.length > 0 && clinics.length > 0) {
        console.log('\n5. Atualizando calendários sem clinic_id...');
        
        const defaultClinicId = clinics[0].id;
        console.log(`🎯 Usando clínica padrão: ${clinics[0].name} (${defaultClinicId})`);
        
        const { error: updateError } = await supabase
          .from('user_calendars')
          .update({ clinic_id: defaultClinicId })
          .is('clinic_id', null);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar calendários:', updateError);
        } else {
          console.log('✅ Calendários atualizados com sucesso');
        }
      }
    }
    
    // 5. Estatísticas finais
    console.log('\n6. Estatísticas finais...');
    const { data: allCalendars, error: statsError } = await supabase
      .from('user_calendars')
      .select('clinic_id');
    
    if (!statsError) {
      const total = allCalendars.length;
      const withClinic = allCalendars.filter(c => c.clinic_id).length;
      const withoutClinic = total - withClinic;
      
      console.log(`📊 Total de calendários: ${total}`);
      console.log(`📊 Com clinic_id: ${withClinic}`);
      console.log(`📊 Sem clinic_id: ${withoutClinic}`);
    }
    
    console.log('\n🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndAddClinicId(); 