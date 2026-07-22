import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const { login } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Tiki<span style={{ color: 'var(--primary)' }}>Tasco</span></h1>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
          />
        </div>
      </div>
    </div>
  );
};
