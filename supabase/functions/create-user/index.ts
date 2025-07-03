import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    
    console.log('[Edge] Supabase URL:', supabaseUrl);
    console.log('[Edge] Service Role Key exists:', !!serviceRoleKey);
    console.log('[Edge] Service Role Key length:', serviceRoleKey.length);
    console.log('[Edge] Service Role Key starts with:', serviceRoleKey.substring(0, 20) + '...');
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    const { name, email, password, role } = await req.json()
    console.log('[Edge] Dados recebidos:', { name, email, password, role })

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

    // Teste 1: Verificar se conseguimos listar usuários (teste de permissão)
    console.log('[Edge] Testando permissões de admin...')
    const { data: users, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('[Edge] Erro ao listar usuários (teste de permissão):', listError)
      return new Response(
        JSON.stringify({ 
          error: 'Sem permissões de admin', 
          details: listError,
          test: 'list_users_failed'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('[Edge] Permissões de admin OK, usuários encontrados:', users?.users?.length || 0)

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
        status: true
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: userId,
          email: email,
          name: name,
          role: role
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
      JSON.stringify({ error: error?.message || String(error), details: error }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 