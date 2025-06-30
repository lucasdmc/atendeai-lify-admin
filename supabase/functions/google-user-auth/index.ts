import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create a Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { action, code, redirect_uri, client_id } = body;

    console.log('=== GOOGLE USER AUTH FUNCTION ===');
    console.log('Action:', action);
    console.log('Code length:', code?.length || 0);
    console.log('Code preview:', code?.substring(0, 20) + '...' || 'undefined');
    console.log('Redirect URI:', redirect_uri);
    console.log('Client ID:', client_id);

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ No authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError?.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    console.log('✅ User authenticated:', user.email);

    switch (action) {
      case 'check-env':
        return await checkEnvironment();
      
      case 'complete-auth':
        return await completeAuth(code, redirect_uri, user, supabase);
      
      default:
        console.error('❌ Invalid action:', action);
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
    }
  } catch (error) {
    console.error('❌ Error in google-user-auth:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function checkEnvironment() {
  try {
    console.log('🔍 Checking environment variables...');
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Client ID configured:', !!clientId);
    console.log('Client Secret configured:', !!clientSecret);
    console.log('Supabase URL configured:', !!supabaseUrl);
    console.log('Supabase Service Key configured:', !!supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        environment: {
          google_client_id: !!clientId,
          google_client_secret: !!clientSecret,
          supabase_url: !!supabaseUrl,
          supabase_service_key: !!supabaseServiceKey,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error checking environment:', error);
    throw error;
  }
}

async function completeAuth(code: string, redirect_uri: string, user: any, supabase: any) {
  try {
    console.log('🔄 Starting complete auth process...');
    
    // Validate required parameters
    if (!code) {
      throw new Error('Authorization code is required');
    }
    if (!redirect_uri) {
      throw new Error('Redirect URI is required');
    }

    // Get Google credentials from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    console.log('Client ID configured:', !!clientId);
    console.log('Client Secret configured:', !!clientSecret);

    if (!clientId || !clientSecret) {
      throw new Error('Google credentials not configured');
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Tokens obtained successfully');
    console.log('Access token length:', tokenData.access_token?.length || 0);
    console.log('Refresh token present:', !!tokenData.refresh_token);

    // Get user profile from Google
    console.log('🔄 Fetching user profile...');
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();
    console.log('✅ User profile fetched:', profile.email);

    // Get user's calendars
    console.log('🔄 Fetching user calendars...');
    const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let calendars = [];
    if (calendarsResponse.ok) {
      const calendarsData = await calendarsResponse.json();
      calendars = calendarsData.items || [];
      console.log('✅ Calendars fetched:', calendars.length);
    } else {
      console.warn('⚠️ Failed to fetch calendars, but continuing...');
    }

    // Save tokens to database (temporary storage)
    console.log('🔄 Saving tokens to database...');
    const { error: saveError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        scope: tokenData.scope,
        google_email: profile.email,
        created_at: new Date().toISOString(),
      });

    if (saveError) {
      console.warn('⚠️ Failed to save tokens:', saveError.message);
      // Continue anyway, tokens are still valid for this session
    } else {
      console.log('✅ Tokens saved to database');
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          google_email: profile.email,
        },
        calendars: calendars.map((cal: any) => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary || false,
          accessRole: cal.accessRole,
        })),
        tokens: {
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
          scope: tokenData.scope,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Error in completeAuth:', error);
    throw error;
  }
} 