import React from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import iconUrl from '../assets/tikitasco.png';

interface InstallPwaModalProps {
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.25rem',
        backdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '1.75rem',
          textAlign: 'center',
          position: 'relative',
          borderRadius: '16px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <img
          src={iconUrl}
          alt="TikiTasco"
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            margin: '0 auto 1rem',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
          }}
        />

        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Instalar TikiTasco no iPhone / iPad
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Instala a aplicação no teu ecrã para abrir em ecrã completo sem barras de navegação:
        </p>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <Share size={20} />
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
              <strong>Passo 1:</strong> Toca no botão de <strong>Partilha</strong> na barra inferior do Safari.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '0.5rem', borderRadius: '8px', display: 'flex' }}>
              <PlusSquare size={20} />
            </div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.3 }}>
              <strong>Passo 2:</strong> Desliza para baixo e seleciona <strong>"Adicionar ao Ecrã Principal"</strong>.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-primary"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
