import React, { useEffect, useState } from 'react';
import { fetchUsers, votePlayer, fetchMyVotes, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Vote = () => {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [target, setTarget] = useState<string>('');
  
  const [ataque, setAtaque] = useState<number>(50);
  const [defesa, setDefesa] = useState(50);
  const [fisico, setFisico] = useState(50);
  const [passe, setPasse] = useState(50);
  const [guardaRedes, setGuardaRedes] = useState(50);
  const [fairplay, setFairplay] = useState(50);
  const [myVotes, setMyVotes] = useState<Record<string, { ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number, fairplay: number }>>({});
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchUsers().then(data => {
      // Filter out the current user (Regra de segurança no frontend)
      // O backend também valida isto de forma segura!
      setUsers(data.filter(u => u.Email !== profile?.email));
    });
    if (token) {
      fetchMyVotes(token).then(setMyVotes);
    }
  }, [profile, token]);

  useEffect(() => {
    if (target && myVotes[target]) {
      const v = myVotes[target];
      setAtaque(v.ataque);
      setDefesa(v.defesa);
      setFisico(v.fisico);
      setPasse(v.passe);
      setGuardaRedes(v.guardaRedes);
      setFairplay(v.fairplay);
    } else {
      setAtaque(50); setDefesa(50); setFisico(50); setPasse(50); setGuardaRedes(50); setFairplay(50);
    }
  }, [target, myVotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    
    setLoading(true);
    setMessage(null);
    const success = await votePlayer(token!, target, ataque, defesa, fisico, passe, guardaRedes, fairplay);
    setLoading(false);
    
    if (success) {
      setMessage({ type: 'success', text: 'Voto submetido com sucesso! As médias serão atualizadas.' });
      setMyVotes(prev => ({
        ...prev,
        [target]: { ataque, defesa, fisico, passe, guardaRedes, fairplay }
      }));
      setTarget('');
    } else {
      setMessage({ type: 'error', text: 'Erro ao submeter voto. O Servidor pode estar ocupado.' });
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '600px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Votar</h1>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Escolher Jogador:</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} required>
            <option value="" disabled>Selecione um jogador...</option>
            {users.map(u => (
              <option key={u.Email} value={u.Email}>{u.Nome}</option>
            ))}
          </select>
        </div>

        {[
          { label: 'Ataque (Remate, Posicionamento Ofensivo)', val: ataque, set: setAtaque },
          { label: 'Defesa (Corte, Posicionamento Defensivo)', val: defesa, set: setDefesa },
          { label: 'Físico (Resistência, Força)', val: fisico, set: setFisico },
          { label: 'Passe (Visão de Jogo, Precisão)', val: passe, set: setPasse },
        ].map(attr => (
          <div key={attr.label} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>{attr.label}</label>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{attr.val}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="99" 
              value={attr.val} 
              onChange={(e) => attr.set(Number(e.target.value))} 
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Guarda-Redes (Reflexos, Posicionamento)</label>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{guardaRedes}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="99" 
            value={guardaRedes} 
            onChange={(e) => setGuardaRedes(Number(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <label style={{ fontWeight: 600 }}>Fairplay (Espírito Desportivo, Atitude)</label>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{fairplay}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="99" 
            value={fairplay} 
            onChange={(e) => setFairplay(Number(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem', 
            background: message.type === 'success' ? 'rgba(0, 210, 106, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)',
            border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`
          }}>
            {message.text}
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'A Submeter...' : 'Submeter Votação'}
        </button>
      </form>
    </div>
  );
};
