import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckSquare, PlusCircle, Calendar, LogOut } from 'lucide-react';
import logoUrl from '../assets/tikitasco.png';

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const isActive = (path: string) => location.pathname === path ? 'var(--primary)' : 'var(--text-muted)';

  return (
    <nav style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            <img src={logoUrl} alt="TikiTasco Logo" style={{ height: '48px', width: 'auto' }} />
            <div>Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span></div>
          </Link>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/'), fontWeight: 500 }}>
              <Trophy size={18} /> Leaderboard
            </Link>
            <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/history'), fontWeight: 500 }}>
              <Calendar size={18} /> Histórico
            </Link>
            <Link to="/vote" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/vote'), fontWeight: 500 }}>
              <CheckSquare size={18} /> Votar
            </Link>
            <Link to="/register-game" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isActive('/register-game'), fontWeight: 500 }}>
              <PlusCircle size={18} /> Registar Jogo
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {profile.picture && <img src={profile.picture} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile.name}</span>
          </div>
          <button onClick={logout} title="Sair" style={{ display: 'flex', alignItems: 'center', color: 'var(--danger)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};
