import React from 'react';
import { Plus, Trophy, Trash2 } from 'lucide-react';
import type { UserStats } from '../../services/api';

interface KingOfTheCourtFormProps {
  users: UserStats[];
  reiEquipaA: string[];
  reiEquipaB: string[];
  reiEquipaC: string[];
  handleReiPlayerToggle: (email: string, team: 'A' | 'B' | 'C') => void;
  reiMiniGames: Array<{
    teamAKey: 'A' | 'B' | 'C';
    teamBKey: 'A' | 'B' | 'C';
    resA: number;
    resB: number;
  }>;
  setReiMiniGames: React.Dispatch<React.SetStateAction<Array<{
    teamAKey: 'A' | 'B' | 'C';
    teamBKey: 'A' | 'B' | 'C';
    resA: number;
    resB: number;
  }>>>;
  setShowAddGuest: (show: boolean) => void;
  addNextReiMiniGame: () => void;
}

export const KingOfTheCourtForm: React.FC<KingOfTheCourtFormProps> = ({
  users,
  reiEquipaA,
  reiEquipaB,
  reiEquipaC,
  handleReiPlayerToggle,
  reiMiniGames,
  setReiMiniGames,
  setShowAddGuest,
  addNextReiMiniGame
}) => {
  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        Forma 3 equipas. A equipa que ganha o mini-jogo mantém-se em campo como Rei, a que perde sai, e a que está de fora entra!
      </p>

      {/* Roster das 3 Equipas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        {(['A', 'B', 'C'] as const).map(teamKey => {
          const teamColor = teamKey === 'A' ? 'var(--primary)' : teamKey === 'B' ? 'var(--danger)' : '#3b82f6';
          const teamRoster = teamKey === 'A' ? reiEquipaA : teamKey === 'B' ? reiEquipaB : reiEquipaC;

          return (
            <div key={teamKey} style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', border: `1px solid ${teamColor}33` }}>
              <h4 style={{ color: teamColor, marginBottom: '0.75rem' }}>Equipa {teamKey} ({teamRoster.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
                {users.map(u => (
                  <label key={teamKey + u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={teamRoster.includes(u.Email)} 
                      onChange={() => handleReiPlayerToggle(u.Email, teamKey)} 
                      style={{ width: 'auto' }} 
                    />
                    {u.Nome} {u.IsGuest && '👻'}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Adicionar Convidado por baixo das 3 equipas */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button
          type="button"
          onClick={() => setShowAddGuest(true)}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: '1px dashed rgba(245, 158, 11, 0.5)',
            background: 'rgba(245, 158, 11, 0.06)'
          }}
        >
          <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado à Lista
        </button>
      </div>

      {/* Mini-Jogos da Sessão */}
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Trophy size={18} style={{ color: 'var(--primary)' }} /> Mini-Jogos Realizados ({reiMiniGames.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {reiMiniGames.map((mini, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '1rem'
          }}>
            <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem', minWidth: '32px' }}>#{idx + 1}</span>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: mini.teamAKey === 'A' ? 'var(--primary)' : mini.teamAKey === 'B' ? 'var(--danger)' : '#3b82f6', fontSize: '0.95rem' }}>
                Equipa {mini.teamAKey}
              </span>
              <input 
                type="number" min="0" value={mini.resA} 
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setReiMiniGames(prev => {
                    const c = [...prev];
                    c[idx].resA = val;
                    return c;
                  });
                }} 
                className="score-input-sm"
                style={{
                  border: `1.5px solid ${mini.teamAKey === 'A' ? 'rgba(245, 158, 11, 0.6)' : mini.teamAKey === 'B' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff'
                }}
              />
            </div>

            <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>–</span>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem' }}>
              <input 
                type="number" min="0" value={mini.resB} 
                onChange={e => {
                  const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                  setReiMiniGames(prev => {
                    const c = [...prev];
                    c[idx].resB = val;
                    return c;
                  });
                }} 
                className="score-input-sm"
                style={{
                  border: `1.5px solid ${mini.teamBKey === 'A' ? 'rgba(245, 158, 11, 0.6)' : mini.teamBKey === 'B' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff'
                }}
              />
              <span style={{ fontWeight: 700, color: mini.teamBKey === 'A' ? 'var(--primary)' : mini.teamBKey === 'B' ? 'var(--danger)' : '#3b82f6', fontSize: '0.95rem' }}>
                Equipa {mini.teamBKey}
              </span>
            </div>

            {idx === reiMiniGames.length - 1 && idx > 0 ? (
              <button 
                type="button" 
                onClick={() => setReiMiniGames(prev => prev.slice(0, -1))}
                style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                title="Remover este mini-jogo"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div style={{ width: '24px' }} />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addNextReiMiniGame}
        className="btn-secondary"
        style={{ width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
      >
        <Plus size={16} /> Adicionar Próximo Mini-Jogo (Vencedor fica em campo)
      </button>
    </div>
  );
};
