import { useEffect, useState } from 'react';
import { fetchGames, fetchUsers, fetchLocations, deleteGame, type GameStats, type UserStats, type Location } from '../services/api';
import { Calendar, Edit, Trash2, ChevronDown, ChevronUp, Download, Clock, Trophy, RefreshCw, List, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PollSection } from '../components/PollSection';

interface GameGroup {
  sessionId?: string;
  sessionType: 'standard' | 'reidapista' | 'rotacao_dinamica';
  date: string;
  games: GameStats[];
  videoDownloadUrl?: string;
  videoExpiryDate?: string;
  locationId?: string;
}

export const History = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState<GameStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Record<string, boolean>>({});

  // Filtros e Ordenação
  const [activeTab, setActiveTab] = useState<'poll' | 'history'>('poll');
  const [sortBy, setSortBy] = useState<'desc' | 'asc'>('desc');
  const [filterLocation, setFilterLocation] = useState<string>('');
  const [filterPlayer, setFilterPlayer] = useState<string>('');

  useEffect(() => {
    Promise.all([fetchGames(), fetchUsers(), fetchLocations()]).then(([gamesData, usersData, locationsData]) => {
      setGames(gamesData);
      setUsers(usersData);
      setLocations(locationsData);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (gameId: string) => {
    if (!window.confirm("Tens a certeza que queres apagar este registo? As estatísticas serão recalculadas de forma absoluta.")) return;
    
    setLoading(true);
    const res = await deleteGame(token!, gameId);
    if (res.success) {
      setGames(prev => prev.filter(g => g.GameID !== gameId));
    } else {
      alert("Erro ao apagar jogo: " + res.error);
    }
    setLoading(false);
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const renderTeam = (teamEmails: string[]) => {
    const sortedEmails = [...teamEmails].sort((a, b) => {
      const nameA = users.find(u => u.Email === a)?.Nome || a;
      const nameB = users.find(u => u.Email === b)?.Nome || b;
      return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.5rem' }}>
        {sortedEmails.map(email => {
          const user = users.find(u => u.Email === email);
          return (
            <div key={email} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user ? user.Nome : email.split('@')[0]}
            </div>
          );
        })}
      </div>
    );
  };

  // Agrupar jogos por SessionID (para Rei da Pista e Rotação Dinâmica) ou por jogo individual
  const groupedSessions = (): GameGroup[] => {
    const groups: GameGroup[] = [];
    const sessionMap: { [key: string]: GameGroup } = {};

    games.forEach(game => {
      if (game.SessionID && game.SessionID !== '') {
        if (!sessionMap[game.SessionID]) {
          sessionMap[game.SessionID] = {
            sessionId: game.SessionID,
            sessionType: game.SessionType || 'reidapista',
            date: game.Data,
            games: [],
            videoDownloadUrl: game.VideoDownloadUrl,
            videoExpiryDate: game.VideoExpiryDate,
            locationId: game.LocationID
          };
          groups.push(sessionMap[game.SessionID]);
        }
        sessionMap[game.SessionID].games.push(game);
        if (game.VideoDownloadUrl && !sessionMap[game.SessionID].videoDownloadUrl) {
          sessionMap[game.SessionID].videoDownloadUrl = game.VideoDownloadUrl;
          sessionMap[game.SessionID].videoExpiryDate = game.VideoExpiryDate;
        }
        if (game.LocationID && !sessionMap[game.SessionID].locationId) {
          sessionMap[game.SessionID].locationId = game.LocationID;
        }
      } else {
        // Jogo individual padrão
        groups.push({
          sessionType: 'standard',
          date: game.Data,
          games: [game],
          videoDownloadUrl: game.VideoDownloadUrl,
          videoExpiryDate: game.VideoExpiryDate,
          locationId: game.LocationID
        });
      }
    });

    return groups;
  };

  const getVideoBadge = (downloadUrl?: string, expiryDate?: string) => {
    if (!downloadUrl) return null;

    if (downloadUrl === 'EXPIRED') {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
          <Clock size={14} /> Vídeo expirado (30 dias)
        </span>
      );
    }

    let daysLeft = 30;
    if (expiryDate) {
      const diff = new Date(expiryDate).getTime() - new Date().getTime();
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    if (daysLeft <= 0) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
          <Clock size={14} /> Vídeo expirado
        </span>
      );
    }

    return (
      <a
        href={downloadUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: '#22c55e',
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '4px 10px',
          borderRadius: '6px',
          textDecoration: 'none'
        }}
      >
        <Download size={14} /> Vídeo ({daysLeft}d restantes)
      </a>
    );
  };

  const groups = groupedSessions();

  let filteredGroups = [...groups];

  // Ordenação
  if (sortBy === 'asc') {
    filteredGroups.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else {
    filteredGroups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Filtro de Campo
  if (filterLocation) {
    filteredGroups = filteredGroups.filter(g => g.locationId === filterLocation);
  }

  // Filtro de Jogador
  if (filterPlayer) {
    filteredGroups = filteredGroups.filter(g => {
      return g.games.some(game => 
        game.Equipa_A?.includes(filterPlayer) || game.Equipa_B?.includes(filterPlayer)
      );
    });
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '850px' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px' }}>
        <button
          onClick={() => setActiveTab('poll')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            background: activeTab === 'poll' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'poll' ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'poll' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          <PlayCircle size={18} /> Próximo Jogo
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'history' ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'history' ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          <List size={18} /> Jogos Realizados
        </button>
      </div>

      {activeTab === 'poll' ? (
        <PollSection locations={locations} users={users} />
      ) : (
        <>
          {/* Filtros */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Ordenar por Data</label>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            <option value="desc" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Mais recentes primeiro</option>
            <option value="asc" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Mais antigos primeiro</option>
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Filtrar por Campo</label>
          <select 
            value={filterLocation} 
            onChange={e => setFilterLocation(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Todos os Campos</option>
            {locations.map(loc => (
              <option key={loc.LocationID} value={loc.LocationID} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{loc.Nome}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>Filtrar por Jogador</label>
          <select 
            value={filterPlayer} 
            onChange={e => setFilterPlayer(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Todos os Jogadores</option>
            {[...users].sort((a,b) => a.Nome.localeCompare(b.Nome)).map(user => (
              <option key={user.Email} value={user.Email} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{user.Nome}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>A carregar histórico...</div>
      ) : filteredGroups.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Não foram encontrados jogos com estes filtros.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredGroups.map((group, groupIdx) => {
            const isMultiGame = group.games.length > 1 || group.sessionType !== 'standard';
            const sessionKey = group.sessionId || `single-${groupIdx}`;
            const isExpanded = expandedSessions[sessionKey] !== false; // expandido por defeito
            const locName = locations.find(l => l.LocationID === group.locationId)?.Nome;

            return (
              <div key={sessionKey} className="glass-panel" style={{ padding: '1.5rem' }}>
                {/* Cabeçalho da Sessão ou Jogo */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Calendar size={16} />
                      {new Date(group.date).toLocaleDateString('pt-PT', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>

                    {locName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.85rem', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        📍 {locName}
                      </div>
                    )}

                    {group.sessionType === 'reidapista' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        <Trophy size={12} /> Rei da Pista ({group.games.length} mini-jogos)
                      </span>
                    )}

                    {group.sessionType === 'rotacao_dinamica' && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                        <RefreshCw size={12} /> Rotação Dinâmica ({group.games.length} rondas)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getVideoBadge(group.videoDownloadUrl, group.videoExpiryDate)}

                    {isMultiGame && (
                      <button
                        onClick={() => toggleExpand(sessionKey)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Jogos dentro da Sessão */}
                {(!isMultiGame || isExpanded) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {group.games.map((game, i) => (
                      <div key={game.GameID} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {isMultiGame ? `Mini-Jogo / Ronda #${game.RoundNumber || (i + 1)}` : 'Resultado Final'}
                          </span>

                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                              onClick={() => navigate(`/register-game?edit=${game.GameID}`)} 
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                            >
                              <Edit size={14} /> Editar
                            </button>
                            <button 
                              onClick={() => handleDelete(game.GameID)} 
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                            >
                              <Trash2 size={14} /> Apagar
                            </button>
                          </div>
                        </div>

                        <div className="game-result-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>Equipa A</h4>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{game.Resultado_A}</div>
                            {renderTeam(game.Equipa_A || [])}
                          </div>

                          <div className="vs-text" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 1rem' }}>X</div>

                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <h4 style={{ color: 'var(--danger)', marginBottom: '0.25rem' }}>Equipa B</h4>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{game.Resultado_B}</div>
                            {renderTeam(game.Equipa_B || [])}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
};
