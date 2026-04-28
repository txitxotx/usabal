'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 300));
   if (await login(email, pass)) {
      router.push('/dashboard');
    } else {
      setError('Email o contraseña incorrectos');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1628 0%, #0d2b5e 50%, #0a3d6e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.1)" />
              <path d="M20 8 C14 8 10 14 10 20 C10 26 14 32 20 32 C26 32 30 26 30 20" stroke="#60b3ff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M20 12 C16 12 13 16 13 20 C13 24 16 28 20 28" stroke="#93d0ff" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="20" r="3" fill="#60b3ff" />
              <path d="M24 10 L28 6 M28 10 L32 8" stroke="#60b3ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>Aqua Dashboard</h1>
              <p style={{ color: '#7ab5dd', fontSize: '12px', margin: 0, fontWeight: '400' }}>Gestión de Instalaciones Acuáticas</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px', background: 'rgba(255,255,255,0.97)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f1f3d', marginBottom: '24px' }}>Iniciar sesión</h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email</label>
              <input
                className="input-field"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="usuario@aquadash.com"
                required
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Contraseña</label>
              <input
                className="input-field"
                type="password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="alert-banner alert-danger" style={{ marginBottom: '16px' }}>
                <span>⚠</span> {error}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px' }} type="submit" disabled={loading}>
              {loading ? 'Accediendo...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
