import { useEffect, useState } from 'react';
import { fetchUsers, fetchGames, type UserStats, type GameStats } from '../services/api';
import { PlayerCard } from '../components/PlayerCard';
import { Calendar } from 'lucide-react';

export const Leaderboard = () => {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [latestGame, setLatestGame] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchGames()]).then(([userData, gameData]) => {
      const sorted = userData.sort((a, b) => {
        if (b.Pontos_Totais !== a.Pontos_Totais) return b.Pontos_Totais - a.Pontos_Totais;
        if (b.Vitorias !== a.Vitorias) return b.Vitorias - a.Vitorias;
        return a.Jogos_Jogados - b.Jogos_Jogados;
      });
      setUsers(sorted);
      if (gameData.length > 0) {
        setLatestGame(gameData[0]); // Mais recente (já vem invertido do backend)
      }
      setLoading(false);
    });
  }, []);

  const renderTeam = (teamEmails: string[]) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '1rem' }}>
        {teamEmails.map(email => {
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

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Classificação</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>A carregar dados do Apps Script...</div>
      ) : (
        <>
          {latestGame && (
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Último Jogo</h3>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <Calendar size={16} />
                  {new Date(latestGame.Data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="game-result-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Equipa A</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{latestGame.Resultado_A}</div>
                    {renderTeam(latestGame.Equipa_A)}
                  </div>
                  <div className="vs-text" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 1rem' }}>X</div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Equipa B</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 900 }}>{latestGame.Resultado_B}</div>
                    {renderTeam(latestGame.Equipa_B)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '4rem', justifyContent: 'center' }}>
            {/* Top 3 Players Cards */}
            {users.slice(0, 3).map((user, idx) => (
              <PlayerCard key={user.Email} player={user} rank={idx + 1} />
            ))}
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto', padding: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem' }}>Pos</th>
                  <th style={{ padding: '1rem' }}>Nome</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Pts</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>V</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>E</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>D</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Jogos</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>OVR</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.Email} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {user.Avatar && <img src={user.Avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />}
                      {user.Nome}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{user.Pontos_Totais}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{user.Vitorias}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{user.Empates}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{user.Derrotas}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{user.Jogos_Jogados}</td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{user.Overall}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
