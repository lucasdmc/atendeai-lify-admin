import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    
    console.log('[Edge] Supabase URL:', supabaseUrl);
    console.log('[Edge] Service Role Key exists:', !!serviceRoleKey);
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)

    const { name, email, password, role, clinicId } = await req.json()
    console.log('[Edge] Dados recebidos:', { name, email, password, role, clinicId })

    // Validate required fields
    if (!name || !email || !password || !role) {
      console.error('[Edge] Campos obrigatórios faltando')
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se precisa de clínica e se foi fornecida
    const requiresClinic = role !== 'admin_lify' && role !== 'suporte_lify';
    if (requiresClinic && !clinicId) {
      console.error('[Edge] Clínica obrigatória para este tipo de usuário')
      return new Response(
        JSON.stringify({ error: 'Clínica é obrigatória para este tipo de usuário' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 1. Create user in Supabase Auth
    console.log('[Edge] Criando usuário no Auth...')
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Confirm email automatically
      user_metadata: {
        name: name,
        role: role
      }
    })

    if (authError) {
      console.error('[Edge] Erro ao criar usuário no Auth:', authError)
      return new Response(
        JSON.stringify({ error: authError.message, details: authError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authData.user) {
      console.error('[Edge] Falha ao criar usuário no sistema de autenticação')
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário no sistema de autenticação' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = authData.user.id
    console.log('[Edge] Usuário criado no Auth com ID:', userId)

    // 2. Create profile in user_profiles table
    console.log('[Edge] Criando perfil na tabela user_profiles...')
    const { error: profileError } = await supabaseClient
      .from('user_profiles')
      .insert({
        id: userId,
        user_id: userId,
        email: email.trim().toLowerCase(),
        name: name,
        role: role,
        status: true,
        clinic_id: requiresClinic ? clinicId : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[Edge] Erro ao criar perfil:', profileError)
      // If profile creation fails, delete the auth user to maintain consistency
      await supabaseClient.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: profileError.message, details: profileError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('[Edge] Perfil criado com sucesso para o usuário:', userId)

    // 3. Se o usuário precisa de clínica, criar associação na tabela clinic_users
    if (requiresClinic && clinicId) {
      console.log('[Edge] Criando associação com clínica...')
      const { error: clinicUserError } = await supabaseClient
        .from('clinic_users')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          role: role,
          is_active: true
        })

      if (clinicUserError) {
        console.error('[Edge] Erro ao criar associação com clínica:', clinicUserError)
        // Se falhar, deletar o perfil e o usuário auth para manter consistência
        await supabaseClient.from('user_profiles').delete().eq('user_id', userId)
        await supabaseClient.auth.admin.deleteUser(userId)
        return new Response(
          JSON.stringify({ error: clinicUserError.message, details: clinicUserError }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('[Edge] Associação com clínica criada com sucesso')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          email: email,
          name: name,
          role: role,
          clinicId: requiresClinic ? clinicId : null
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[Edge] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 