import React, { useState, useEffect } from 'react';
import {
  History, User, Building2, Clock, Info, Activity, X,
  Calendar, Database, RefreshCw, Filter, Plus, Pencil,
  Trash2, LogIn, LogOut, Eye, Zap, ChevronLeft, ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const ACTION_META = {
  create:      { label: 'Criação',       color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', Icon: Plus },
  update:      { label: 'Alteração',     color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  border: 'rgba(56,189,248,0.25)', Icon: Pencil },
  delete:      { label: 'Exclusão',      color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', Icon: Trash2 },
  impersonate: { label: 'Suporte',       color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.3)', Icon: Eye },
  login:       { label: 'Login',         color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)', Icon: LogIn },
  logout:      { label: 'Logout',        color: '#94a3b8', bg: 'rgba(148,163,184,0.08)',border: 'rgba(148,163,184,0.2)', Icon: LogOut },
};

const getActionMeta = (action) => {
  const act = (action || '').toLowerCase();
  for (const [key, meta] of Object.entries(ACTION_META)) {
    if (act.includes(key)) return meta;
  }
  return { label: action, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', Icon: Activity };
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
};

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444'];
const getAvatarColor = (str) => {
  if (!str) return AVATAR_COLORS[0];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ontem';
  if (d < 7) return `há ${d} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR');
};

const formatJSON = (val) => {
  if (!val) return '—';
  try {
    const obj = typeof val === 'string' ? JSON.parse(val) : val;
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(val);
  }
};

const STAT_BG = {
  purple: { icon: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)', color: '#c084fc' },
  emerald:{ icon: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', color: '#34d399' },
  sky:    { icon: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.3)', color: '#38bdf8' },
  rose:   { icon: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.3)', color: '#f87171' },
};

function StatCard({ icon: Icon, label, value, theme }) {
  const t = STAT_BG[theme];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: t.icon, border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={t.color} />
      </div>
      <div>
        <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{label}</p>
        <p style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800, margin: '2px 0 0 0', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

const AuditHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ page: 1, limit: 15, acao: '', restauranteId: '', dataInicio: '', dataFim: '' });
  const [total, setTotal] = useState(0);
  const [detailLog, setDetailLog] = useState(null);
  const [actionCounts, setActionCounts] = useState({ creates: 0, updates: 0, deletes: 0 });

  useEffect(() => {
    apiFetch('/restaurants?limit=100').then(res => {
      const raw = res?.data?.data ?? res?.data ?? res;
      setRestaurants(Array.isArray(raw) ? raw : []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchLogs(); }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: filters.page, limit: filters.limit });
      if (filters.acao) params.append('acao', filters.acao);
      if (filters.restauranteId) params.append('restaurante_id', filters.restauranteId);
      if (filters.dataInicio) params.append('data_inicio', filters.dataInicio);
      if (filters.dataFim) params.append('data_fim', filters.dataFim + 'T23:59:59');
      const res = await apiFetch(`/audit?${params}`);
      const payload = res?.data ?? res;
      const list = Array.isArray(payload?.data) ? payload.data : [];
      const count = payload?.total ?? list.length;
      setLogs(list);
      setTotal(count);
      setActionCounts({
        creates: list.filter(l => (l.acao||'').toLowerCase().includes('create')).length,
        updates: list.filter(l => (l.acao||'').toLowerCase().includes('update')).length,
        deletes: list.filter(l => (l.acao||'').toLowerCase().includes('delete')).length,
      });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantName = (id) => {
    if (!id) return 'Global';
    const r = restaurants.find(r => r.id === id);
    return r?.nome || id.slice(0, 8) + '…';
  };

  const clearFilters = () => setFilters({ page: 1, limit: 15, acao: '', restauranteId: '', dataInicio: '', dataFim: '' });
  const hasFilters = filters.acao || filters.restauranteId || filters.dataInicio || filters.dataFim;
  const totalPages = Math.ceil(total / filters.limit);

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, padding: '9px 14px', color: '#e2e8f0', fontSize: '0.83rem',
    outline: 'none', colorScheme: 'dark', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Detail Modal ── */}
      {detailLog && (
        <div
          onClick={() => setDetailLog(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2,6,23,0.88)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 680, maxHeight: '88vh',
              background: '#0f1729', borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Modal header */}
            <div style={{
              padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {(() => {
                  const m = getActionMeta(detailLog.acao);
                  const Icon = m.Icon;
                  return (
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={18} color={m.color} />
                    </div>
                  );
                })()}
                <div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>Detalhes do Evento</h3>
                  <p style={{ color: '#475569', fontSize: '0.72rem', margin: '3px 0 0 0', fontFamily: 'monospace' }}>
                    {detailLog.id?.slice(0, 24)}…
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailLog(null)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', borderRadius: 10, padding: 8, cursor: 'pointer', display: 'flex', transition: 'all 0.15s' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { icon: <Clock size={12} />, label: 'Data/Hora', value: new Date(detailLog.criado_em).toLocaleString('pt-BR') },
                  { icon: <User size={12} />, label: 'Administrador', value: detailLog.usuarios?.nome || 'Sistema' },
                  { icon: <Activity size={12} />, label: 'Ação', value: detailLog.acao },
                  { icon: <Database size={12} />, label: 'Entidade', value: detailLog.entidade },
                  { icon: <Building2 size={12} />, label: 'Restaurante', value: getRestaurantName(detailLog.restaurante_id) },
                  { icon: <ShieldCheck size={12} />, label: 'E-mail', value: detailLog.usuarios?.email || '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                      {icon} {label}
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '0.83rem', fontWeight: 600, wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Diff */}
              {detailLog.dados_anteriores && (
                <div>
                  <p style={{ color: '#f87171', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /> Antes
                  </p>
                  <pre style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '13px 15px', color: '#fca5a5', fontSize: '0.74rem', overflow: 'auto', maxHeight: 150, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {formatJSON(detailLog.dados_anteriores)}
                  </pre>
                </div>
              )}
              {detailLog.dados_novos && (
                <div>
                  <p style={{ color: '#34d399', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} /> Depois
                  </p>
                  <pre style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12, padding: '13px 15px', color: '#6ee7b7', fontSize: '0.74rem', overflow: 'auto', maxHeight: 150, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {formatJSON(detailLog.dados_novos)}
                  </pre>
                </div>
              )}

              {/* Meta */}
              {(detailLog.ip || detailLog.user_agent) && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 15px' }}>
                  <p style={{ color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Metadados</p>
                  {detailLog.ip && <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace', margin: '0 0 3px 0' }}>IP: {detailLog.ip}</p>}
                  {detailLog.user_agent && <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0, wordBreak: 'break-all', lineHeight: 1.5 }}>{detailLog.user_agent}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={24} color="#a78bfa" /> Logs de Auditoria
          </h2>
          <p style={{ color: '#475569', fontSize: '0.82rem', margin: '5px 0 0 0' }}>
            Rastreamento completo de ações no ecossistema
          </p>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            borderRadius: 12, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)',
            color: '#c084fc', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon={Activity} label="Total de eventos" value={total} theme="purple" />
        <StatCard icon={Plus}     label="Criações (pág.)"  value={actionCounts.creates} theme="emerald" />
        <StatCard icon={Pencil}   label="Alterações (pág.)"value={actionCounts.updates} theme="sky" />
        <StatCard icon={Trash2}   label="Exclusões (pág.)" value={actionCounts.deletes} theme="rose" />
      </div>

      {/* ── Main card ── */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, overflow: 'hidden' }}>

        {/* Filtros */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#475569', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
            <Filter size={13} /> Filtros
          </div>

          <select value={filters.acao} onChange={e => setFilters({ ...filters, acao: e.target.value, page: 1 })} style={inputStyle}>
            <option value="">Todos os eventos</option>
            <option value="create">Criações</option>
            <option value="update">Alterações</option>
            <option value="delete">Exclusões</option>
            <option value="impersonate">Suporte</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>

          <select value={filters.restauranteId} onChange={e => setFilters({ ...filters, restauranteId: e.target.value, page: 1 })} style={{ ...inputStyle, maxWidth: 180 }}>
            <option value="">Todos os restaurantes</option>
            {(Array.isArray(restaurants) ? restaurants : []).map(r => (
              <option key={r.id} value={r.id}>{r.nome}</option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} color="#475569" />
            <input type="date" value={filters.dataInicio} onChange={e => setFilters({ ...filters, dataInicio: e.target.value, page: 1 })} style={inputStyle} />
            <span style={{ color: '#475569', fontSize: '0.75rem' }}>até</span>
            <input type="date" value={filters.dataFim} onChange={e => setFilters({ ...filters, dataFim: e.target.value, page: 1 })} style={inputStyle} />
          </div>

          {hasFilters && (
            <button onClick={clearFilters} style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Tabela */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Quando', 'Agente', 'Ação', 'Entidade', 'Restaurante', ''].map(h => (
                  <th key={h} style={{ padding: '13px 20px', textAlign: h === '' ? 'right' : 'left', color: '#334155', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(168,85,247,0.2)', borderTopColor: '#a855f7', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>Carregando registros...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <History size={32} color="#1e293b" />
                      <p style={{ color: '#334155', fontSize: '0.85rem', margin: 0 }}>Nenhum registro encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (Array.isArray(logs) ? logs : []).map((log) => {
                const meta = getActionMeta(log.acao);
                const Icon = meta.Icon;
                const avatarColor = getAvatarColor(log.usuarios?.nome);
                return (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Quando */}
                    <td style={{ padding: '14px 20px', borderLeft: `3px solid ${meta.color}` }}>
                      <p style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                        {relativeTime(log.criado_em)}
                      </p>
                      <p style={{ color: '#334155', fontSize: '0.7rem', fontFamily: 'monospace', margin: '2px 0 0 0' }}>
                        {new Date(log.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Agente */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                          background: `${avatarColor}22`, border: `1px solid ${avatarColor}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: avatarColor, fontSize: '0.7rem', fontWeight: 800,
                        }}>
                          {getInitials(log.usuarios?.nome)}
                        </div>
                        <div>
                          <p style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                            {log.usuarios?.nome || 'Sistema'}
                          </p>
                          <p style={{ color: '#334155', fontSize: '0.68rem', margin: '2px 0 0 0', fontFamily: 'monospace' }}>
                            {log.usuarios?.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Ação */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 11px', borderRadius: 20,
                        background: meta.bg, border: `1px solid ${meta.border}`,
                        color: meta.color, fontSize: '0.7rem', fontWeight: 800,
                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>
                        <Icon size={11} />
                        {meta.label}
                      </span>
                    </td>

                    {/* Entidade */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
                      }}>
                        <Database size={11} color="#475569" />
                        {log.entidade || '—'}
                      </span>
                    </td>

                    {/* Restaurante */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={12} color="#334155" />
                        <span style={{ color: log.restaurante_id ? '#94a3b8' : '#334155', fontSize: '0.78rem', fontStyle: log.restaurante_id ? 'normal' : 'italic' }}>
                          {getRestaurantName(log.restaurante_id)}
                        </span>
                      </div>
                    </td>

                    {/* Ação */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setDetailLog(log)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '7px 13px', borderRadius: 10,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                          color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168,85,247,0.12)'; e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                      >
                        <Info size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <p style={{ color: '#334155', fontSize: '0.78rem', margin: 0 }}>
            Página <span style={{ color: '#94a3b8', fontWeight: 700 }}>{filters.page}</span> de <span style={{ color: '#94a3b8', fontWeight: 700 }}>{totalPages || 1}</span>
            {' · '}<span style={{ color: '#475569' }}>{total} eventos</span>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748b', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                opacity: filters.page === 1 ? 0.3 : 1, pointerEvents: filters.page === 1 ? 'none' : 'auto',
              }}
            >
              <ChevronLeft size={14} /> Anterior
            </button>
            <button
              disabled={logs.length < filters.limit}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                border: 'none', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(168,85,247,0.3)',
                opacity: logs.length < filters.limit ? 0.3 : 1,
                pointerEvents: logs.length < filters.limit ? 'none' : 'auto',
              }}
            >
              Próximo <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditHistory;
