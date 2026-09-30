import { useAuth } from '../context/AuthContext';
import logoUrl from '../assets/tikitasco.png';

export const Login = () => {
  const { login } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <img
          src={logoUrl}
          alt="TikiTasco"
          style={{ height: '140px', width: 'auto', objectFit: 'contain', margin: '0 auto 1.25rem', filter: 'drop-shadow(0 8px 15px rgba(245, 158, 11, 0.3))' }}
        />

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.5px' }}>
          Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span>
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', marginTop: '2rem' }}>
          <button 
            onClick={login}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: '#fff',
              color: '#333',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease'
            }}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px', height: '24px' }} />
            Entrar com o Google
          </button>
        </div>

      </div>
    </div>
  );
};
