import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store, DollarSign, Users, ShieldCheck,
  Activity, BarChart2, FileText, Settings,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import './SuperDashboard.css';

const NAV_ITEMS = [
  { icon: Store,     color: '#6366f1', bg: 'rgba(99,102,241,0.14)',  label: 'Restaurantes',     sub: 'Gerenciar rede',    path: '/restaurantes' },
  { icon: BarChart2, color: '#10b981', bg: 'rgba(16,185,129,0.14)',  label: 'Logs de Auditoria',sub: 'Rastrear ações',    path: '/audit' },
  { icon: FileText,  color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',  label: 'Planos',           sub: 'Preços e recursos', path: '/planos' },
  { icon: Settings,  color: '#38bdf8', bg: 'rgba(56,189,248,0.14)',  label: 'Configurações',    sub: 'Ajustes globais',   path: '/config' },
];

export default function SuperDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch('/restaurants/stats')
      .then(res => { if (res?.success) setStats(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="sdb-loading">
        <div className="sdb-spinner" />
        <p>Carregando telemetria...</p>
      </div>
    );
  }

  const total    = stats?.total    ?? 0;
  const ativos   = stats?.ativos   ?? 0;
  const inativos = stats?.inativos ?? 0;
  const suspensos= stats?.suspensos?? 0;
  const usuarios = stats?.total_usuarios ?? 0;
  const mrr      = stats?.mrr ?? 0;

  const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

  const STATS = [
    {
      icon: Store,       cls: 'blue',
      label: 'Total na rede', value: total,
      sub: 'estabelecimentos cadastrados',
      sg: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.07), transparent 65%)',
    },
    {
      icon: CheckCircle2, cls: 'green',
      label: 'Ativos',   value: ativos,
      sub: `${pct(ativos)}% da rede operando`,
      sg: 'radial-gradient(ellipse at top left, rgba(34,197,94,0.07), transparent 65%)',
    },
    {
      icon: DollarSign,  cls: 'gold',
      label: 'MRR',
      value: mrr > 0
        ? `R$ ${Number(mrr).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : '—',
      sub: 'receita recorrente mensal',
      sg: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.07), transparent 65%)',
    },
    {
      icon: Users,       cls: 'indigo',
      label: 'Usuários', value: usuarios,
      sub: 'admins ativos na rede',
      sg: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.07), transparent 65%)',
    },
  ];

  return (
    <div className="sdb-container">

      {/* Header */}
      <div className="sdb-header">
        <div className="sdb-header-left">
          <h1>Visão <span>Geral</span></h1>
          <p>Telemetria e status global da rede Pedi&amp;Recebe</p>
        </div>
        <div className="sdb-live">
          <span className="sdb-live-dot" />
          REDE ESTÁVEL
        </div>
      </div>

      {/* Stats */}
      <div className="sdb-stats">
        {STATS.map(({ icon: Icon, cls, label, value, sub, sg }) => (
          <div key={label} className="sdb-stat" style={{ '--sg': sg }}>
            <div className={`sdb-stat-icon ${cls}`}><Icon size={19} /></div>
            <p className="sdb-stat-label">{label}</p>
            <p className="sdb-stat-value">{value}</p>
            <p className="sdb-stat-sub">{sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="sdb-grid">

        {/* Network breakdown */}
        <div className="sdb-card">
          <div className="sdb-card-head">
            <h3><Activity size={15} color="#6366f1" /> Distribuição da Rede</h3>
          </div>
          <div className="sdb-card-body">
            <div className="sdb-breakdown">
              <div className="sdb-bar-row">
                <div className="sdb-bar-label">
                  <span><CheckCircle2 size={12} color="#4ade80" /> Ativos</span>
                  <span>{ativos}</span>
                </div>
                <div className="sdb-bar-track">
                  <div className="sdb-bar-fill" style={{ width: `${pct(ativos)}%`, background: '#4ade80' }} />
                </div>
              </div>

              <div className="sdb-bar-row">
                <div className="sdb-bar-label">
                  <span><AlertTriangle size={12} color="#fbbf24" /> Inativos</span>
                  <span>{inativos}</span>
                </div>
                <div className="sdb-bar-track">
                  <div className="sdb-bar-fill" style={{ width: `${pct(inativos)}%`, background: '#fbbf24' }} />
                </div>
              </div>

              <div className="sdb-bar-row">
                <div className="sdb-bar-label">
                  <span><XCircle size={12} color="#f87171" /> Suspensos</span>
                  <span>{suspensos}</span>
                </div>
                <div className="sdb-bar-track">
                  <div className="sdb-bar-fill" style={{ width: `${pct(suspensos)}%`, background: '#f87171' }} />
                </div>
              </div>

              <div className="sdb-divider" />

              <div className="sdb-net-total">
                <span>Total cadastrado</span>
                <span>{total}</span>
              </div>
            </div>

            <div className="sdb-status-banner">
              <div className="sdb-status-banner-icon"><ShieldCheck size={17} /></div>
              <div>
                <p>Infraestrutura operacional</p>
                <span>Backend Render · Banco Supabase · Deploy automático</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick nav */}
        <div className="sdb-card">
          <div className="sdb-card-head">
            <h3>Acesso Rápido</h3>
          </div>
          <div className="sdb-card-body">
            <div className="sdb-nav-grid">
              {NAV_ITEMS.map(({ icon: Icon, color, bg, label, sub, path }) => (
                <div key={label} className="sdb-nav-item" onClick={() => navigate(path)}>
                  <div className="sdb-nav-icon" style={{ background: bg, color }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className="sdb-nav-label">{label}</div>
                    <div className="sdb-nav-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
