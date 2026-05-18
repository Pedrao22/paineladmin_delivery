import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Power, PowerOff, Edit2, ExternalLink,
  ChevronLeft, ChevronRight, Activity, X, Trash2, ShieldAlert,
  Save, Store, CheckCircle2, AlertTriangle, Zap, Calendar,
  MessageSquare, MoreVertical, Globe, Clock, Unlock,
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import './RestaurantsManagement.css';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || '';

const EMPTY_FORM = {
  nome: '', cnpj: '', email: '', telefone: '',
  admin_nome: '', admin_email: '', admin_password: '', plano_id: '',
  trial: true, trial_days: '',
};
const EMPTY_EDIT = { nome: '', cnpj: '', email: '', telefone: '', status: 'active', chatwoot_inbox_id: '' };

const statusMeta = {
  active:    { label: 'Ativo',    cls: 'active' },
  inactive:  { label: 'Inativo',  cls: 'inactive' },
  suspended: { label: 'Suspenso', cls: 'suspended' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function colorFromString(str) {
  if (!str) return '#6366f1';
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

const RestaurantsManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, suspensos: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(EMPTY_EDIT);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchData(); }, [page, filter, debouncedSearch]);
  useEffect(() => { fetchPlans(); }, []);

  useEffect(() => {
    const handleClick = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const fetchPlans = async () => {
    const res = await apiFetch('/plans');
    if (res?.success) setPlans(res.data);
    else if (Array.isArray(res)) setPlans(res);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (filter !== 'all') params.append('status', filter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const [statsRes, listRes] = await Promise.allSettled([
        apiFetch('/restaurants/stats'),
        apiFetch(`/restaurants?${params}`),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStats(statsRes.value.data);
      }

      if (listRes.status === 'fulfilled' && listRes.value?.success) {
        const rows = listRes.value.data?.data ?? [];
        console.log(`[fetchData] OK — ${rows.length} restaurante(s) | total=${listRes.value.data?.total} | page=${page}`);
        setRestaurants(rows);
        setTotalPages(listRes.value.data?.totalPages ?? 1);
      } else if (listRes.status === 'rejected') {
        console.error('[fetchData] /restaurants falhou:', listRes.reason?.message || listRes.reason);
        // Mantém lista antiga — não limpa estado para não perder o que já foi carregado
      } else {
        console.warn('[fetchData] /restaurants resposta inesperada:', listRes.value);
      }
    } catch (err) {
      console.error('[fetchData] erro inesperado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true); setFormError('');
    try {
      const payload = {
        ...formData,
        skip_trial: !formData.trial,
        trial_days: formData.trial && formData.trial_days ? parseInt(formData.trial_days, 10) : undefined,
      };
      const res = await apiFetch('/restaurants', { method: 'POST', body: JSON.stringify(payload) });
      if (res?.success) { setIsModalOpen(false); setFormData(EMPTY_FORM); fetchData(); }
      else setFormError(res?.message || 'Erro ao criar restaurante.');
    } catch (err) { setFormError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await apiFetch(`/restaurants/${id}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: newStatus }),
      });
      if (res?.success) fetchData();
    } catch {}
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspender este restaurante? O acesso ao painel será bloqueado.')) return;
    try {
      const res = await apiFetch(`/restaurants/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'suspended' }) });
      if (res?.success) fetchData();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir permanentemente? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await apiFetch(`/restaurants/${id}`, { method: 'DELETE' });
      if (res?.success) fetchData();
    } catch {}
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Ativar este restaurante? O trial será removido e o acesso liberado permanentemente.')) return;
    try {
      const res = await apiFetch(`/restaurants/${id}/activate`, { method: 'PATCH' });
      if (res?.success) fetchData();
    } catch {}
  };

  const handleExtendTrial = async (id) => {
    const days = parseInt(window.prompt('Quantos dias deseja adicionar ao trial?', '7') || '0', 10);
    if (!days || days < 1) return;
    try {
      const res = await apiFetch(`/restaurants/${id}/extend-trial`, { method: 'PATCH', body: JSON.stringify({ days }) });
      if (res?.success) fetchData();
    } catch {}
  };

  const getTrialInfo = (r) => {
    if (!r.trial_ends_at) return null;
    const daysLeft = Math.ceil((new Date(r.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
    return { expired: daysLeft < 0, daysLeft: Math.max(0, daysLeft) };
  };

  const openEdit = (res) => {
    setEditingId(res.id);
    setEditData({ nome: res.nome || '', cnpj: res.cnpj || '', email: res.email || '', telefone: res.telefone || '', status: res.status || 'active', chatwoot_inbox_id: res.chatwoot_inbox_id ?? '' });
    setIsEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault(); setEditSubmitting(true);
    try {
      const payload = { ...editData, chatwoot_inbox_id: editData.chatwoot_inbox_id !== '' ? Number(editData.chatwoot_inbox_id) : null };
      const res = await apiFetch(`/restaurants/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      if (res?.success) { setIsEditOpen(false); fetchData(); }
    } catch {}
    finally { setEditSubmitting(false); }
  };

  return (
    <div className="res-mgmt-container">

      {/* ── Stats ── */}
      <div className="res-stats-grid">
        {[
          { icon: Store,        label: 'Total na rede',    value: stats.total,   sub: 'estabelecimentos', cls: 'blue',   glow: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.08), transparent 70%)' },
          { icon: CheckCircle2, label: 'Ativos agora',     value: stats.ativos,  sub: 'operando normalmente', cls: 'green', glow: 'radial-gradient(ellipse at top left, rgba(34,197,94,0.08), transparent 70%)' },
          { icon: AlertTriangle,label: 'Suspensos/Inativos',value: stats.suspensos + stats.inativos, sub: 'requerem atenção', cls: 'amber', glow: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.08), transparent 70%)' },
          { icon: Activity,     label: 'Taxa de ativação', value: stats.total > 0 ? `${Math.round((stats.ativos / stats.total) * 100)}%` : '—', sub: 'dos restaurantes ativos', cls: 'indigo', glow: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.08), transparent 70%)' },
        ].map(({ icon: Icon, label, value, sub, cls, glow }) => (
          <div key={label} className="res-stat-card" style={{ '--sc-glow': glow }}>
            <div className={`res-stat-icon ${cls}`}><Icon size={20} /></div>
            <p className="res-stat-label">{label}</p>
            <p className="res-stat-value">{value}</p>
            <p className="res-stat-sub">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="res-toolbar">
        <div className="res-search-wrap">
          <Search size={15} />
          <input
            type="text" placeholder="Buscar por nome, e-mail ou CNPJ..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="res-select" value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="suspended">Suspensos</option>
        </select>
        <button className="res-create-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Novo Restaurante
        </button>
      </div>

      {/* ── Card Grid ── */}
      <div className="res-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="res-card" style={{ opacity: 0.4, pointerEvents: 'none' }}>
              <div className="res-card-accent" style={{ background: '#1e293b' }} />
              <div className="res-card-body">
                <div className="res-card-header">
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#1e293b' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: '#1e293b', borderRadius: 6, marginBottom: 8, width: '70%' }} />
                    <div style={{ height: 11, background: '#1e293b', borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : restaurants.length === 0 ? (
          <div className="res-empty-state">
            <Store size={36} color="#1e293b" />
            <p>Nenhum restaurante encontrado.</p>
          </div>
        ) : restaurants.map(res => {
          const color = res.cor_primaria || colorFromString(res.nome);
          const sm = statusMeta[res.status] || statusMeta.inactive;
          return (
            <div key={res.id} className="res-card" style={{ '--rc-color': color }}>
              <div className="res-card-accent" />
              <div className="res-card-body">
                <div className="res-card-header">
                  <div className="res-card-avatar" style={{ background: color }}>
                    {(res.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="res-card-info">
                    <p className="res-card-name">{res.nome}</p>
                    <p className="res-card-email">{res.email}</p>
                  </div>
                </div>

                <div className="res-card-tags">
                  <span className={`rc-badge ${sm.cls}`}>
                    <span className="rc-dot" />{sm.label}
                  </span>
                  {res.planos?.nome ? (
                    <span className="rc-plan"><Zap size={10} />{res.planos.nome}</span>
                  ) : (
                    <span className="rc-plan none">Sem plano</span>
                  )}
                  {res.chatwoot_inbox_id ? (
                    <span className="rc-wa"><MessageSquare size={10} />WhatsApp</span>
                  ) : (
                    <span className="rc-wa pending"><MessageSquare size={10} />Pendente</span>
                  )}
                  {(() => {
                    const trial = getTrialInfo(res);
                    if (!trial) return null;
                    return trial.expired
                      ? <span className="rc-trial expired"><Clock size={10} />Trial expirado</span>
                      : <span className="rc-trial active"><Clock size={10} />{trial.daysLeft}d de trial</span>;
                  })()}
                </div>

                <div className="res-card-meta">
                  <span><Calendar size={11} />{formatDate(res.criado_em)}</span>
                  {res.slug && <span><Globe size={11} />{res.slug}</span>}
                </div>
              </div>

              <div className="res-card-footer">
                <div style={{ fontSize: '0.72rem', color: '#334155' }}>
                  ID: <span style={{ fontFamily: 'monospace', color: '#475569' }}>{res.id.slice(0, 8)}…</span>
                </div>
                <div className="res-card-actions">
                  <button
                    className={`rca-btn ${res.status === 'active' ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleStatus(res.id, res.status)}
                    title={res.status === 'active' ? 'Desativar' : 'Ativar'}
                  >
                    {res.status === 'active' ? <PowerOff size={14} /> : <Power size={14} />}
                  </button>
                  <button className="rca-btn edit" title="Editar" onClick={() => openEdit(res)}>
                    <Edit2 size={14} />
                  </button>
                  {MAIN_APP_URL && (
                    <a className="rca-btn" title="Ver painel" href={`${MAIN_APP_URL}?impersonate=${res.id}`} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <div className="rca-dropdown">
                    <button className="rca-btn" title="Mais" onClick={e => { e.stopPropagation(); setOpenDropdownId(openDropdownId === res.id ? null : res.id); }}>
                      <MoreVertical size={14} />
                    </button>
                    {openDropdownId === res.id && (
                      <div className="rca-dropdown-menu" onClick={e => e.stopPropagation()}>
                        {res.trial_ends_at && (
                          <>
                            <button className="rca-dropdown-item success" onClick={() => { handleActivate(res.id); setOpenDropdownId(null); }}>
                              <Unlock size={14} /> Ativar (remover trial)
                            </button>
                            <button className="rca-dropdown-item warn" onClick={() => { handleExtendTrial(res.id); setOpenDropdownId(null); }}>
                              <Clock size={14} /> Estender trial
                            </button>
                            <div className="rca-dropdown-divider" />
                          </>
                        )}
                        <button className="rca-dropdown-item warn" onClick={() => { handleSuspend(res.id); setOpenDropdownId(null); }}>
                          <ShieldAlert size={14} /> Suspender acesso
                        </button>
                        <div className="rca-dropdown-divider" />
                        <button className="rca-dropdown-item danger" onClick={() => { handleDelete(res.id); setOpenDropdownId(null); }}>
                          <Trash2 size={14} /> Excluir permanentemente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="res-pagination">
          <button className="res-pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft size={15} /> Anterior
          </button>
          <span className="res-pag-info">Página <b>{page}</b> de <b>{totalPages}</b></span>
          <button className="res-pag-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Próxima <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* ── Modal Criar ── */}
      {isModalOpen && (
        <div className="super-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="super-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cadastrar Novo Restaurante</h3>
              <p>O restaurante receberá um acesso administrativo automático.</p>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && <div className="form-error">{formError}</div>}
              <div className="form-section">
                <h4>Dados do Negócio</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome do Estabelecimento *</label>
                    <input required type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>CNPJ</label>
                    <input type="text" placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>E-mail de Contato *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="tel" placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Plano Inicial</label>
                    <select value={formData.plano_id} onChange={e => setFormData({ ...formData, plano_id: e.target.value })}>
                      <option value="">Selecione um plano</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Período de Testes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={formData.trial}
                      onChange={e => setFormData({ ...formData, trial: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.87rem', color: '#cbd5e1', fontWeight: 600 }}>
                      Ativar período de testes
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 400 }}>
                      (acesso bloqueado após vencer)
                    </span>
                  </label>

                  {formData.trial && (
                    <div className="form-group" style={{ maxWidth: 220 }}>
                      <label>Dias de trial <span style={{ color: '#475569', fontWeight: 400 }}>(em branco = padrão do sistema)</span></label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        placeholder="Ex: 7 ou 15"
                        value={formData.trial_days}
                        onChange={e => setFormData({ ...formData, trial_days: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h4>Acesso Administrativo</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome do Administrador *</label>
                    <input required type="text" value={formData.admin_nome} onChange={e => setFormData({ ...formData, admin_nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>E-mail de Login *</label>
                    <input required type="email" value={formData.admin_email} onChange={e => setFormData({ ...formData, admin_email: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Senha Provisória * (mín. 8 caracteres)</label>
                    <input required type="password" minLength={8} value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={submitting}>
                  {submitting ? 'Criando...' : <><Plus size={15} /> Criar Ecossistema</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Editar ── */}
      {isEditOpen && (
        <div className="super-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="super-modal-card" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3>Editar Restaurante</h3>
                  <p>Atualize os dados cadastrais do estabelecimento.</p>
                </div>
                <button className="cancel-btn" style={{ padding: '8px 10px' }} onClick={() => setIsEditOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>
            <form onSubmit={handleEdit} className="modal-form">
              <div className="form-section">
                <h4>Informações</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome *</label>
                    <input required type="text" value={editData.nome} onChange={e => setEditData({ ...editData, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>CNPJ</label>
                    <input type="text" value={editData.cnpj} onChange={e => setEditData({ ...editData, cnpj: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>E-mail</label>
                    <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Telefone</label>
                    <input type="tel" value={editData.telefone} onChange={e => setEditData({ ...editData, telefone: e.target.value })} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Status</label>
                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h4>Integração WhatsApp</h4>
                <div className="form-group">
                  <label>ID da Inbox no Chatwoot (Uply.chat)</label>
                  <input
                    type="number"
                    placeholder="Ex: 30419 — deixe vazio se ainda não conectado"
                    value={editData.chatwoot_inbox_id}
                    onChange={e => setEditData({ ...editData, chatwoot_inbox_id: e.target.value })}
                  />
                  <small style={{ color: '#334155', fontSize: '0.73rem', marginTop: 4, display: 'block' }}>
                    Após o restaurante escanear o QR no Uply.chat, copie o ID da inbox aqui para ativar o chat.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={editSubmitting}>
                  <Save size={14} /> {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantsManagement;
