import { useEffect, useState } from 'react';
import { fetchGames, fetchUsers, fetchExpenses, type GameStats, type UserStats, type Expense } from '../services/api';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { Wallet, Plus, TrendingDown, TrendingUp, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Treasury = () => {
  const { token } = useAuth();
  const [games, setGames] = useState<GameStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [fetchedGames, fetchedUsers, fetchedExpenses] = await Promise.all([
      fetchGames(),
      fetchUsers(),
      fetchExpenses()
    ]);
    setGames(fetchedGames);
    setUsers(fetchedUsers);
    setExpenses(fetchedExpenses);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcular Contribuições por Jogo e por Jogador
  let totalIncome = 0;
  const playerContributions: Record<string, number> = {};

  games.forEach(game => {
    const fee = game.Fee || 0;
    if (fee <= 0) return;

    let playersInGame: string[] = [];
    if (game.SessionType === 'standard') {
      playersInGame = [...(game.Equipa_A || []), ...(game.Equipa_B || [])];
    } else {
      // Para Rei da Pista ou Rotação Dinâmica com sessões agregadas, o ideal era ter os players no GameStats raiz.
      // Neste MVP, assumimos que Equipa_A e Equipa_B do GameStats raiz têm todos os jogadores da sessão se possível,
      // ou teremos de adaptar. Se não tiverem, usamos apenas o que está lá.
      playersInGame = [...(game.Equipa_A || []), ...(game.Equipa_B || [])];
    }

    const uniquePlayers = Array.from(new Set(playersInGame));
    
    uniquePlayers.forEach(email => {
      totalIncome += fee;
      if (!playerContributions[email]) playerContributions[email] = 0;
      playerContributions[email] += fee;
    });
  });

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.Valor, 0);
  const currentBalance = totalIncome - totalExpenses;

  // Ordenar jogadores por contribuição
  const sortedPlayers = [...users]
    .filter(u => playerContributions[u.Email] > 0)
    .sort((a, b) => playerContributions[b.Email] - playerContributions[a.Email]);

  // Ordenar despesas por data (mais recentes primeiro)
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime());

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>A carregar dados da tesouraria...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Wallet style={{ color: 'var(--primary)' }} size={28} />
          Tesouraria / Caixinha
        </h1>
        
        {token && (
          <button 
            className="btn-primary" 
            onClick={() => setShowAddExpense(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
          >
            <Plus size={18} /> Registar Despesa
          </button>
        )}
      </div>

      {/* DASHBOARD SUMMARY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* SALDO ATUAL */}
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '2px solid rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            Saldo Disponível
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: currentBalance >= 0 ? '#10b981' : 'var(--danger)' }}>
            {currentBalance.toFixed(2)}€
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* TOTAL ENTRADAS */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <TrendingUp size={24} style={{ color: '#10b981' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Arrecadado (Taxas)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{totalIncome.toFixed(2)}€</div>
            </div>
          </div>

          {/* TOTAL SAÍDAS */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
              <TrendingDown size={24} style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Despesas</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>{totalExpenses.toFixed(2)}€</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* LISTA DE DESPESAS */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingDown size={18} /> Histórico de Despesas
          </h3>

          {sortedExpenses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>Nenhuma despesa registada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedExpenses.map(exp => (
                <div key={exp.ExpenseID} style={{ 
                  background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', 
                  borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{exp.Descricao}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(exp.Data).toLocaleDateString('pt-PT')}
                      {exp.RegistadoPor && ` • Registo por ${users.find(u => u.Email === exp.RegistadoPor)?.Nome || exp.RegistadoPor.split('@')[0]}`}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--danger)' }}>-{exp.Valor.toFixed(2)}€</span>
                    
                    {exp.FotoUrl && (
                      <a 
                        href={exp.FotoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Ver Fatura/Foto"
                        style={{ 
                          background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '6px', 
                          color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <ImageIcon size={18} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LISTA DE CONTRIBUIÇÕES POR JOGADOR */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} /> Contribuição por Jogador
          </h3>

          {sortedPlayers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>Sem dados de contribuições de jogos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedPlayers.map((player, idx) => (
                <div key={player.Email} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)', padding: '0.85rem 1rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', width: '20px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 600 }}>{player.Nome}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{playerContributions[player.Email].toFixed(2)}€</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddExpense && (
        <AddExpenseModal 
          onClose={() => setShowAddExpense(false)}
          onSuccess={() => {
            setShowAddExpense(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
