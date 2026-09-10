import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckSquare, PlusCircle, Calendar, LogOut, Users, UserPlus, Smartphone } from 'lucide-react';
import { fetchUsers, type UserStats } from '../services/api';
import { ClaimGhostModal } from './ClaimGhostModal';
import { InstallPwaModal } from './InstallPwaModal';
import logoUrl from '../assets/tikitasco.png';

export const Navbar = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const [realAvatar, setRealAvatar] = useState<string | null>(null);
  const [ghostUsers, setGhostUsers] = useState<UserStats[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  useEffect(() => {
    // Verificar se já está a correr como app instalada (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setCanInstall(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choice: any) => {
        if (choice && choice.outcome === 'accepted') {
          setCanInstall(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowIosModal(true);
    }
  };

  const loadUserData = () => {
    if (profile) {
      setRealAvatar(profile.picture);
      fetchUsers().then(users => {
        const u = users.find(x => x.Email === profile.email);
        if (u && u.Avatar) setRealAvatar(u.Avatar);
        
        // Filtrar convidados disponíveis para reivindicação
        const guests = users.filter(x => x.IsGuest);
        setGhostUsers(guests);
      });
    }
  };

  useEffect(() => {
    loadUserData();
  }, [profile]);

  if (!profile) return null;

  return (
    <>
      <nav className="top-nav">
        <div className="container navbar-container">
          <Link className="navbar-logo-area" to="/">
            <img src={logoUrl} alt="TikiTasco Logo" className="navbar-logo-img" />
            <div className="navbar-logo-text">Tiki<span>Tasco</span></div>
          </Link>
          
          <nav className="navbar-links-container">
            <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
              <Trophy size={16} />
              <span>Classificação</span>
            </Link>
            <Link to="/history" className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}>
              <Calendar size={16} />
              <span>Histórico</span>
            </Link>
            <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
              <Users size={16} />
              <span>Equipas</span>
            </Link>
            <Link to="/vote" className={`nav-link ${location.pathname === '/vote' ? 'active' : ''}`}>
              <CheckSquare size={16} />
              <span>Votar</span>
            </Link>
            <Link to="/register-game" className={`nav-link ${location.pathname === '/register-game' ? 'active' : ''}`}>
              <PlusCircle size={16} />
              <span>Registar</span>
            </Link>
          </nav>

          <div className="navbar-user-area">
            {/* Botão Reivindicar Convidado */}
            {ghostUsers.length > 0 && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="nav-action-btn nav-claim-btn"
                title="Reivindicar histórico de jogador convidado"
              >
                <UserPlus size={14} />
                <span className="nav-btn-text">Reivindicar</span>
              </button>
            )}

            {/* Botão Instalar App PWA */}
            {canInstall && (
              <button
                onClick={handleInstallClick}
                className="nav-action-btn nav-install-btn"
                title="Instalar TikiTasco no telemóvel ou computador"
              >
                <Smartphone size={14} />
                <span className="nav-btn-text">Instalar App</span>
              </button>
            )}

            <Link 
              to="/profile"
              className={`navbar-profile-pill ${location.pathname === '/profile' ? 'active' : ''}`}
              title="Personalizar Perfil (Nome e Foto)"
            >
              {realAvatar ? (
                <img src={realAvatar} alt="Avatar" className="navbar-avatar-img" />
              ) : (
                <div className="navbar-avatar-placeholder">{profile.name?.charAt(0) || 'U'}</div>
              )}
              <span className="navbar-profile-name">{profile.name}</span>
            </Link>
            
            <button onClick={logout} className="nav-logout-btn" title="Terminar Sessão">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      {showClaimModal && (
        <ClaimGhostModal
          ghostUsers={ghostUsers}
          onClose={() => setShowClaimModal(false)}
          onClaimSuccess={() => {
            loadUserData();
            window.location.reload();
          }}
        />
      )}

      {showIosModal && (
        <InstallPwaModal onClose={() => setShowIosModal(false)} />
      )}
    </>
  );
};
