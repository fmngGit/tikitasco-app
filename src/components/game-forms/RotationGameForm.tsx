import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import type { UserStats } from '../../services/api';

interface RotationGameFormProps {
  users: UserStats[];
  rotPool: string[];
  setRotPool: React.Dispatch<React.SetStateAction<string[]>>;
  rotRounds: Array<{
    equipaA: string[];
    equipaB: string[];
    banco: string[];
    resA: number;
    resB: number;
  }>;
  setRotRounds: React.Dispatch<React.SetStateAction<Array<{
    equipaA: string[];
    equipaB: string[];
    banco: string[];
    resA: number;
    resB: number;
  }>>>;
  startRotationMode: () => void;
  addNextRotationRound: () => void;
  moveRotationPlayer: (roundIdx: number, email: string, target: 'A' | 'B' | 'banco') => void;
  setShowAddGuest: (show: boolean) => void;
  getUserName: (email: string) => string;
}

export const RotationGameForm: React.FC<RotationGameFormProps> = ({
  users,
  rotPool,
  setRotPool,
  rotRounds,
  setRotRounds,
  startRotationMode,
  addNextRotationRound,
  moveRotationPlayer,
  setShowAddGuest,
  getUserName
}) => {
  return (
    <div>
      {rotRounds.length === 0 ? (
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            Seleciona todos os jogadores que vão rodar durante esta noite (ex: 12 jogadores para 5v5 com 2 a rodar).
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            {users.map(u => (
              <label key={u.Email} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px',
                background: rotPool.includes(u.Email) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', border: rotPool.includes(u.Email) ? '1px solid var(--primary)' : '1px solid var(--border-color)'
              }}>
                <input 
                  type="checkbox" 
                  checked={rotPool.includes(u.Email)} 
                  onChange={() => setRotPool(prev => prev.includes(u.Email) ? prev.filter(e => e !== u.Email) : [...prev, u.Email])} 
                  style={{ width: 'auto' }} 
                />
                <span style={{ fontSize: '0.85rem' }}>{u.Nome} {u.IsGuest && '👻'}</span>
              </label>
            ))}
          </div>

          {/* Ações por baixo do pool de jogadores */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAddGuest(true)}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                padding: '0.65rem 1.2rem',
                borderRadius: '8px',
                border: '1px dashed rgba(245, 158, 11, 0.5)',
                background: 'rgba(245, 158, 11, 0.06)'
              }}
            >
              <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado
            </button>
            <button type="button" onClick={startRotationMode} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              Iniciar Sessão com {rotPool.length} Jogadores
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} style={{ color: 'var(--primary)' }} /> Rondas / Períodos Jogados ({rotRounds.length})
            </h3>
          </div>

          {rotRounds.map((round, rIdx) => (
            <div key={rIdx} style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.05rem' }}>Ronda #{rIdx + 1}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Equipa A</span>
                  <input 
                    type="number" min="0" value={round.resA} 
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setRotRounds(prev => {
                        const c = [...prev]; c[rIdx].resA = val; return c;
                      });
                    }} 
                    className="score-input-sm"
                    style={{
                      width: '52px',
                      height: '40px',
                      fontSize: '1.25rem',
                      border: '1.5px solid rgba(245, 158, 11, 0.5)',
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: '#fff'
                    }}
                  />
                  <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0.15rem' }}>–</span>
                  <input 
                    type="number" min="0" value={round.resB} 
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setRotRounds(prev => {
                        const c = [...prev]; c[rIdx].resB = val; return c;
                      });
                    }} 
                    className="score-input-sm"
                    style={{
                      width: '52px',
                      height: '40px',
                      fontSize: '1.25rem',
                      border: '1.5px solid rgba(239, 68, 68, 0.5)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#fff'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>Equipa B</span>
                </div>
              </div>

              {/* Lineup da Ronda com botões para trocar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Equipa A */}
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Equipa A ({round.equipaA.length})</div>
                  {round.equipaA.map(email => (
                    <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                      <span>{getUserName(email)}</span>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'B')} title="Passar para Equipa B" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(239,68,68,0.2)', borderRadius: '4px' }}>Para B</button>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'banco')} title="Passar para Banco" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Banco</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Equipa B */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Equipa B ({round.equipaB.length})</div>
                  {round.equipaB.map(email => (
                    <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                      <span>{getUserName(email)}</span>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'A')} title="Passar para Equipa A" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(245,158,11,0.2)', borderRadius: '4px' }}>Para A</button>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'banco')} title="Passar para Banco" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Banco</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Banco / Fora */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>No Banco ({round.banco.length})</div>
                  {round.banco.map(email => (
                    <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{getUserName(email)}</span>
                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'A')} style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(245,158,11,0.2)', borderRadius: '4px' }}>Para A</button>
                        <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'B')} style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(239,68,68,0.2)', borderRadius: '4px' }}>Para B</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button
              type="button"
              onClick={addNextRotationRound}
              className="btn-secondary"
              style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} /> Adicionar Próxima Ronda (Mantém equipas)
            </button>
            <button
              type="button"
              onClick={() => setShowAddGuest(true)}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                border: '1px dashed rgba(245, 158, 11, 0.5)',
                background: 'rgba(245, 158, 11, 0.06)'
              }}
            >
              <Plus size={15} style={{ color: 'var(--primary)' }} /> Novo Convidado
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
