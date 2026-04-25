import React, { useState } from 'react';
import { ShieldAlert, Lock, CheckCircle, ArrowRight, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, apiFetch } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import './SuperLoginPage.css';

export default function SuperPasswordReset() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.');
    if (newPassword !== confirmPassword) return setError('As senhas não coincidem.');

    setLoading(true);
    setError(null);

    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (authError) throw authError;

      // 2. Limpa o marcador de reset (no nosso caso, o avatar_url)
      await apiFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ avatar_url: null })
      });

      // Refresh profile so forcarTrocaSenha is cleared in context
      if (typeof refreshProfile === 'function') await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);

    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="super-login-container solar-night-bg">
        <div className="glass-card reset-card text-center animate-fadeIn">
          <div className="success-icon-container">
            <CheckCircle size={48} className="text-success" />
          </div>
          <h1 className="text-gradient">Acesso Seguro!</h1>
          <p>Sua nova senha estratégica foi configurada com sucesso. Redirecionando para o cockpit...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="super-login-container solar-night-bg">
      <div className="aurora-glow"></div>
      
      <div className="glass-card login-card animate-fadeInUp">
        <div className="super-login-header">
          <div className="super-logo-premium">
            <Zap size={32} className="logo-spark" />
            <div className="logo-text">
              Pedi&Recebe <span>SUPERADMIN</span>
            </div>
          </div>
          <p className="reset-alert-badge">TROCA DE SENHA OBRIGATÓRIA</p>
          <h2>Defina sua Identidade</h2>
          <p className="subtitle">Como CEO, sua segurança é a nossa maior prioridade.</p>
        </div>

        <form onSubmit={handleReset} className="super-login-form">
          {error && (
            <div className="super-error-alert">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group-premium">
            <label>Nova Senha Estratégica</label>
            <div className="input-wrapper-premium">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group-premium">
            <label>Confirmação da Senha</label>
            <div className="input-wrapper-premium">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="super-action-btn-premium" 
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Ativar Acesso Total
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
