import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUsers, updateProfile, type UserStats } from '../services/api';
import { User, Camera, Save, CheckCircle, AlertCircle, Trophy, Shield, Zap, Sparkles, Award } from 'lucide-react';

export const Profile = () => {
  const { profile, token, updateProfileState } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState<string>(profile?.picture || '');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.email) {
      setName(profile.name || '');
      setAvatar(profile.picture || '');

      fetchUsers().then(users => {
        const u = users.find(x => x.Email === profile.email);
        if (u) {
          setUserStats(u);
          if (u.Nome) setName(u.Nome);
          if (u.Avatar) setAvatar(u.Avatar);
        }
        setStatsLoading(false);
      }).catch(() => setStatsLoading(false));
    }
  }, [profile?.email]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 150;
        canvas.width = size;
        canvas.height = size;

        const scale = Math.max(size / img.width, size / img.height);
        const x = (size / scale - img.width) / 2;
        const y = (size / scale - img.height) / 2;

        ctx?.drawImage(img, x, y, img.width, img.height, 0, 0, img.width * scale, img.height * scale);

        const base64 = canvas.toDataURL('image/jpeg', 0.65);
        setAvatar(base64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Por favor introduz um nome válido.' });
      return;
    }
    if (!token) return;

    setLoading(true);
    setMessage(null);

    const res = await updateProfile(token, {
      name: name.trim(),
      avatar: avatar
    });

    setLoading(false);

    if (res.success) {
      updateProfileState({
        name: name.trim(),
        picture: avatar
      });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso! As alterações já estão ativas em toda a aplicação.' });
      
      // Atualizar também o registo local das stats
      if (userStats) {
        setUserStats(prev => prev ? { ...prev, Nome: name.trim(), Avatar: avatar } : null);
      }
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao atualizar perfil.' });
    }
  };

  if (!profile) return null;

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--primary)',
          padding: '0.65rem',
          borderRadius: '12px'
        }}>
          <User size={26} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>O Meu Perfil</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Personaliza o teu nome de jogador e foto que surgem nas equipas e classificações.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1.75rem' }}>
        {/* Formulário de Edição */}
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem' }}>
          {/* Secção de Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                position: 'relative',
                width: '108px',
                height: '108px',
                borderRadius: '50%',
                padding: '3px',
                background: 'linear-gradient(135deg, var(--primary), rgba(245, 158, 11, 0.2))',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onClick={() => fileInputRef.current?.click()}
              title="Clica para mudar a fotografia"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--bg-card-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--primary)'
                }}>
                  {name.charAt(0) || 'U'}
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                background: 'var(--primary)',
                color: '#000',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                border: '2px solid var(--bg-dark)'
              }}>
                <Camera size={16} />
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: '0.75rem',
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Alterar Foto de Perfil
            </button>
          </div>

          {/* Campos de Dados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem' }}>
                Nome de Jogador:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Fernando Gonçalves"
                required
                maxLength={40}
                style={{
                  fontSize: '1rem',
                  padding: '0.8rem 1rem',
                  background: 'rgba(0, 0, 0, 0.25)'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Este é o nome que vai aparecer nos jogos, convocatórias, votações e histórico.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                Email da Conta Google:
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                style={{
                  opacity: 0.6,
                  cursor: 'not-allowed',
                  background: 'rgba(0, 0, 0, 0.4)',
                  fontSize: '0.95rem'
                }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Identificador permanente associado à tua conta Google.
              </span>
            </div>
          </div>

          {/* Notificação */}
          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              marginTop: '1.5rem',
              background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: message.type === 'success' ? '#22c55e' : 'var(--danger)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              fontSize: '0.9rem'
            }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {message.text}
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              <Save size={18} />
              {loading ? 'A guardar perfil...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>

        {/* Ficha / Resumo de Estatísticas */}
        {userStats && !statsLoading && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={22} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>A Tua Ficha de Jogador</h2>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--primary)'
              }}>
                <Sparkles size={16} /> OVR: {userStats.Overall || '?'}
              </div>
            </div>

            {/* Grelha de Estatísticas Básicas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '0.85rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem 0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>JOGOS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{userStats.Jogos_Jogados}</div>
              </div>
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '1rem 0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#22c55e', marginBottom: '0.2rem' }}>VITÓRIAS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>{userStats.Vitorias}</div>
              </div>
              <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '1rem 0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#facc15', marginBottom: '0.2rem' }}>EMPATES</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#facc15' }}>{userStats.Empates}</div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem 0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginBottom: '0.2rem' }}>DERROTAS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444' }}>{userStats.Derrotas}</div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '1rem 0.75rem', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>PONTOS</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{userStats.Pontos_Totais}</div>
              </div>
            </div>

            {/* Barras de Atributos FIFA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                ATRIBUTOS MÉDIOS AVALIADOS PELOS COLEGAS ({userStats.TotalVotos} {userStats.TotalVotos === 1 ? 'voto' : 'votos'}):
              </div>

              {[
                { label: 'Ataque', val: userStats.Ataque, icon: Zap, color: '#f87171' },
                { label: 'Defesa', val: userStats.Defesa, icon: Shield, color: '#60a5fa' },
                { label: 'Físico', val: userStats.Fisico, icon: Trophy, color: '#facc15' },
                { label: 'Passe', val: userStats.Passe, icon: Sparkles, color: '#a78bfa' },
                { label: 'Guarda-Redes', val: userStats.Guarda_Redes, icon: Shield, color: '#34d399' },
                { label: 'Fairplay', val: userStats.Fairplay, icon: Award, color: '#fb923c' },
              ].map(attr => (
                <div key={attr.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <attr.icon size={14} style={{ color: attr.color }} />
                      <span>{attr.label}</span>
                    </div>
                    <span style={{ color: attr.color, fontWeight: 700 }}>{attr.val || '-'}</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(0, attr.val || 0))}%`,
                      height: '100%',
                      background: attr.color,
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
