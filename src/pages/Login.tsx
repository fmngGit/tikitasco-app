import { GoogleLogin } from '@react-oauth/google';
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
          style={{ width: '88px', height: '88px', borderRadius: '20px', margin: '0 auto 1.25rem', boxShadow: '0 8px 25px rgba(245, 158, 11, 0.25)' }} 
        />
        
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.5px' }}>
          Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Futebol, golos e resenha entre amigos
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <GoogleLogin
            onSuccess={credentialResponse => {
              if (credentialResponse.credential) {
                login(credentialResponse.credential);
              }
            }}
            onError={() => {
              // Login silencioso em caso de erro
            }}
            theme="filled_black"
            shape="pill"
            size="large"
            text="signin_with"
          />
        </div>
        
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          🔒 Acesso seguro reservado ao grupo TikiTasco
        </p>
      </div>
    </div>
  );
};

