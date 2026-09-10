import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckSquare, PlusCircle, Calendar, LogOut, Users, UserPlus, Smartphone } from 'lucide-react';
import { fetchUsers, updateAvatar, type UserStats } from '../services/api';
import { ClaimGhostModal } from './ClaimGhostModal';
import { InstallPwaModal } from './InstallPwaModal';
import logoUrl from '../assets/tikitasco.png';

export const Navbar = () => {
  const { profile, logout, token } = useAuth();
  const location = useLocation();
  const [realAvatar, setRealAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ghostUsers, setGhostUsers] = useState<UserStats[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isActive = (path: string) => location.pathname === path ? 'var(--primary)' : 'var(--text-muted)';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / scale - img.width) / 2;
        const y = (size / scale - img.height) / 2;
        
        ctx?.drawImage(img, x, y, img.width, img.height, 0, 0, img.width * scale, img.height * scale);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        setRealAvatar(base64);
        
        const res = await updateAvatar(token!, base64);
        if (!res.success) {
           alert("Erro ao gravar imagem: " + res.error);
        }
        setUploading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <nav className="top-nav">
        <div className="container navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <Link className="navbar-logo-area" to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              <img src={logoUrl} alt="TikiTasco Logo" style={{ height: '48px', width: 'auto' }} />
              <div>Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span></div>
            </Link>
            
            <div className="navbar-links-container" style={{ display: 'flex', gap: '1.25rem' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive('/'), fontWeight: 500 }}>
                <Trophy size={18} /> Classificação
              </Link>
              <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive('/history'), fontWeight: 500 }}>
                <Calendar size={18} /> Histórico
              </Link>
              <Link to="/teams" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive('/teams'), fontWeight: 500 }}>
                <Users size={18} /> Equipas
              </Link>
              <Link to="/vote" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive('/vote'), fontWeight: 500 }}>
                <CheckSquare size={18} /> Votar
              </Link>
              <Link to="/register-game" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isActive('/register-game'), fontWeight: 500 }}>
                <PlusCircle size={18} /> Registar
              </Link>
            </div>
          </div>

          <div className="navbar-user-area" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Botão Reivindicar Convidado */}
            {ghostUsers.length > 0 && (
              <button
                onClick={() => setShowClaimModal(true)}
                title="Reivindicar histórico de jogador convidado"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--warning)',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px'
                }}
              >
                <UserPlus size={14} /> Reivindicar Perfil
              </button>
            )}

            {/* Botão Instalar App PWA */}
            {canInstall && (
              <button
                onClick={handleInstallClick}
                title="Instalar TikiTasco no ecrã do telemóvel"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={14} /> Instalar App
              </button>
            )}

            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onClick={() => fileInputRef.current?.click()}
              title="Mudar Foto de Perfil"
            >
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              {realAvatar && <img src={realAvatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', opacity: uploading ? 0.5 : 1 }} />}
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{uploading ? 'A guardar...' : profile.name}</span>
            </div>
            
            <button onClick={logout} title="Sair" style={{ display: 'flex', alignItems: 'center', color: 'var(--danger)', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
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
