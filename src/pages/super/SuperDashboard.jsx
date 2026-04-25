import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, ShoppingBag, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Activity, 
  Store, ShieldCheck, Zap, Loader2
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import './SuperDashboard.css';

const StatCard = ({ title, value, change, icon: Icon, trend, delay, color }) => (
  <div className="super-stat-card fade-in-up" style={{ animationDelay: `${delay}ms` }}>
    <div className="super-stat-header">
      <div className={`super-stat-icon-bg ${color}`}>
        <Icon size={28} />
      </div>
      <div className={`super-stat-trend ${trend}`}>
        {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        <span>{change}</span>
      </div>
    </div>
    <div className="super-stat-info">
      <p className="stat-label">{title}</p>
      <h2 className="stat-value">{value}</h2>
      <div className="stat-progress-bar">
        <div className="progress-fill" style={{ width: '85%', background: `var(--accent-gradient)` }}></div>
      </div>
    </div>
  </div>
);

export default function SuperDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiFetch('/restaurants/stats');
        if (res.success) setStats(res.data);
      } catch (err) {
        console.error('Erro ao carregar stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="super-dashboard-loading">
        <div className="relative w-16 h-16 mb-4">
           <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="animate-pulse">Sincronizando Telemetria Master...</p>
      </div>
    );
  }

  return (
    <div className="super-dashboard-container">
      <header className="super-welcome-header">
        <div className="welcome-text">
          <h1>Central <span className="text-gradient">CEO</span></h1>
          <p>Status global e telemetria financeira da rede Pedi&Recebe</p>
        </div>
        <div className="header-actions">
          <div className="live-indicator">
            <span className="dot"></span>
            REDE ESTÁVEL
          </div>
          <button className="super-btn-primary">
            <Zap size={20} /> Relatório Financeiro
          </button>
        </div>
      </header>

      <div className="super-stats-grid">
        <StatCard 
          title="Ecossistemas Ativos" 
          value={stats?.total || 0} 
          change="+100%" 
          icon={Store} 
          trend="up" 
          delay={100}
          color="indigo"
        />
        <StatCard
          title="MRR (Receita Recorrente)"
          value={stats?.mrr ? `R$ ${Number(stats.mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
          change={stats?.mrr ? '+ativo' : 'configure planos'}
          icon={DollarSign}
          trend="up"
          delay={200}
          color="gold"
        />
        <StatCard
          title="Usuários Cadastrados"
          value={stats?.total_usuarios ?? (stats?.total || 0)}
          change="na rede"
          icon={Users}
          trend="up"
          delay={300}
          color="blue"
        />
        <StatCard 
          title="Saúde do Servidor" 
          value="99.9%" 
          change="UPTIME" 
          icon={ShieldCheck} 
          trend="up" 
          delay={400}
          color="green"
        />
      </div>

      <div className="super-main-grid">
        <section className="glass-section activity-section">
          <div className="section-header">
            <h3><Activity size={22} className="text-emerald-400" /> Eventos do Sistema</h3>
            <span className="pulse-dot"></span>
          </div>
          <div className="activity-feed">
            {stats?.total > 0 ? (
              <div className="activity-item-premium">
                <div className="activity-icon-container">
                  <Zap size={24} />
                </div>
                <div className="activity-content">
                  <p><strong>Nó Matriz</strong> inicializado com estabilidade plena.</p>
                  <span>Módulo: Infraestrutura Automática</span>
                </div>
                <div className="activity-status">Saudável</div>
              </div>
            ) : (
              <div className="activity-item-premium opacity-50">
                 <p>Aguardando tráfego e telemetria da rede principal...</p>
              </div>
            )}
          </div>
        </section>

        <section className="glass-section shortcuts-section">
          <div className="section-header">
            <h3>Central de Ações Rápidas</h3>
          </div>
          <div className="shortcut-grid">
            <div className="shortcut-card group">
              <TrendingUp size={28} className="text-purple-400 group-hover:text-white transition-colors" />
              <span>Análise de Crescimento</span>
            </div>
            <div className="shortcut-card group">
              <ShieldCheck size={28} className="text-emerald-400 group-hover:text-white transition-colors" />
              <span>Painel de Segurança</span>
            </div>
          </div>
          
          <div className="promo-banner-premium mt-8">
            <h4>Ecossistema Protegido</h4>
            <p>Os nós do servidor Pedi&Recebe estão rodando em contêineres otimizados e com backup ativo.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
