import { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { registerUser, fetchUsers } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface UserProfile {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  token: string | null;
  profile: UserProfile | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  updateProfileState: (updated: Partial<UserProfile>) => void;
}

// Verifica se o token JWT do Google ainda é válido (não expirou)
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    // Margem de segurança de 30 segundos
    if (decoded.exp && decoded.exp * 1000 <= Date.now() + 30000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  profile: null,
  login: async () => {},
  logout: () => {},
  updateProfileState: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('tiki_token');
    if (!saved || !isTokenValid(saved)) {
      localStorage.removeItem('tiki_token');
      localStorage.removeItem('tiki_profile');
      return null;
    }
    return saved;
  });

  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const savedToken = localStorage.getItem('tiki_token');
    if (!savedToken || !isTokenValid(savedToken)) {
      return null;
    }
    const savedProfile = localStorage.getItem('tiki_profile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });

  const updateProfileState = (updated: Partial<UserProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('tiki_profile', JSON.stringify(next));
      return next;
    });
  };

  const logout = () => {
    googleLogout();
    setToken(null);
    setProfile(null);
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_profile');
  };

  // Sincronizar nome personalizado e avatar da base de dados se existirem
  useEffect(() => {
    if (token && profile?.email) {
      fetchUsers().then(users => {
        const u = users.find(x => x.Email === profile.email);
        if (u) {
          const updates: Partial<UserProfile> = {};
          if (u.Nome && u.Nome !== profile.name) updates.name = u.Nome;
          if (u.Avatar && u.Avatar !== profile.picture) updates.picture = u.Avatar;
          if (Object.keys(updates).length > 0) {
            updateProfileState(updates);
          }
        }
      }).catch(() => {});
    }
  }, [token, profile?.email]);

  // Verificar periodicamente e quando a janela ganha foco se o token expirou
  useEffect(() => {
    const verifyToken = () => {
      if (token && !isTokenValid(token)) {
        logout();
      }
    };

    const interval = setInterval(verifyToken, 30000);
    window.addEventListener('focus', verifyToken);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', verifyToken);
    };
  }, [token]);

  const login = async (credential: string) => {
    const decoded: any = jwtDecode(credential);
    const userProfile = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture
    };
    
    setToken(credential);
    setProfile(userProfile);
    localStorage.setItem('tiki_token', credential);
    localStorage.setItem('tiki_profile', JSON.stringify(userProfile));

    // Registo ou atualização de perfil no Apps Script
    await registerUser(credential);
    
    // Sincronizar com nome e avatar guardados no banco
    try {
      const users = await fetchUsers(true);
      const u = users.find(x => x.Email === userProfile.email);
      if (u) {
        if (u.Nome) userProfile.name = u.Nome;
        if (u.Avatar) userProfile.picture = u.Avatar;
        setProfile({ ...userProfile });
        localStorage.setItem('tiki_profile', JSON.stringify(userProfile));
      }
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ token, profile, login, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

