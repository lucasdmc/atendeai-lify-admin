
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarService } from '@/services/googleCalendarService';
import { useToast } from '@/hooks/use-toast';

export const useGoogleAuthRedirect = (onSuccess?: () => void) => {
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

    if (code) {
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
        const tokens = await googleCalendarService.exchangeCodeForTokens(code);
        console.log('Tokens received successfully');
        
        console.log('Saving tokens to database...');
        await googleCalendarService.saveTokens(tokens);
        console.log('Tokens saved successfully');
        
        // Remove the code from URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('Google Calendar connected successfully');
        
        toast({
          title: 'Sucesso!',
          description: 'Google Calendar conectado com sucesso',
        });
        
        // Call success callback
        onSuccess?.();
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Provide more specific error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('redirect_uri_mismatch')) {
          userMessage = 'Erro de configuração: verifique as URLs autorizadas no Google Cloud Console';
        } else if (errorMessage.includes('invalid_client')) {
          userMessage = 'Erro de configuração: credenciais OAuth inválidas';
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
