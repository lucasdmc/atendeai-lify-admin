import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirectUri } = await req.json()

    if (!code || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing code or redirectUri' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 [Edge Function] Starting token exchange process')
    console.log('🔄 [Edge Function] Redirect URI:', redirectUri)

    // Google OAuth credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com'
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    if (!clientSecret) {
      console.error('❌ [Edge Function] Google Client Secret not configured')
      return new Response(
        JSON.stringify({ error: 'Google Client Secret not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange authorization code for tokens
    console.log('🔄 [Edge Function] Exchanging code for tokens...')
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ [Edge Function] Token exchange failed:', errorData)
      
      // Provide more specific error messages
      if (errorData.includes('redirect_uri_mismatch')) {
        return new Response(
          JSON.stringify({ 
            error: 'Redirect URI mismatch. Please check Google Cloud Console configuration.',
            details: errorData 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange code for tokens',
          details: errorData 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    console.log('✅ [Edge Function] Token exchange successful')

    // Get user info from Google
    console.log('🔄 [Edge Function] Fetching user profile...')
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('❌ [Edge Function] Failed to fetch user info')
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json()
    console.log('✅ [Edge Function] User profile fetched:', userInfo.email)

    // Calculate expiration date
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Prepare response
    const response = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      scope: tokens.scope,
      user_profile: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      },
    }

    console.log('🎉 [Edge Function] OAuth process completed successfully')
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('❌ [Edge Function] Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
