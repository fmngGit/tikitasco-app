import React from 'react';
import type { UserStats } from '../services/api';

interface PlayerCardProps {
  player: UserStats;
  rank?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  // Determine card tier based on overall
  let tierColor = '#c0c0c0'; // Silver by default
  if (player.Overall >= 85) tierColor = '#ffdf00'; // Gold
  else if (player.Overall < 70) tierColor = '#cd7f32'; // Bronze

  return (
    <div style={{
      width: '240px',
      background: `linear-gradient(145deg, var(--bg-card) 0%, rgba(0,0,0,0.8) 100%)`,
      border: `2px solid ${tierColor}`,
      borderRadius: '16px',
      padding: '1.5rem',
      position: 'relative',
      boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px ${tierColor}22`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      color: 'var(--text-main)',
      transition: 'transform 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {rank && (
        <div style={{
          position: 'absolute', top: '-15px', left: '-15px',
          background: 'var(--primary)', color: '#000',
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,210,106,0.4)'
        }}>
          #{rank}
        </div>
      )}

      <div style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: tierColor, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
        {player.Overall || '?'}
      </div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--text-muted)' }}>
        OVR
      </div>

      <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: `3px solid ${tierColor}`, marginBottom: '1rem', backgroundColor: '#000' }}>
        {player.Avatar ? (
          <img src={player.Avatar} alt={player.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
            {player.Nome.charAt(0)}
          </div>
        )}
      </div>

      <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
        {player.Nome.split(' ')[0]}
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: '0.5rem', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Ataque || '-'}</span> <span>ATQ</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Defesa || '-'}</span> <span>DEF</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Fisico || '-'}</span> <span>FIS</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Passe || '-'}</span> <span>PAS</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Guarda_Redes || '-'}</span> <span>GR</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700 }}>{player.Fairplay || '-'}</span> <span>FP</span>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {player.TotalVotos} Votos
      </div>
    </div>
  );
};
