import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      localStorage.setItem('kms_token', data.token);
      localStorage.setItem('kms_user', JSON.stringify(data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="neumorphic-card" style={{ width: '100%', maxWidth: '400px', padding: '48px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div className="neumorphic-card" style={{ padding: '16px', borderRadius: '50%', marginBottom: '16px', color: '#0d9488' }}>
            <Activity size={32} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#134e4a', textAlign: 'center' }}>
            KMS Digital
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Masuk untuk mengelola data</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="neumorphic-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ahligizi@mock.com"
            />
          </div>
          <div>
            <label className="form-label">Kata Sandi</label>
            <input
              type="password"
              className="neumorphic-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="mockpassword"
            />
          </div>
          <button 
            type="submit" 
            className="neumorphic-button primary" 
            style={{ marginTop: '16px', padding: '14px', display: 'flex', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
