import React, { useEffect, useState, useMemo } from 'react';
import { fetchUsers, votePlayer, fetchMyVotes, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, CheckCircle, Clock, SkipForward, ArrowRight, Play, Edit2, X } from 'lucide-react';

type SortField = 'Nome' | 'OVR' | 'ATQ' | 'DEF' | 'FIS' | 'PAS' | 'GR' | 'FP' | 'Status';

export const Vote = () => {
  const { token, profile } = useAuth();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, { ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number, fairplay: number }>>({});
  
  const [sortField, setSortField] = useState<SortField>('OVR');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVoteEmail, setCurrentVoteEmail] = useState<string | null>(null);
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);

  // Formulário Modal
  const [ataque, setAtaque] = useState<number>(50);
  const [defesa, setDefesa] = useState(50);
  const [fisico, setFisico] = useState(50);
  const [passe, setPasse] = useState(50);
  const [guardaRedes, setGuardaRedes] = useState(50);
  const [fairplay, setFairplay] = useState(50);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data);
    });
    if (token) {
      fetchMyVotes(token).then(setMyVotes);
    }
  }, [profile, token]);

  // Preencher form quando o currentVoteEmail muda
  useEffect(() => {
    if (currentVoteEmail && myVotes[currentVoteEmail]) {
      const v = myVotes[currentVoteEmail];
      setAtaque(v.ataque); setDefesa(v.defesa); setFisico(v.fisico);
      setPasse(v.passe); setGuardaRedes(v.guardaRedes); setFairplay(v.fairplay);
    } else {
      setAtaque(50); setDefesa(50); setFisico(50); setPasse(50); setGuardaRedes(50); setFairplay(50);
    }
  }, [currentVoteEmail, myVotes]);

  const calculateOvr = (u: UserStats) => {
    const total = (u.Ataque || 50) + (u.Defesa || 50) + (u.Fisico || 50) + (u.Passe || 50);
    return Math.round(total / 4);
  };

  const sortedUsers = useMemo(() => {
    const mapField = (field: string): string => {
      const map: Record<string, string> = { 'ATQ': 'Ataque', 'DEF': 'Defesa', 'FIS': 'Fisico', 'PAS': 'Passe', 'GR': 'Guarda_Redes', 'FP': 'Fairplay' };
      return map[field] || field;
    };

    const sorted = [...users].sort((a, b) => {
      let valA: any = a[mapField(sortField) as keyof UserStats] || 0;
      let valB: any = b[mapField(sortField) as keyof UserStats] || 0;

      if (sortField === 'OVR') {
        valA = calculateOvr(a); valB = calculateOvr(b);
      } else if (sortField === 'Status') {
        valA = myVotes[a.Email] ? 1 : 0;
        valB = myVotes[b.Email] ? 1 : 0;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
    return sorted;
  }, [users, sortField, sortOrder, myVotes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const openModalFor = (email: string) => {
    setCurrentVoteEmail(email);
    setPendingQueue([]);
    setMessage(null);
    setIsModalOpen(true);
  };

  const startBatchVoting = () => {
    const pendings = users.filter(u => !myVotes[u.Email] && u.Email !== profile?.email).map(u => u.Email);
    if (pendings.length === 0) {
      alert("Já votaste em todos os jogadores disponíveis!");
      return;
    }
    setPendingQueue(pendings);
    setCurrentVoteEmail(pendings[0]);
    setMessage(null);
    setIsModalOpen(true);
  };

  const advanceQueue = () => {
    if (pendingQueue.length > 1) {
      const newQueue = pendingQueue.slice(1);
      setPendingQueue(newQueue);
      setCurrentVoteEmail(newQueue[0]);
      setMessage(null);
    } else {
      setPendingQueue([]);
      setIsModalOpen(false);
    }
  };

  const handleSkip = () => {
    advanceQueue();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVoteEmail) return;
    
    setLoading(true);
    setMessage(null);
    const res = await votePlayer(token!, currentVoteEmail, ataque, defesa, fisico, passe, guardaRedes, fairplay);
    setLoading(false);
    
    if (res.success) {
      setMyVotes(prev => ({
        ...prev,
        [currentVoteEmail]: { ataque, defesa, fisico, passe, guardaRedes, fairplay }
      }));
      
      // Atualizar estatísticas globalmente
      fetchUsers().then(data => setUsers(data));
      
      if (pendingQueue.length > 0) {
        advanceQueue();
      } else {
        setMessage({ type: 'success', text: 'Voto submetido com sucesso!' });
        setTimeout(() => setIsModalOpen(false), 1500);
      }
    } else {
      if (res.error?.includes("token") || res.error?.includes("login")) {
         setMessage({ type: 'error', text: 'Sessão expirada. Recarrega a página.' });
      } else {
         setMessage({ type: 'error', text: res.error || 'Erro ao submeter voto.' });
      }
    }
  };

  const currentTargetUser = users.find(u => u.Email === currentVoteEmail);

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Jogadores</h1>
        <button 
          onClick={startBatchVoting}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Play size={16} />
          Avaliar Pendentes
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th onClick={() => handleSort('Nome')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  Jogador {sortField === 'Nome' && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                </div>
              </th>
              {['Status', 'OVR', 'ATQ', 'DEF', 'FIS', 'PAS', 'GR', 'FP'].map((col) => (
                <th 
                  key={col} 
                  onClick={() => handleSort(col as SortField)}
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {col}
                    {sortField === col && (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                  </div>
                </th>
              ))}
              <th style={{ padding: '1rem', textAlign: 'right' }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(u => {
              const hasVoted = !!myVotes[u.Email];
              return (
                <tr key={u.Email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {u.Avatar ? (
                      <img src={u.Avatar} alt={u.Nome} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {u.Nome.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontWeight: 600 }}>{u.Nome}</span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {hasVoted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                        <CheckCircle size={14} /> Votado
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#facc15', fontSize: '0.8rem', background: 'rgba(250, 204, 21, 0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                        <Clock size={14} /> Pendente
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{calculateOvr(u)}</td>
                  <td style={{ padding: '1rem' }}>{u.Ataque || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.Defesa || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.Fisico || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.Passe || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.Guarda_Redes || '-'}</td>
                  <td style={{ padding: '1rem' }}>{u.Fairplay || '-'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {u.Email === profile?.email ? (
                      <span style={{ padding: '0.5rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tu</span>
                    ) : (
                      <button 
                        onClick={() => openModalFor(u.Email)}
                        style={{ 
                          background: hasVoted ? 'rgba(255,255,255,0.1)' : 'var(--primary)', 
                          color: hasVoted ? 'var(--text-main)' : '#000',
                          border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                        }}
                      >
                        {hasVoted ? <Edit2 size={14} /> : <Play size={14} />}
                        {hasVoted ? 'Editar' : 'Avaliar'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {sortedUsers.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Sem jogadores disponíveis.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentTargetUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {currentTargetUser.Avatar ? (
                <img src={currentTargetUser.Avatar} alt={currentTargetUser.Nome} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {currentTargetUser.Nome.charAt(0)}
                </div>
              )}
              <div>
                <h2 style={{ margin: 0 }}>Avaliar {currentTargetUser.Nome}</h2>
                {pendingQueue.length > 0 && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)' }}>Faltam avaliar {pendingQueue.length} jogadores</p>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Ataque (Remate, Posição Ofensiva)', val: ataque, set: setAtaque },
                { label: 'Defesa (Corte, Posição Defensiva)', val: defesa, set: setDefesa },
                { label: 'Físico (Resistência, Força)', val: fisico, set: setFisico },
                { label: 'Passe (Visão de Jogo, Precisão)', val: passe, set: setPasse },
                { label: 'Guarda-Redes (Reflexos)', val: guardaRedes, set: setGuardaRedes },
                { label: 'Fairplay (Atitude)', val: fairplay, set: setFairplay },
              ].map(attr => (
                <div key={attr.label} style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>{attr.label}</label>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{attr.val}</span>
                  </div>
                  <input 
                    type="range" min="1" max="99" 
                    value={attr.val} 
                    onChange={(e) => attr.set(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                  />
                </div>
              ))}

              {message && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', background: message.type === 'success' ? 'rgba(0, 210, 106, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)', fontSize: '0.9rem' }}>
                  {message.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {pendingQueue.length > 0 && (
                  <button type="button" onClick={handleSkip} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <SkipForward size={16} /> Saltar
                  </button>
                )}
                <button type="submit" className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                  {loading ? 'A Gravar...' : (pendingQueue.length > 1 ? <>Próximo <ArrowRight size={16}/></> : 'Concluir Votação')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
