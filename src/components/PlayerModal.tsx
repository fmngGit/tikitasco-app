import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { UserStats, GameStats } from '../services/api';
import { RadarChart } from './RadarChart';
import { X, Award, UserCheck } from 'lucide-react';

interface PlayerModalProps {
  player: UserStats | null;
  allGames?: GameStats[];
  onClose: () => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, allGames = [], onClose }) => {
  const [activeTab, setActiveTab] = useState<'attributes' | 'history'>('attributes');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!player) return null;

  // Determinar escalão
  let tierColor = '#c0c0c0';
  let tierName = 'Prata';
  if (player.Overall >= 85) {
    tierColor = '#ffdf00';
    tierName = 'Ouro';
  } else if (player.Overall < 70) {
    tierColor = '#cd7f32';
    tierName = 'Bronze';
  }

  const winRate = player.Jogos_Jogados > 0 
    ? Math.round((player.Vitorias / player.Jogos_Jogados) * 100) 
    : 0;

  // Filtrar jogos deste jogador
  const playerGames = allGames.filter(g => 
    (g.Equipa_A && g.Equipa_A.includes(player.Email)) || 
    (g.Equipa_B && g.Equipa_B.includes(player.Email))
  );

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(8px)',
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: `1px solid ${tierColor}44`,
          borderRadius: '20px',
          padding: '2rem',
          position: 'relative',
          boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 30px ${tierColor}15`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        {/* Cabeçalho do Jogador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${tierColor}`,
            backgroundColor: '#000',
            flexShrink: 0
          }}>
            {player.Avatar ? (
              <img src={player.Avatar} alt={player.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: tierColor }}>
                {player.Nome.charAt(0)}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{player.Nome}</h2>
              {player.IsGuest && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: 'var(--warning)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  fontWeight: 600
                }}>
                  Convidado
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: tierColor, fontWeight: 700 }}>
                <Award size={16} /> Escalão {tierName}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserCheck size={16} /> {player.TotalVotos} Avaliações
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.25)', borderRadius: '12px', border: `1px solid ${tierColor}33` }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: tierColor, lineHeight: 1 }}>{player.Overall || '?'}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-muted)' }}>OVR GERAL</div>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{player.Pontos_Totais}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pontos</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{player.Jogos_Jogados}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jogos</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#22c55e' }}>{player.Vitorias}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vitórias</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8' }}>{player.Empates}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empates</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--danger)' }}>{player.Derrotas}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Derrotas</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: winRate >= 50 ? '#22c55e' : 'var(--warning)' }}>{winRate}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aproveitamento</div>
          </div>
        </div>

        {/* Separadores Atributos vs Histórico */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('attributes')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === 'attributes' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'attributes' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Radar de Atributos
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: activeTab === 'history' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Histórico de Jogos ({playerGames.length})
          </button>
        </div>

        {/* Conteúdo da Aba: Atributos */}
        {activeTab === 'attributes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <RadarChart
                ataque={player.Ataque}
                defesa={player.Defesa}
                fisico={player.Fisico}
                passe={player.Passe}
                guardaRedes={player.Guarda_Redes}
                fairplay={player.Fairplay}
                size={280}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { name: 'Ataque', label: 'ATQ', val: player.Ataque },
                { name: 'Defesa', label: 'DEF', val: player.Defesa },
                { name: 'Físico', label: 'FIS', val: player.Fisico },
                { name: 'Passe', label: 'PAS', val: player.Passe },
                { name: 'Guarda-Redes', label: 'GR', val: player.Guarda_Redes },
                { name: 'Fairplay', label: 'FP', val: player.Fairplay },
              ].map(attr => (
                <div key={attr.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{attr.name} ({attr.label})</span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{attr.val || '-'}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${attr.val || 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary), #fbbf24)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Histórico */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {playerGames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Este jogador ainda não tem jogos registados.
              </div>
            ) : (
              playerGames.map((game, i) => {
                const inTeamA = game.Equipa_A && game.Equipa_A.includes(player.Email);
                let outcome = 'Empate';
                let outcomeColor = '#94a3b8';
                let playerGoals = inTeamA ? game.Resultado_A : game.Resultado_B;
                let opponentGoals = inTeamA ? game.Resultado_B : game.Resultado_A;

                if (playerGoals > opponentGoals) {
                  outcome = 'Vitória';
                  outcomeColor = '#22c55e';
                } else if (playerGoals < opponentGoals) {
                  outcome = 'Derrota';
                  outcomeColor = 'var(--danger)';
                }

                return (
                  <div
                    key={game.GameID || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(game.Data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: inTeamA ? 'var(--primary)' : 'var(--danger)', fontWeight: 600 }}>
                        {inTeamA ? 'Equipa A' : 'Equipa B'}
                      </div>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                      {game.Resultado_A} - {game.Resultado_B}
                    </div>

                    <div style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: outcomeColor,
                      background: `${outcomeColor}15`,
                      border: `1px solid ${outcomeColor}33`
                    }}>
                      {outcome}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
