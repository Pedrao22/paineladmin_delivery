import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Filter, MoreVertical, Power, PowerOff, Edit2, ExternalLink,
  ChevronLeft, ChevronRight, TrendingUp, Activity, Users, AlertTriangle,
  CheckCircle2, Store, X, Trash2, ShieldAlert, Save
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';
import './RestaurantsManagement.css';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || '';

const EMPTY_FORM = {
  nome: '', cnpj: '', email: '', telefone: '',
  admin_nome: '', admin_email: '', admin_password: '', plano_id: ''
};

const EMPTY_EDIT = { nome: '', cnpj: '', email: '', telefone: '', status: 'active' };

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

  // Modal criar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [plans, setPlans] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Modal editar
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(EMPTY_EDIT);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Debounce na busca
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [page, filter, debouncedSearch]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fecha dropdown ao clicar fora
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
      const statsRes = await apiFetch('/restaurants/stats');
      if (statsRes?.success) setStats(statsRes.data);

      const params = new URLSearchParams({ page, limit: 10 });
      if (filter !== 'all') params.append('status', filter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const listRes = await apiFetch(`/restaurants?${params}`);
      if (listRes?.success) {
        setRestaurants(listRes.data.data);
        setTotalPages(listRes.data.totalPages);
      }
    } catch (err) {
      console.error('Erro ao buscar restaurantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await apiFetch('/restaurants', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (res?.success) {
        setIsModalOpen(false);
        setFormData(EMPTY_FORM);
        fetchData();
      } else {
        setFormError(res?.message || 'Erro ao criar restaurante.');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await apiFetch(`/restaurants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res?.success) {
        setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspender este restaurante? O acesso ao painel será bloqueado.')) return;
    try {
      const res = await apiFetch(`/restaurants/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'suspended' })
      });
      if (res?.success) fetchData();
    } catch (err) {
      console.error('Erro ao suspender:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir permanentemente este restaurante? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await apiFetch(`/restaurants/${id}`, { method: 'DELETE' });
      if (res?.success) fetchData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const openEdit = (res) => {
    setEditingId(res.id);
    setEditData({
      nome: res.nome || '',
      cnpj: res.cnpj || '',
      email: res.email || '',
      telefone: res.telefone || '',
      status: res.status || 'active',
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await apiFetch(`/restaurants/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(editData)
      });
      if (res?.success) {
        setIsEditOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao editar:', err);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="res-mgmt-container">
      {/* Stats */}
      <div className="super-stats-grid">
        <div className="super-stat-card">
          <div className="stat-icon-wrapper blue"><Store size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">Total de Restaurantes</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
          <div className="stat-badge positive"><TrendingUp size={14} /><span>rede</span></div>
        </div>
        <div className="super-stat-card">
          <div className="stat-icon-wrapper green"><CheckCircle2 size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">Ativos</p>
            <h3 className="stat-value">{stats.ativos}</h3>
          </div>
        </div>
        <div className="super-stat-card">
          <div className="stat-icon-wrapper orange"><AlertTriangle size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">Suspensos / Inativos</p>
            <h3 className="stat-value">{stats.suspensos + stats.inativos}</h3>
          </div>
        </div>
        <div className="super-stat-card">
          <div className="stat-icon-wrapper indigo"><Activity size={24} /></div>
          <div className="stat-content">
            <p className="stat-label">Taxa de Ativação</p>
            <h3 className="stat-value">{stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}%</h3>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="res-control-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <button className="icon-btn"><Filter size={18} /></button>
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
            <option value="suspended">Suspensos</option>
          </select>
          <button className="create-res-btn" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /><span>Novo Restaurante</span>
          </button>
        </div>
      </div>

      {/* Modal Criar */}
      {isModalOpen && (
        <div className="super-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="super-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cadastrar Novo Restaurante</h3>
              <p>O restaurante receberá um acesso administrativo automático.</p>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  {formError}
                </div>
              )}
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
                  <div className="form-group">
                    <label>Plano Inicial</label>
                    <select value={formData.plano_id} onChange={e => setFormData({ ...formData, plano_id: e.target.value })}>
                      <option value="">Selecione um plano</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco}</option>)}
                    </select>
                  </div>
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
                  <div className="form-group">
                    <label>Senha Provisória * (mín. 8 caracteres)</label>
                    <input required type="password" minLength={8} value={formData.admin_password} onChange={e => setFormData({ ...formData, admin_password: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={submitting}>
                  {submitting ? 'Criando...' : 'Criar Ecossistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {isEditOpen && (
        <div className="super-modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="super-modal-card" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Editar Restaurante</h3>
                  <p>Atualize os dados cadastrais do estabelecimento.</p>
                </div>
                <button className="cancel-btn" style={{ padding: '8px' }} onClick={() => setIsEditOpen(false)}>
                  <X size={18} />
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
                  <div className="form-group">
                    <label>Status</label>
                    <select value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })}>
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                <button type="submit" className="confirm-btn" disabled={editSubmitting}>
                  <Save size={16} style={{ marginRight: '6px' }} />
                  {editSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="super-table-container">
        <table className="super-table">
          <thead>
            <tr>
              <th>Restaurante</th>
              <th>Plano</th>
              <th>Status</th>
              <th>CNPJ</th>
              <th>Usuários</th>
              <th>Criado em</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading-cell">Carregando...</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan="7" className="empty-cell">Nenhum restaurante encontrado.</td></tr>
            ) : restaurants.map((res) => (
              <tr key={res.id}>
                <td>
                  <div className="res-cell">
                    <div className="res-logo-mini" style={{ backgroundColor: res.cor_primaria || '#6366f1' }}>
                      {res.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="res-name-info">
                      <p className="res-name">{res.nome}</p>
                      <p className="res-email">{res.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`plan-badge ${res.planos?.nome?.toLowerCase() || 'gratuito'}`}>
                    {res.planos?.nome || 'Sem Plano'}
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${res.status}`}>
                    {res.status === 'active' ? 'Ativo' : res.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                  </span>
                </td>
                <td className="font-mono">{res.cnpj || '—'}</td>
                <td>
                  <div className="users-stack">
                    <Users size={16} />
                    <span>{res.usuarios?.length || 0}</span>
                  </div>
                </td>
                <td>{new Date(res.criado_em).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div className="actions-cell">
                    <button
                      className={`action-btn ${res.status === 'active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleStatus(res.id, res.status)}
                      title={res.status === 'active' ? 'Desativar' : 'Ativar'}
                    >
                      {res.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                    </button>
                    <button className="action-btn" title="Editar" onClick={() => openEdit(res)}>
                      <Edit2 size={16} />
                    </button>
                    {MAIN_APP_URL && (
                      <a
                        className="action-btn"
                        title="Abrir painel do restaurante"
                        href={MAIN_APP_URL}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                    {/* Dropdown Mais Ações */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className="action-btn"
                        title="Mais ações"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === res.id ? null : res.id);
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {openDropdownId === res.id && (
                        <div
                          style={{
                            position: 'absolute', right: 0, top: '44px', zIndex: 999,
                            background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px', overflow: 'hidden', minWidth: '180px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            onClick={() => { handleSuspend(res.id); setOpenDropdownId(null); }}
                          >
                            <ShieldAlert size={15} /> Suspender Acesso
                          </button>
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                          <button
                            style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 600 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            onClick={() => { handleDelete(res.id); setOpenDropdownId(null); }}
                          >
                            <Trash2 size={15} /> Excluir Permanentemente
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="super-pagination">
        <button className="pag-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft size={18} />
        </button>
        <span className="pag-info">Página {page} de {totalPages}</span>
        <button className="pag-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default RestaurantsManagement;
