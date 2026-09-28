import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Leaderboard } from './pages/Leaderboard';
import { History as Agenda } from './pages/History';
import { Vote } from './pages/Vote';
import { RegisterGame } from './pages/RegisterGame';
import { TeamGenerator } from './pages/TeamGenerator';
import { Profile } from './pages/Profile';
import { Treasury } from './pages/Treasury';
import { Locations } from './pages/Locations';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, needsSetup } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // Se precisa de configurar o perfil e não está na página de perfil, redireciona para lá
  if (needsSetup && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }
  
  return <>{children}</>;
};

const LoginRoute = () => {
  const { token } = useAuth();
  const location = useLocation();
  
  if (token) {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }
  
  return <Login />;
};

const AppRoutes = () => {
  const { token, needsSetup } = useAuth();
  
  return (
    <>
      {token && !needsSetup && <Navbar />}
      <main style={{ paddingBottom: '3rem' }}>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          
          <Route path="/" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><TeamGenerator /></ProtectedRoute>} />
          <Route path="/vote" element={<ProtectedRoute><Vote /></ProtectedRoute>} />
          <Route path="/register-game" element={<ProtectedRoute><RegisterGame /></ProtectedRoute>} />
          <Route path="/treasury" element={<ProtectedRoute><Treasury /></ProtectedRoute>} />
          <Route path="/campos" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
