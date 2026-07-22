import { createContext, useContext, useState } from 'react';
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

const AuthContext = createContext<AuthContextType>({
  token: null,
  profile: null,
  login: async () => {},
  logout: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('tiki_token'));
  const [profile, setProfile] = useState<UserProfile | null>(
    localStorage.getItem('tiki_profile') ? JSON.parse(localStorage.getItem('tiki_profile')!) : null
  );

  const login = async (credential: string) => {
    // Decode locally to show UI immediately
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

    // Register/update user in GAS
    await registerUser(credential);
  };

  const logout = () => {
    googleLogout();
    setToken(null);
    setProfile(null);
    localStorage.removeItem('tiki_token');
    localStorage.removeItem('tiki_profile');
  };

  return (
    <AuthContext.Provider value={{ token, profile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
