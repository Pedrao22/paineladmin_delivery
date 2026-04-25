import React, { useState, useEffect } from 'react';
import {
  Filter, History, User, Building2, Clock, ChevronRight,
  Info, Activity, X, Calendar, Globe, Database, Search,
  RefreshCw
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const ACTION_STYLES = {
  create:      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  update:      'bg-sky-500/10 text-sky-400 border border-sky-500/20',
  delete:      'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  impersonate: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  login:       'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  logout:      'bg-slate-500/10 text-slate-400 border border-slate-500/20',
};

const getActionStyle = (action) => {
  const act = (action || '').toLowerCase();
  for (const [key, cls] of Object.entries(ACTION_STYLES)) {
    if (act.includes(key)) return cls;
  }
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
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

const AuditHistory = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({
    page: 1, limit: 15,
    acao: '', restauranteId: '',
    dataInicio: '', dataFim: ''
  });
  const [total, setTotal] = useState(0);
  const [detailLog, setDetailLog] = useState(null);

  useEffect(() => {
    apiFetch('/restaurants?limit=100').then(res => {
      const list = res?.success ? (res.data?.data || res.data) : (Array.isArray(res) ? res : []);
      setRestaurants(list || []);
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
      if (res?.data) {
        setLogs(res.data);
        setTotal(res.total || res.data.length);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantName = (id) => {
    if (!id) return 'Global';
    const r = restaurants.find(r => r.id === id);
    return r?.nome || id.slice(0, 8) + '…';
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 15, acao: '', restauranteId: '', dataInicio: '', dataFim: '' });
  };

  const hasFilters = filters.acao || filters.restauranteId || filters.dataInicio || filters.dataFim;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Detail Modal */}
      {detailLog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}
          onClick={() => setDetailLog(null)}
        >
          <div
            style={{
              width: '100%', maxWidth: '680px', maxHeight: '85vh',
              background: '#1e293b', borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '22px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Detalhes do Evento</h3>
                <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                  {detailLog.id?.slice(0, 20)}…
                </p>
              </div>
              <button onClick={() => setDetailLog(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '22px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { icon: <Calendar size={13} />, label: 'Data/Hora', value: new Date(detailLog.criado_em).toLocaleString('pt-BR') },
                  { icon: <User size={13} />, label: 'Administrador', value: detailLog.usuarios?.nome || 'Sistema' },
                  { icon: <Globe size={13} />, label: 'E-mail', value: detailLog.usuarios?.email || '—' },
                  { icon: <Activity size={13} />, label: 'Ação', value: detailLog.acao },
                  { icon: <Database size={13} />, label: 'Entidade', value: detailLog.entidade },
                  { icon: <Building2 size={13} />, label: 'Restaurante', value: getRestaurantName(detailLog.restaurante_id) },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>
                      {icon} {label}
                    </div>
                    <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>

              {detailLog.dados_anteriores && (
                <div>
                  <p style={{ color: '#f87171', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Dados Anteriores</p>
                  <pre style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '12px', color: '#fca5a5', fontSize: '0.75rem', overflow: 'auto', maxHeight: '140px', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {formatJSON(detailLog.dados_anteriores)}
                  </pre>
                </div>
              )}

              {detailLog.dados_novos && (
                <div>
                  <p style={{ color: '#34d399', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Dados Novos</p>
                  <pre style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', padding: '12px', color: '#6ee7b7', fontSize: '0.75rem', overflow: 'auto', maxHeight: '140px', margin: 0, whiteSpace: 'pre-wrap' }}>
                    {formatJSON(detailLog.dados_novos)}
                  </pre>
                </div>
              )}

              {(detailLog.ip || detailLog.user_agent) && (
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px' }}>
                  <p style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Metadados</p>
                  {detailLog.ip && <p style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', margin: '0 0 3px 0' }}>IP: {detailLog.ip}</p>}
                  {detailLog.user_agent && <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0, wordBreak: 'break-all' }}>{detailLog.user_agent}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total de Eventos</p>
              <h3 className="text-xl font-bold text-white tabular-nums">{total}</h3>
            </div>
          </div>
        </div>
        <div className="stats-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Página atual</p>
              <h3 className="text-xl font-bold text-white">{filters.page}</h3>
            </div>
          </div>
        </div>
        <div className="stats-card col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <History size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Exibindo</p>
              <h3 className="text-xl font-bold text-white">
                {logs.length} <span className="text-sm text-slate-500 font-normal">de {total} registros</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="glass-card overflow-hidden">
        {/* Filtros */}
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Ação */}
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filters.acao}
                onChange={e => setFilters({ ...filters, acao: e.target.value, page: 1 })}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 cursor-pointer hover:bg-white/8 transition-all"
              >
                <option value="">Todos os eventos</option>
                <option value="create">Criações</option>
                <option value="update">Alterações</option>
                <option value="delete">Exclusões</option>
                <option value="impersonate">Suporte</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            {/* Restaurante */}
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <select
                value={filters.restauranteId}
                onChange={e => setFilters({ ...filters, restauranteId: e.target.value, page: 1 })}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 cursor-pointer hover:bg-white/8 transition-all max-w-[180px]"
              >
                <option value="">Todos restaurantes</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>

            {/* Data início */}
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="date"
                value={filters.dataInicio}
                onChange={e => setFilters({ ...filters, dataInicio: e.target.value, page: 1 })}
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            {/* Data fim */}
            <input
              type="date"
              value={filters.dataFim}
              onChange={e => setFilters({ ...filters, dataFim: e.target.value, page: 1 })}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
              style={{ colorScheme: 'dark' }}
              placeholder="até"
            />

            {/* Actions */}
            <div className="ml-auto flex items-center gap-2">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={fetchLogs}
                className="p-2 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-all"
                title="Atualizar"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-[0.12em] font-black">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Agente</th>
                <th className="px-6 py-4">Evento</th>
                <th className="px-6 py-4">Entidade</th>
                <th className="px-6 py-4">Restaurante</th>
                <th className="px-6 py-4 text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw size={24} className="animate-spin text-purple-400" />
                      <p className="text-slate-500 text-sm animate-pulse">Sincronizando registros...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500 text-sm italic">
                    Nenhum registro para os filtros selecionados.
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.025] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-slate-200 font-medium tabular-nums">
                        {new Date(log.criado_em).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {new Date(log.criado_em).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 border border-white/8 shrink-0">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-100 font-semibold leading-tight">{log.usuarios?.nome || 'Sistema'}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{log.usuarios?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase ${getActionStyle(log.acao)}`}>
                      {log.acao}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300 font-medium capitalize flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-slate-600" />
                      {log.entidade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={12} className="text-slate-600 shrink-0" />
                      <span className={`text-xs font-medium ${log.restaurante_id ? 'text-slate-300' : 'text-slate-500 italic'}`}>
                        {getRestaurantName(log.restaurante_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-purple-500 transition-all"
                      onClick={() => setDetailLog(log)}
                    >
                      <Info size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Página <span className="text-slate-300 font-bold">{filters.page}</span> · {' '}
            <span className="text-slate-300 font-bold">{total}</span> eventos totais
          </p>
          <div className="flex gap-2">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 disabled:opacity-25 disabled:pointer-events-none transition-all"
            >
              Anterior
            </button>
            <button
              disabled={logs.length < filters.limit}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 shadow-lg shadow-purple-500/20 disabled:opacity-25 disabled:pointer-events-none transition-all"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditHistory;
