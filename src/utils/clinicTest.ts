import { supabase } from '@/integrations/supabase/client';

export const testClinicCreation = async () => {
  console.log('🧪 Testando criação de clínica...');
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Usuário atual:', user?.id);
    
    if (userError || !user?.id) {
      console.error('❌ Erro ao obter usuário:', userError);
      return;
    }

    // 2. Verificar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    console.log('👑 Perfil do usuário:', profile);
    
    if (profileError) {
      console.error('❌ Erro ao obter perfil:', profileError);
      return;
    }

    // 3. Verificar permissões do usuário
    const { data: permissions, error: permissionsError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('🔐 Permissões do usuário:', permissions);
    
    if (permissionsError) {
      console.error('❌ Erro ao obter permissões:', permissionsError);
      return;
    }

    // 4. Verificar permissões do role
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', profile.role);
    
    console.log('🎭 Permissões do role:', rolePermissions);
    
    if (rolePermissionsError) {
      console.error('❌ Erro ao obter permissões do role:', rolePermissionsError);
      return;
    }

    // 5. Testar função is_admin_lify
    const { data: isAdminLify, error: isAdminError } = await supabase
      .rpc('is_admin_lify', { user_id: user.id });
    
    console.log('👑 É admin lify?', isAdminLify);
    
    if (isAdminError) {
      console.error('❌ Erro ao verificar admin lify:', isAdminError);
      return;
    }

    // 6. Testar inserção de clínica
    const testClinicData = {
      name: `Clínica Teste ${Date.now()}`,
      cnpj: null,
      email: 'teste@clinica.com',
      phone: '(11) 99999-9999',
      address: 'Rua Teste, 123',
      city: 'São Paulo',
      state: 'SP',
      website: 'https://teste.com',
      is_active: true
    };

    console.log('📊 Tentando inserir clínica:', testClinicData);

    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .insert([testClinicData])
      .select();

    if (clinicError) {
      console.error('❌ Erro ao criar clínica:', clinicError);
      console.error('📋 Código do erro:', clinicError.code);
      console.error('📋 Mensagem do erro:', clinicError.message);
      console.error('📋 Detalhes do erro:', clinicError.details);
      console.error('📋 Hint do erro:', clinicError.hint);
    } else {
      console.log('✅ Clínica criada com sucesso:', clinicData);
      
      // 7. Limpar clínica de teste
      if (clinicData && clinicData[0]) {
        const { error: deleteError } = await supabase
          .from('clinics')
          .delete()
          .eq('id', clinicData[0].id);
        
        if (deleteError) {
          console.error('⚠️ Erro ao deletar clínica de teste:', deleteError);
        } else {
          console.log('🧹 Clínica de teste removida');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
};

export const checkUserPermissions = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    console.log('❌ Nenhum usuário logado');
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const { data: permissions } = await supabase
    .from('user_permissions')
    .select('module_name')
    .eq('user_id', user.id)
    .eq('can_access', true);

  return {
    userId: user.id,
    role: profile?.role,
    permissions: permissions?.map(p => p.module_name) || [],
    canCreateClinics: permissions?.some(p => p.module_name === 'criar_clinicas') || false
  };
};

export const testClinicViewing = async () => {
  console.log('👁️ Testando visualização de clínicas...');
  
  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Usuário atual:', user?.id);
    
    if (userError || !user?.id) {
      console.error('❌ Erro ao obter usuário:', userError);
      return;
    }

    // 2. Testar busca de clínicas
    console.log('🔍 Buscando clínicas...');
    const { data: clinics, error: clinicsError } = await supabase
      .from('clinics')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📡 Resposta da busca de clínicas:', { clinics, error: clinicsError });

    if (clinicsError) {
      console.error('❌ Erro ao buscar clínicas:', clinicsError);
      return;
    }

    console.log('✅ Clínicas encontradas:', clinics?.length || 0);
    console.log('📋 Detalhes das clínicas:', clinics);

    // 3. Verificar se há clínicas ativas
    const activeClinics = clinics?.filter(c => c.is_active) || [];
    console.log('✅ Clínicas ativas:', activeClinics.length);

    // 4. Testar busca com filtros específicos
    console.log('🔍 Testando busca com filtros...');
    const { data: filteredClinics, error: filterError } = await supabase
      .from('clinics')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    console.log('📡 Clínicas filtradas (ativas):', { filteredClinics, error: filterError });

    return {
      totalClinics: clinics?.length || 0,
      activeClinics: activeClinics.length,
      clinics: clinics || [],
      canView: !clinicsError
    };

  } catch (error) {
    console.error('❌ Erro geral no teste de visualização:', error);
    return null;
  }
}; 