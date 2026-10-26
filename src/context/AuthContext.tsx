import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { ensureUserExists } from '../services/api';

interface UserProfile {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  token: string | null;
  profile: UserProfile | null;
  login: () => Promise<void>;
  logout: () => void;
  updateProfileState: (updated: Partial<UserProfile>) => void;
  needsSetup: boolean;
  completeSetup: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  profile: null,
  login: async () => {},
  logout: () => {},
  updateProfileState: () => {},
  needsSetup: false,
  completeSetup: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);

  useEffect(() => {
    const handleSession = (session: any) => {
      if (session?.user) {
        setToken(session.access_token);
        const userMetadata = session.user.user_metadata || {};
        
        // Perfil preliminar para interface imediata
        setProfile(prev => prev || {
          email: session.user.email || '',
          name: userMetadata.full_name || userMetadata.name || session.user.email || 'User',
          picture: userMetadata.avatar_url || userMetadata.picture || ''
        });

        // Garantir criação e sincronização com public.users e group_members
        ensureUserExists(session.user).then(dbProfile => {
          if (dbProfile) {
            setProfile(dbProfile);
          }
        }).catch(err => {
          console.error("Erro na sincronização do utilizador com o Supabase:", err);
        });
      } else {
        setToken(null);
        setProfile(null);
      }
    };

    // Verificar sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // Escutar alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateProfileState = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      return { ...prev, ...updated };
    });
  };

  const login = async () => {
    // Initiate Google OAuth login
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) console.error("Login error:", error);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setToken(null);
    setProfile(null);
    setNeedsSetup(false);
  };

  const completeSetup = () => {
    setNeedsSetup(false);
  };

  return (
    <AuthContext.Provider value={{ token, profile, login, logout, updateProfileState, needsSetup, completeSetup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
