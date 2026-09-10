import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { claimGhostPlayer, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface ClaimGhostModalProps {
  ghostUsers: UserStats[];
  onClose: () => void;
  onClaimSuccess: () => void;
}

export const ClaimGhostModal: React.FC<ClaimGhostModalProps> = ({ ghostUsers, onClose, onClaimSuccess }) => {
  const { token, profile } = useAuth();
  const [selectedGhost, setSelectedGhost] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGhost || !token) return;

    setLoading(true);
    setMessage(null);

    const res = await claimGhostPlayer(token, selectedGhost);
    setLoading(false);

    if (res.success) {
      setMessage({ type: 'success', text: res.message || 'Perfil de convidado associado com sucesso!' });
      setTimeout(() => {
        onClaimSuccess();
        onClose();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao associar perfil.' });
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: '2rem',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--primary)',
            padding: '0.75rem',
            borderRadius: '12px'
          }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Reivindicar Perfil de Convidado</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Jogaste antes de teres conta no TikiTasco?
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Se foste adicionado como jogador convidado por um colega, seleciona o teu nome abaixo. Todas as tuas vitórias, derrotas, pontos e avaliações serão transferidos diretamente para a tua conta Google oficial (<strong>{profile?.email}</strong>).
        </p>

        {ghostUsers.length === 0 ? (
          <div style={{
            padding: '1.5rem',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem'
          }}>
            Não há perfis de convidado pendentes de momento.
          </div>
        ) : (
          <form onSubmit={handleClaim}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Escolhe o teu perfil de convidado:
              </label>
              <select
                value={selectedGhost}
                onChange={e => setSelectedGhost(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)'
                }}
              >
                <option value="" disabled>Seleciona o teu nome...</option>
                {[...ghostUsers].sort((a, b) => (a.Nome || '').localeCompare(b.Nome || '', 'pt', { sensitivity: 'base' })).map(u => (
                  <option key={u.Email} value={u.Email}>
                    {u.Nome} ({u.Jogos_Jogados} jogos • {u.Pontos_Totais} pts)
                  </option>
                ))}
              </select>
            </div>

            {message && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: message.type === 'success' ? '#22c55e' : 'var(--danger)',
                border: `1px solid ${message.type === 'success' ? '#22c55e' : 'var(--danger)'}`,
                fontSize: '0.9rem'
              }}>
                {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading || !selectedGhost}
            >
              {loading ? 'A transferir histórico...' : 'Reivindicar e Fundir Histórico'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
