import React from 'react';
import { Plus } from 'lucide-react';
import type { UserStats } from '../../services/api';

interface StandardGameFormProps {
  users: UserStats[];
  equipaA: string[];
  equipaB: string[];
  resA: number;
  resB: number;
  setResA: (val: number) => void;
  setResB: (val: number) => void;
  handlePlayerToggle: (email: string, team: 'A' | 'B') => void;
  setShowAddGuest: (show: boolean) => void;
}

export const StandardGameForm: React.FC<StandardGameFormProps> = ({
  users,
  equipaA,
  equipaB,
  resA,
  resB,
  setResA,
  setResB,
  handlePlayerToggle,
  setShowAddGuest
}) => {
  return (
    <>
      {/* Placar de Golos Centralizado e Compacto */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.75rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Equipa A
          </label>
          <input 
            type="number" 
            min="0" 
            value={resA} 
            onChange={e => setResA(Math.max(0, parseInt(e.target.value, 10) || 0))} 
            className="score-input"
            style={{ 
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid var(--primary)',
              color: 'var(--text-main)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)'
            }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '1.4rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>X</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <label style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Equipa B
          </label>
          <input 
            type="number" 
            min="0" 
            value={resB} 
            onChange={e => setResB(Math.max(0, parseInt(e.target.value, 10) || 0))} 
            className="score-input"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid var(--danger)',
              color: 'var(--text-main)',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)'
            }} 
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
        {/* Equipa A */}
        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
            Equipa A ({equipaA.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
            {users.map(u => (
              <label key={'A' + u.Email} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                background: equipaA.includes(u.Email) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                borderRadius: '8px', cursor: 'pointer', border: equipaA.includes(u.Email) ? '1px solid var(--primary)' : '1px solid transparent'
              }}>
                <input type="checkbox" checked={equipaA.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'A')} style={{ width: 'auto' }} />
                <span>{u.Nome} {u.IsGuest && '👻'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Equipa B */}
        <div>
          <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem', color: 'var(--danger)' }}>
            Equipa B ({equipaB.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
            {users.map(u => (
              <label key={'B' + u.Email} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                background: equipaB.includes(u.Email) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
                borderRadius: '8px', cursor: 'pointer', border: equipaB.includes(u.Email) ? '1px solid var(--danger)' : '1px solid transparent'
              }}>
                <input type="checkbox" checked={equipaB.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'B')} style={{ width: 'auto' }} />
                <span>{u.Nome} {u.IsGuest && '👻'}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Botão Adicionar Convidado por baixo das equipas */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <button
          type="button"
          onClick={() => setShowAddGuest(true)}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            border: '1px dashed rgba(245, 158, 11, 0.5)',
            background: 'rgba(245, 158, 11, 0.06)'
          }}
        >
          <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado à Lista
        </button>
      </div>
    </>
  );
};
