import React, { useEffect, useState } from 'react';
import { fetchUsers, registerGame, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const RegisterGame = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserStats[]>([]);
  
  const [equipaA, setEquipaA] = useState<string[]>([]);
  const [equipaB, setEquipaB] = useState<string[]>([]);
  const [resA, setResA] = useState<number>(0);
  const [resB, setResB] = useState<number>(0);
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchUsers().then(data => setUsers(data));
  }, []);

  const handlePlayerToggle = (email: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (equipaA.includes(email)) setEquipaA(prev => prev.filter(e => e !== email));
      else {
        setEquipaA(prev => [...prev, email]);
        setEquipaB(prev => prev.filter(e => e !== email)); // Remove from B
      }
    } else {
      if (equipaB.includes(email)) setEquipaB(prev => prev.filter(e => e !== email));
      else {
        setEquipaB(prev => [...prev, email]);
        setEquipaA(prev => prev.filter(e => e !== email)); // Remove from A
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (equipaA.length === 0 || equipaB.length === 0) {
      setMessage({ type: 'error', text: 'Ambas as equipas precisam de ter jogadores.' });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    const res = await registerGame(token!, gameDate, resA, resB, equipaA, equipaB);
    setLoading(false);
    
    if (res.success) {
      setMessage({ type: 'success', text: 'Jogo registado! Os pontos foram atualizados na tabela.' });
      setEquipaA([]); setEquipaB([]);
      setResA(0); setResB(0);
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao registar jogo.' });
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Registar Jogo</h1>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Data do Jogo</label>
          <input 
            type="date" 
            value={gameDate} 
            onChange={(e) => setGameDate(e.target.value)} 
            style={{ 
              padding: '0.5rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)', 
              background: 'var(--bg-dark)', 
              color: 'var(--text-main)', 
              fontSize: '1.2rem', 
              textAlign: 'center',
              outline: 'none',
              cursor: 'pointer'
            }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>Golos Equipa A</label>
            <input type="number" min="0" value={resA} onChange={e => setResA(Number(e.target.value))} style={{ fontSize: '2rem', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-muted)' }}>X</div>
          <div>
            <label style={{ display: 'block', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 'bold' }}>Golos Equipa B</label>
            <input type="number" min="0" value={resB} onChange={e => setResB(Number(e.target.value))} style={{ fontSize: '2rem', textAlign: 'center', fontWeight: 'bold' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Equipa A */}
          <div>
            <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem' }}>Equipa A</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.map(u => (
                <label key={'A'+u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: equipaA.includes(u.Email) ? 'rgba(0,210,106,0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <input type="checkbox" checked={equipaA.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'A')} style={{ width: 'auto' }} />
                  {u.Nome}
                </label>
              ))}
            </div>
          </div>
          
          {/* Equipa B */}
          <div>
            <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem' }}>Equipa B</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.map(u => (
                <label key={'B'+u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: equipaB.includes(u.Email) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}>
                  <input type="checkbox" checked={equipaB.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'B')} style={{ width: 'auto' }} />
                  {u.Nome}
                </label>
              ))}
            </div>
          </div>
        </div>

        {message && (
          <div style={{ 
            padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', 
            background: message.type === 'success' ? 'rgba(0, 210, 106, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`
          }}>
            {message.text}
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'A Registar...' : 'Registar Jogo'}
        </button>
      </form>
    </div>
  );
};
