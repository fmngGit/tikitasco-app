import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckSquare, PlusCircle, Calendar, Users, UserPlus, Smartphone, Wallet, MapPin, Menu, X } from 'lucide-react';
import { fetchUsers, type UserStats } from '../services/api';
import { ClaimGhostModal } from './ClaimGhostModal';
import { InstallPwaModal } from './InstallPwaModal';
import logoUrl from '../assets/tikitasco.png';

export const Navbar = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [realAvatar, setRealAvatar] = useState<string | null>(null);
  const [ghostUsers, setGhostUsers] = useState<UserStats[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <Link to="/agenda" className={`nav-link ${location.pathname === '/agenda' ? 'active' : ''}`}>
              <Calendar size={16} />
              <span>Agenda</span>
            </Link>
            <Link to="/teams" className={`nav-link ${location.pathname === '/teams' ? 'active' : ''}`}>
              <Users size={16} />
              <span>Equipas</span>
            </Link>
            <Link to="/vote" className={`nav-link ${location.pathname === '/vote' ? 'active' : ''}`} onClick={() => setShowMoreMenu(false)}>
              <CheckSquare size={16} />
              <span>Jogadores</span>
            </Link>
            <Link to="/register-game" className={`nav-link hide-on-mobile ${location.pathname === '/register-game' ? 'active' : ''}`} onClick={() => setShowMoreMenu(false)}>
              <PlusCircle size={16} />
              <span>Registar</span>
            </Link>
            <Link to="/treasury" className={`nav-link hide-on-tablet ${location.pathname === '/treasury' ? 'active' : ''}`} onClick={() => setShowMoreMenu(false)}>
              <Wallet size={16} />
              <span>Caixinha</span>
            </Link>
            <Link to="/campos" className={`nav-link hide-on-tablet ${location.pathname === '/campos' ? 'active' : ''}`} onClick={() => setShowMoreMenu(false)}>
              <MapPin size={16} />
              <span>Campos</span>
            </Link>

            <div 
              className="navbar-more-container" 
              ref={moreMenuRef}
              onMouseEnter={() => window.innerWidth > 980 && setShowMoreMenu(true)}
              onMouseLeave={() => window.innerWidth > 980 && setShowMoreMenu(false)}
            >
              <button 
                type="button"
                className={`nav-link nav-more-btn ${showMoreMenu ? 'active' : ''}`} 
                onClick={(e) => {
                  e.preventDefault();
                  setShowMoreMenu(prev => !prev);
                }}
              >
                {showMoreMenu ? <X size={16} /> : <Menu size={16} />}
                <span>Mais</span>
              </button>

              {showMoreMenu && (
                <div className="navbar-more-dropdown glass-panel">
                  <Link to="/register-game" className="more-dropdown-item show-only-mobile" onClick={() => setShowMoreMenu(false)}>
                    <PlusCircle size={16} />
                    <span>Registar Jogo</span>
                  </Link>
                  <Link to="/treasury" className="more-dropdown-item show-only-tablet" onClick={() => setShowMoreMenu(false)}>
                    <Wallet size={16} />
                    <span>Caixinha</span>
                  </Link>
                  <Link to="/campos" className="more-dropdown-item show-only-tablet" onClick={() => setShowMoreMenu(false)}>
                    <MapPin size={16} />
                    <span>Campos</span>
                  </Link>

                  {ghostUsers.length > 0 && (
                    <button className="more-dropdown-item" onClick={() => { setShowClaimModal(true); setShowMoreMenu(false); }}>
                      <UserPlus size={16} />
                      <span>Reivindicar Jogador Convidado</span>
                    </button>
                  )}

                  {canInstall && (
                    <button className="more-dropdown-item" onClick={() => { handleInstallClick(); setShowMoreMenu(false); }}>
                      <Smartphone size={16} />
                      <span>Instalar App</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>

          <div className="navbar-user-area">
            {/* Movidos para o menu Mais */}

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
