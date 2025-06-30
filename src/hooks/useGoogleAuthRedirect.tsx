import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { googleTokenManager } from '@/services/google/tokens';

export const useGoogleAuthRedirect = (onSuccess?: (calendars?: any[]) => void) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAuthRedirect = async () => {
    console.log('=== HANDLING AUTH REDIRECT ===');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Search params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');
    const errorDescription = urlParams.get('error_description');

    console.log('URL params analysis:', { 
      hasCode: !!code, 
      error, 
      errorDescription,
      hasState: !!state,
      codeLength: code?.length || 0,
      allParams: Object.fromEntries(urlParams.entries())
    });

    if (error) {
      console.error('OAuth error received:', error);
      console.error('Error description:', errorDescription);
      
      let userFriendlyMessage = 'Erro na autenticação Google';
      
      if (error === 'access_denied') {
        userFriendlyMessage = 'Acesso negado pelo usuário';
      } else if (error === 'redirect_uri_mismatch') {
        userFriendlyMessage = 'Erro de configuração: URL de redirecionamento inválida';
      } else if (error === 'invalid_client') {
        userFriendlyMessage = 'Erro de configuração: Cliente OAuth inválido';
      }
      
      toast({
        title: userFriendlyMessage,
        description: errorDescription || `${error}`,
        variant: 'destructive',
      });
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && state) {
      try {
        console.log('Processing authorization code...');
        console.log('Code length:', code.length);
        console.log('Code preview:', code.substring(0, 20) + '...');
        
        if (!user) {
          console.error('No user found when processing OAuth code');
          toast({
            title: 'Erro',
            description: 'Usuário não autenticado. Faça login primeiro.',
            variant: 'destructive',
          });
          return;
        }

        console.log('User authenticated, exchanging code for tokens...');
        
        // Usar a função corrigida do GoogleTokenManager
        const tokens = await googleTokenManager.exchangeCodeForTokens(code);
        
        console.log('✅ Token exchange completed successfully');
        console.log('Access token length:', tokens.access_token?.length || 0);
        
        // Salvar tokens no banco
        await googleTokenManager.saveTokens(tokens);
        
        // Buscar calendários do usuário
        console.log('🔄 Fetching user calendars...');
        const { data: { session } } = await supabase.auth.getSession();
        
        const calendarsResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
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
        
        // Remove the code from URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: 'Autenticação concluída!',
          description: `Encontramos ${calendars.length} calendários. Selecione quais deseja conectar.`,
        });
        
        // Call success callback with calendars for selection
        onSuccess?.(calendars);
        
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Provide more specific error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('redirect_uri_mismatch')) {
          userMessage = 'Erro de configuração: verifique as URLs autorizadas no Google Cloud Console';
        } else if (errorMessage.includes('invalid_client')) {
          userMessage = 'Erro de configuração: credenciais OAuth inválidas';
        } else if (errorMessage.includes('Token exchange failed: 401')) {
          userMessage = 'Erro de autenticação: verifique as configurações do Google OAuth2';
        }
        
        toast({
          title: 'Erro',
          description: `Falha ao processar autenticação: ${userMessage}`,
          variant: 'destructive',
        });
        
        // Clean up URL on error
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    
    console.log('=== END AUTH REDIRECT HANDLING ===');
  };

  useEffect(() => {
    // Only handle auth redirect if we're on the agendamentos page
    if (window.location.pathname === '/agendamentos') {
      console.log('On agendamentos page, checking for auth redirect');
      handleAuthRedirect();
    } else {
      console.log('Not on agendamentos page, skipping auth redirect check');
    }
  }, []);

  return { handleAuthRedirect };
};
