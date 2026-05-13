import { useState, useEffect } from 'react';
import { MessageSquare, Bug, Lightbulb, RefreshCw, Loader2, CheckCircle, XCircle, Archive, ArchiveRestore } from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const TIPO_CONFIG = {
  sugestao: { label: 'Sugestão', icon: <Lightbulb size={13} />, color: '#2E7D32', bg: '#E8F5E9' },
  bug:      { label: 'Bug',      icon: <Bug size={13} />,       color: '#C62828', bg: '#FFEBEE' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const tabStyle = (active) => ({
  padding: '7px 16px',
  borderRadius: 8,
  border: '1px solid',
  fontSize: '0.83rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
  background: active ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.04)',
  borderColor: active ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)',
  color: active ? '#a855f7' : 'var(--text-secondary, #aaa)',
});

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showArquivados, setShowArquivados] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);

  const loadFeedbacks = async (f = filter, p = page, arq = showArquivados) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (f !== 'all') params.append('tipo', f);
      if (arq) params.append('arquivados', 'true');
      const res = await apiFetch(`/restaurants/feedbacks?${params}`);
      if (res?.success) {
        setFeedbacks(res.data?.feedbacks ?? []);
        setTotal(res.data?.total ?? 0);
      }
    } catch (err) {
      console.error('Erro ao carregar feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeedbacks(filter, page, showArquivados); }, [filter, page, showArquivados]); // eslint-disable-line

  const handleFilter = (f) => { setFilter(f); setPage(1); };

  const handleToggleArquivados = (val) => {
    setShowArquivados(val);
    setFilter('all');
    setPage(1);
  };

  const patchFeedback = async (id, body, optimistic) => {
    setActionLoading(id);
    try {
      const res = await apiFetch(`/restaurants/feedbacks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (res?.success) {
        if (optimistic.remove) {
          setFeedbacks(prev => prev.filter(fb => fb.id !== id));
          setTotal(t => Math.max(0, t - 1));
        } else {
          setFeedbacks(prev => prev.map(fb => fb.id === id ? { ...fb, ...optimistic } : fb));
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar feedback:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolve = (id, resolvido) =>
    patchFeedback(id, { resolvido }, { resolvido, respondido_em: new Date().toISOString() });

  const handleArquivar = (id) =>
    patchFeedback(id, { arquivado: true }, { remove: true });

  const handleDesarquivar = (id) =>
    patchFeedback(id, { arquivado: false }, { remove: true });

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontWeight: 700, fontSize: '1.15rem' }}>
            {showArquivados ? 'Feedbacks Arquivados' : 'Feedback dos Clientes'}
          </h3>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary, #aaa)', fontSize: '0.85rem' }}>
            {total} registro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleToggleArquivados(!showArquivados)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: showArquivados ? 'rgba(168,85,247,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${showArquivados ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 8,
              color: showArquivados ? '#a855f7' : 'var(--text-secondary, #aaa)',
              cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600,
            }}
          >
            <Archive size={14} />
            {showArquivados ? 'Ver ativos' : 'Arquivados'}
          </button>
          <button
            onClick={() => loadFeedbacks(filter, page, showArquivados)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: 'var(--text-secondary, #aaa)', cursor: 'pointer', fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filters (only for active feedbacks) */}
      {!showArquivados && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'all',      label: 'Todos' },
            { key: 'sugestao', label: '💡 Sugestões' },
            { key: 'bug',      label: '🐛 Bugs' },
          ].map(tab => (
            <button key={tab.key} onClick={() => handleFilter(tab.key)} style={tabStyle(filter === tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={28} style={{ color: '#a855f7', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : feedbacks.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
        }}>
          <Archive size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 16 }} />
          <p style={{ color: 'var(--text-secondary, #aaa)', margin: 0 }}>
            {showArquivados ? 'Nenhum feedback arquivado.' : 'Nenhum feedback encontrado.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feedbacks.map(fb => {
            const cfg = TIPO_CONFIG[fb.tipo] ?? TIPO_CONFIG.sugestao;
            const restName = fb.restaurantes?.nome || '—';
            const isActioning = actionLoading === fb.id;
            return (
              <div
                key={fb.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${fb.resolvido ? 'rgba(46,125,50,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12,
                  padding: '14px 18px',
                  opacity: isActioning ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}
              >
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: cfg.bg, color: cfg.color,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span style={{
                    background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    🏪 {restName}
                  </span>
                  {fb.resolvido && (
                    <span style={{
                      background: 'rgba(46,125,50,0.15)', color: '#81c784',
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      ✅ Resolvido
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                    {timeAgo(fb.criado_em)}
                  </span>
                </div>

                {/* Message */}
                <p style={{ margin: '0 0 12px', color: 'var(--text-primary, #fff)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {fb.mensagem}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {fb.respondido_em && (
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                      Respondido {timeAgo(fb.respondido_em)} ·
                    </span>
                  )}

                  {showArquivados ? (
                    <button
                      onClick={() => handleDesarquivar(fb.id)}
                      disabled={isActioning}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 8, border: 'none',
                        cursor: isActioning ? 'not-allowed' : 'pointer',
                        fontSize: '0.78rem', fontWeight: 700,
                        background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                      }}
                    >
                      {isActioning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <ArchiveRestore size={12} />}
                      Desarquivar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleResolve(fb.id, true)}
                        disabled={isActioning || fb.resolvido === true}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          cursor: isActioning || fb.resolvido === true ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s',
                          background: fb.resolvido === true ? 'rgba(46,125,50,0.25)' : 'rgba(46,125,50,0.12)',
                          color: fb.resolvido === true ? '#81c784' : '#66bb6a',
                          opacity: isActioning ? 0.6 : 1,
                        }}
                      >
                        {isActioning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle size={12} />}
                        Resolvido
                      </button>
                      <button
                        onClick={() => handleResolve(fb.id, false)}
                        disabled={isActioning || (fb.resolvido === false && !!fb.respondido_em)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          cursor: isActioning || (fb.resolvido === false && !!fb.respondido_em) ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s',
                          background: fb.resolvido === false && fb.respondido_em ? 'rgba(198,40,40,0.25)' : 'rgba(198,40,40,0.1)',
                          color: fb.resolvido === false && fb.respondido_em ? '#ef9a9a' : '#e57373',
                          opacity: isActioning ? 0.6 : 1,
                        }}
                      >
                        {isActioning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <XCircle size={12} />}
                        Não resolvido
                      </button>
                      {fb.resolvido && (
                        <button
                          onClick={() => handleArquivar(fb.id)}
                          disabled={isActioning}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 8, border: 'none',
                            cursor: isActioning ? 'not-allowed' : 'pointer',
                            fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s',
                            background: 'rgba(168,85,247,0.12)', color: '#a855f7',
                            opacity: isActioning ? 0.6 : 1,
                          }}
                        >
                          {isActioning ? <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Archive size={12} />}
                          Arquivar
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Images */}
                {Array.isArray(fb.imagens) && fb.imagens.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    {fb.imagens.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noreferrer">
                        <img src={src} alt={`screenshot ${i + 1}`}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'zoom-in' }}
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 50 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 24 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary, #aaa)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>
            Anterior
          </button>
          <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary, #aaa)', fontSize: '0.85rem' }}>
            Página {page} de {Math.ceil(total / 50)}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 50)}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary, #aaa)', cursor: page >= Math.ceil(total / 50) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / 50) ? 0.5 : 1 }}>
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
