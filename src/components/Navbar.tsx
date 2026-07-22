import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, CheckSquare, PlusCircle, Calendar, LogOut } from 'lucide-react';
import { fetchUsers, updateAvatar } from '../services/api';
import logoUrl from '../assets/tikitasco.png';

export const Navbar = () => {
  const { profile, logout, token } = useAuth();
  const location = useLocation();
  const [realAvatar, setRealAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setRealAvatar(profile.picture);
      fetchUsers().then(users => {
        const u = users.find(x => x.Email === profile.email);
        if (u && u.Avatar) setRealAvatar(u.Avatar);
      });
    }
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
        if (location.pathname === '/') window.location.reload();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };


  return (
    <nav className="top-nav">
      <div className="container navbar-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link className="navbar-logo-area" to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            <img src={logoUrl} alt="TikiTasco Logo" style={{ height: '48px', width: 'auto' }} />
            <div>Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span></div>
          </Link>
          
          <div className="navbar-links-container" style={{ display: 'flex', gap: '1.5rem' }}>
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

        <div className="navbar-user-area" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
  );
};
