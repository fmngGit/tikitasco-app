import { createContext, useContext, useState, useEffect } from 'react';
import { googleLogout } from '@react-oauth/google';
import { registerUser } from '../services/api';
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
  logout: () => {}
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

  const logout = () => {
    googleLogout();
    setToken(null);
    setProfile(null);
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_profile');
  };

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
  };

  return (
    <AuthContext.Provider value={{ token, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

