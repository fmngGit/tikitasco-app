import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, createGuestPlayer, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Shuffle, ArrowRight, ShieldCheck, Check, Plus } from 'lucide-react';

export const TeamGenerator = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [teamCount, setTeamCount] = useState<2 | 3>(2);
  const [generatedTeams, setGeneratedTeams] = useState<{ [key: string]: UserStats[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal para criar convidado rápido
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [creatingGuest, setCreatingGuest] = useState(false);

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const togglePlayer = (email: string) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectAll = () => {
    setSelectedEmails(users.map(u => u.Email));
  };

  const clearSelection = () => {
    setSelectedEmails([]);
    setGeneratedTeams(null);
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !token) return;

    setCreatingGuest(true);
    const res = await createGuestPlayer(token, guestName.trim());
    setCreatingGuest(false);

    if (res.success && res.user) {
      setUsers(prev => [...prev, res.user!]);
      setSelectedEmails(prev => [...prev, res.user!.Email]);
      setGuestName('');
      setShowAddGuest(false);
    }
  };

  // Algoritmo de Equilíbrio Inteligente
  const generateBalancedTeams = () => {
    if (selectedEmails.length < teamCount * 2) {
      alert(`Precisas de selecionar pelo menos ${teamCount * 2} jogadores para formar ${teamCount} equipas.`);
      return;
    }

    const pool = users.filter(u => selectedEmails.includes(u.Email));

    // Separar os melhores guarda-redes para distribuir 1 por equipa
    const sortedByGR = [...pool].sort((a, b) => (b.Guarda_Redes || 50) - (a.Guarda_Redes || 50));
    const goalkeepers = sortedByGR.slice(0, teamCount);
    const fieldPlayers = sortedByGR.slice(teamCount);

    // Algoritmo de otimização combinatória: testa várias permutações e escolhe a de menor desvio padrão de OVR
    let bestTeams: UserStats[][] = [];
    let bestDifference = Infinity;

    const iterations = 500;
    for (let it = 0; it < iterations; it++) {
      // Inicializar equipas com 1 guarda-redes cada
      const tempTeams: UserStats[][] = Array.from({ length: teamCount }, (_, i) => [goalkeepers[i]]);
      
      // Baralhar jogadores de campo
      const shuffledField = [...fieldPlayers].sort(() => Math.random() - 0.5);

      // Distribuir de forma serpenteada ou gulosa para balancear OVR
      shuffledField.forEach(player => {
        // Encontrar a equipa com menor OVR total acumulado
        let minTeamIdx = 0;
        let minSum = Infinity;
        tempTeams.forEach((t, idx) => {
          const sum = t.reduce((acc, p) => acc + (p.Overall || 50), 0);
          if (sum < minSum) {
            minSum = sum;
            minTeamIdx = idx;
          }
        });
        tempTeams[minTeamIdx].push(player);
      });

      // Calcular diferença entre a equipa com maior e menor média de OVR
      const averages = tempTeams.map(t => t.reduce((acc, p) => acc + (p.Overall || 50), 0) / t.length);
      const maxAvg = Math.max(...averages);
      const minAvg = Math.min(...averages);
      const diff = maxAvg - minAvg;

      if (diff < bestDifference) {
        bestDifference = diff;
        bestTeams = tempTeams;
      }
    }

    if (teamCount === 2) {
      setGeneratedTeams({
        'Equipa A': bestTeams[0],
        'Equipa B': bestTeams[1]
      });
    } else {
      setGeneratedTeams({
        'Equipa A': bestTeams[0],
        'Equipa B': bestTeams[1],
        'Equipa C': bestTeams[2]
      });
    }
  };

  const transferToRegister = () => {
    if (!generatedTeams) return;
    navigate('/register-game', {
      state: {
        prefilledTeams: {
          equipaA: generatedTeams['Equipa A'].map(p => p.Email),
          equipaB: generatedTeams['Equipa B'].map(p => p.Email),
          equipaC: generatedTeams['Equipa C'] ? generatedTeams['Equipa C'].map(p => p.Email) : [],
          teamCount
        }
      }
    });
  };

  const getTeamAverageOvr = (team: UserStats[]) => {
    if (!team || team.length === 0) return 0;
    const sum = team.reduce((acc, p) => acc + (p.Overall || 50), 0);
    return (sum / team.length).toFixed(1);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users style={{ color: 'var(--primary)' }} /> Gerador de Equipas
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Distribui os jogadores de forma 100% equilibrada com base no OVR e na posição de guarda-redes.
          </p>
        </div>
      </div>

      {/* Controlos de Configuração */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Modalidade:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setTeamCount(2); setGeneratedTeams(null); }}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  background: teamCount === 2 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: teamCount === 2 ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${teamCount === 2 ? 'var(--primary)' : 'var(--border-color)'}`
                }}
              >
                2 Equipas (Padrão)
              </button>
              <button
                type="button"
                onClick={() => { setTeamCount(3); setGeneratedTeams(null); }}
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  background: teamCount === 3 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: teamCount === 3 ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${teamCount === 3 ? 'var(--primary)' : 'var(--border-color)'}`
                }}
              >
                3 Equipas (Rei da Pista)
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Selecionados: <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{selectedEmails.length}</strong>
            </span>
            <button
              onClick={selectAll}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            >
              Todos
            </button>
            <button
              onClick={clearSelection}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--danger)' }}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Lista de Jogadores para Escolha */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>A carregar lista de jogadores...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.5rem',
            maxHeight: '280px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}>
            {users.map(user => {
              const isSelected = selectedEmails.includes(user.Email);
              return (
                <div
                  key={user.Email}
                  onClick={() => togglePlayer(user.Email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.Nome.split(' ')[0]} {user.IsGuest && '👻'}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    {user.Overall || 50}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowAddGuest(true)}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              padding: '0.75rem 1.2rem',
              borderRadius: '8px',
              border: '1px dashed rgba(245, 158, 11, 0.5)',
              background: 'rgba(245, 158, 11, 0.06)'
            }}
          >
            <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado
          </button>
          <button
            onClick={generateBalancedTeams}
            className="btn-primary"
            style={{ minWidth: '240px', padding: '0.85rem 1.5rem' }}
            disabled={selectedEmails.length < teamCount * 2}
          >
            <Shuffle size={18} /> Sortear Equipas Justas
          </button>
        </div>
      </div>

      {/* Resultados do Sorteio */}
      {generatedTeams && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Equipas Geradas</h2>
            <button
              onClick={generateBalancedTeams}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Shuffle size={15} /> Re-sortear
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: teamCount === 2 ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {Object.entries(generatedTeams).map(([teamName, players], idx) => {
              const teamColor = idx === 0 ? 'var(--primary)' : idx === 1 ? 'var(--danger)' : '#3b82f6';
              const avgOvr = getTeamAverageOvr(players);

              return (
                <div
                  key={teamName}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${teamColor}44`,
                    borderRadius: '12px',
                    padding: '1.25rem',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${teamColor}`, paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: teamColor, fontSize: '1.15rem' }}>{teamName}</h3>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: teamColor }}>{avgOvr}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>OVR</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {players.map((player, pIdx) => (
                      <div
                        key={player.Email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.03)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{pIdx + 1}.</span>
                          <span style={{ fontWeight: 600 }}>{player.Nome}</span>
                          {player.IsGuest && <span style={{ fontSize: '0.7rem', color: 'var(--warning)' }}>👻</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {pIdx === 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--primary)' }}>
                              <ShieldCheck size={12} /> GR
                            </span>
                          )}
                          <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{player.Overall || 50}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={transferToRegister}
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
          >
            Usar Estas Equipas no Registo de Jogo <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Modal para adicionar convidado */}
      {showAddGuest && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem'
          }}
          onClick={() => setShowAddGuest(false)}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem' }}>Adicionar Jogador Convidado</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Cria um jogador temporário que ainda não tenha feito login com a conta Google.
            </p>
            <form onSubmit={handleCreateGuest}>
              <input
                type="text"
                placeholder="Nome do Convidado (ex: Pedro)"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                required
                style={{ marginBottom: '1.25rem' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddGuest(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creatingGuest}>
                  {creatingGuest ? 'A criar...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
