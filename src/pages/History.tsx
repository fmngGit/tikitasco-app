import { useEffect, useState } from 'react';
import { fetchGames, fetchUsers, type GameStats, type UserStats } from '../services/api';
import { Calendar } from 'lucide-react';

export const History = () => {
  const [games, setGames] = useState<GameStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchGames(), fetchUsers()]).then(([gamesData, usersData]) => {
      setGames(gamesData);
      setUsers(usersData);
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
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '2rem' }}>Histórico de Jogos</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>A carregar histórico...</div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Ainda não há jogos registados.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {games.map(game => (
            <div key={game.GameID} className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <Calendar size={16} />
                {new Date(game.Data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              
              <div className="game-result-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Equipa A</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{game.Resultado_A}</div>
                  {renderTeam(game.Equipa_A)}
                </div>
                
                <div className="vs-text" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 1rem' }}>X</div>
                
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>Equipa B</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{game.Resultado_B}</div>
                  {renderTeam(game.Equipa_B)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
