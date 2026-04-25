import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/supabase';
import './SuperLoginPage.css';

export default function SuperLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Acorda o backend silenciosamente ao abrir a página de login
  useEffect(() => {
    fetch(`${API_URL}/auth/me`).catch(() => {});
  }, []);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email.trim(), password.trim());
      if (result?.profileData?.role !== 'super_admin') {
        setError('Acesso negado. Esta área é restrita ao Super Admin.');
        await import('../../lib/supabase').then(m => m.supabase.auth.signOut());
        return;
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err.message?.includes('Invalid login credentials')
          ? 'E-mail ou senha incorretos.'
          : err.message?.includes('demorou')
          ? 'O servidor está acordando (cold start). Aguarde 30s e tente novamente.'
          : `Erro: ${err.message || 'Falha de rede.'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="super-login-container solar-night-bg">
      <div className="aurora-glow"></div>

      <div className="glass-card login-card animate-fadeInUp">
        <div className="super-login-header">
          <div className="super-logo-premium">
            <Zap size={40} className="logo-spark" />
            <div className="logo-text">
              Pedi&Recebe <span>PORTAL DO CEO</span>
            </div>
          </div>
          <h2>Autenticação Global</h2>
          <p className="subtitle">Entre para gerenciar todo o ecossistema estratégico.</p>
        </div>

        <form onSubmit={handleSubmit} className="super-login-form">
          {error && (
            <div className="super-error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group-premium">
            <label htmlFor="email">E-mail Administrativo</label>
            <div className="input-wrapper-premium">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group-premium">
            <label htmlFor="password">Senha de Segurança</label>
            <div className="input-wrapper-premium">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="super-action-btn-premium" disabled={loading}>
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>Sincronizar Central de Comando <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="super-login-footer">
          <p>© 2026 Pedi&Recebe Ecosystem. All rights strictly reserved.</p>
        </div>
      </div>
    </div>
  );
}
