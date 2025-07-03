import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { rolePermissions } from '@/components/users/UserRoleUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  userPermissions: string[];
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔄 [useAuth] Fetching user data for ID:', userId);
      
      // Buscar perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, name')
        .eq('user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ [useAuth] Error fetching profile:', profileError);
        
        // Se o perfil não existe, tentar criar automaticamente
        if (profileError.code === 'PGRST116') {
          console.log('🔄 [useAuth] Profile not found, creating new profile...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              user_id: userId, // Adicionar user_id obrigatório
              email: user?.email || 'user@example.com',
              name: user?.email?.split('@')[0] || 'Usuário',
              role: 'admin_lify',
              status: true
            })
            .select('role, name')
            .single();

          if (createError) {
            console.error('❌ [useAuth] Error creating profile:', createError);
            setUserRole(null);
            setUserPermissions([]);
            return;
          }

          console.log('✅ [useAuth] Profile created successfully:', newProfile);
          setUserRole(newProfile.role);
          
          const permissions = rolePermissions[newProfile.role as keyof typeof rolePermissions] || [];
          setUserPermissions(permissions);
          console.log('✅ [useAuth] User permissions set to:', permissions);
        } else {
          setUserRole(null);
          setUserPermissions([]);
        }
        return;
      }

      console.log('✅ [useAuth] Profile fetched:', profile);
      
      if (profile) {
        setUserRole(profile.role);
        console.log('✅ [useAuth] User role set to:', profile.role);

        // Usar as permissões definidas no UserRoleUtils
        const permissions = rolePermissions[profile.role as keyof typeof rolePermissions] || [];
        setUserPermissions(permissions);
        console.log('✅ [useAuth] User permissions set to:', permissions);
      }
      
    } catch (error) {
      console.error('❌ [useAuth] Error fetching user data:', error);
      setUserRole(null);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 [useAuth] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setUserId(session?.user?.id || null);
        
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserRole(null);
          setUserPermissions([]);
          setLoading(false);
        }
      }
    );

    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('🔄 [useAuth] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setUserId(session?.user?.id || null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Antes de fazer logout, desconectar calendários do Google
      if (user) {
        console.log('🔄 Desconectando calendários do Google antes do logout...');
        
        // 1. Deletar calendários do usuário
        const { error: deleteCalendarsError } = await supabase
          .from('user_calendars')
          .delete()
          .eq('user_id', user.id);

        if (deleteCalendarsError) {
          console.error('⚠️ Erro ao deletar calendários:', deleteCalendarsError);
        } else {
          console.log('✅ Calendários deletados com sucesso');
        }

        // 2. Deletar tokens do Google
        const { error: deleteTokensError } = await supabase
          .from('google_calendar_tokens')
          .delete()
          .eq('user_id', user.id);

        if (deleteTokensError) {
          console.error('⚠️ Erro ao deletar tokens:', deleteTokensError);
        } else {
          console.log('✅ Tokens deletados com sucesso');
        }
      }
    } catch (error) {
      console.error('⚠️ Erro ao desconectar calendários:', error);
      // Não falhar o logout se houver erro na desconexão
    }

    // Fazer logout do Supabase
    await supabase.auth.signOut();
    setUserRole(null);
    setUserPermissions([]);
    
    console.log('✅ Logout concluído com sucesso');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signIn,
      signOut,
      userRole,
      userPermissions,
      userId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
