import React, { useState, useEffect } from 'react';
import {
  Package, Plus, CreditCard, Edit3, Zap, DollarSign,
  Building2, X, Save, Trash2, CheckCircle2, AlertCircle,
  RefreshCw, Calendar, Ban, ArrowRight, ChevronDown
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const EMPTY_PLAN = {
  nome: '', descricao: '', preco: '', intervalo: 'mensal',
  limite_pedidos: '', limite_produtos: ''
};

const INTERVAL_LABELS = { mensal: 'Mensal', anual: 'Anual', semanal: 'Semanal' };

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      padding: '14px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px',
      background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
      color: toast.type === 'success' ? '#34d399' : '#f87171',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{toast.text}</span>
    </div>
  );
}

const PlansManager = () => {
  const [planos, setPlanos] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  // plan modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);

  // subscription modal
  const [subModal, setSubModal] = useState(null); // { sub, action: 'manage' }
  const [subSaving, setSubSaving] = useState(false);
  const [renewMonths, setRenewMonths] = useState(1);
  const [changePlanId, setChangePlanId] = useState('');

  const [toast, setToast] = useState(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'plans') {
        const res = await apiFetch('/plans');
        setPlanos(res?.success ? res.data : (Array.isArray(res) ? res : []));
      } else {
        const [subRes, planRes] = await Promise.all([
          apiFetch('/plans/subscriptions'),
          apiFetch('/plans'),
        ]);
        setSubscriptions(subRes?.success ? subRes.data : (Array.isArray(subRes) ? subRes : []));
        setPlanos(planRes?.success ? planRes.data : (Array.isArray(planRes) ? planRes : []));
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── PLAN CRUD ────────────────────────────────
  const openCreate = () => {
    setEditingPlan(null);
    setPlanForm(EMPTY_PLAN);
    setIsModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      nome: plan.nome || '',
      descricao: plan.descricao || '',
      preco: plan.preco || '',
      intervalo: plan.intervalo || 'mensal',
      limite_pedidos: plan.limite_pedidos || '',
      limite_produtos: plan.limite_produtos || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...planForm,
        preco: parseFloat(planForm.preco),
        limite_pedidos: planForm.limite_pedidos ? parseInt(planForm.limite_pedidos) : null,
        limite_produtos: planForm.limite_produtos ? parseInt(planForm.limite_produtos) : null,
      };
      if (editingPlan) {
        await apiFetch(`/plans/${editingPlan.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await apiFetch('/plans', { method: 'POST', body: JSON.stringify(body) });
      }
      showToast(editingPlan ? 'Plano atualizado!' : 'Plano criado!');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este plano? Restaurantes vinculados não serão afetados.')) return;
    try {
      await apiFetch(`/plans/${id}`, { method: 'DELETE' });
      showToast('Plano excluído.');
      fetchData();
    } catch (err) {
      showToast('Erro ao excluir plano.', 'error');
    }
  };

  // ─── SUBSCRIPTION ACTIONS ─────────────────────
  const openSubModal = (sub) => {
    setSubModal(sub);
    setRenewMonths(1);
    setChangePlanId(sub.planos?.id || '');
  };

  const handleRenewSub = async () => {
    setSubSaving(true);
    try {
      await apiFetch('/plans/assign', {
        method: 'POST',
        body: JSON.stringify({
          restauranteId: subModal.restaurante_id,
          planoId: changePlanId || subModal.plano_id,
          meses: renewMonths,
        }),
      });
      showToast('Assinatura renovada com sucesso!');
      setSubModal(null);
      fetchData();
    } catch (err) {
      showToast('Erro ao renovar assinatura.', 'error');
    } finally {
      setSubSaving(false);
    }
  };

  const handleCancelSub = async () => {
    if (!window.confirm(`Cancelar a assinatura de "${subModal.restaurantes?.nome}"?`)) return;
    setSubSaving(true);
    try {
      await apiFetch(`/plans/subscriptions/${subModal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      showToast('Assinatura cancelada.');
      setSubModal(null);
      fetchData();
    } catch (err) {
      showToast('Erro ao cancelar assinatura.', 'error');
    } finally {
      setSubSaving(false);
    }
  };

  // ─── RENDER ───────────────────────────────────
  return (
    <div className="space-y-8 animate-fadeIn">
      <Toast toast={toast} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="text-purple-400" size={26} />
            Gestão de Planos
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Configure faturamento e limites do ecossistema.</p>
        </div>
        <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-2xl border border-white/10">
          {['plans', 'subscriptions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${
                activeTab === tab
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'plans' ? 'Pacotes' : 'Assinaturas'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan Modal ── */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '540px',
              background: '#1e293b', borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
                  {editingPlan ? 'Editar Plano' : 'Novo Plano'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                  {editingPlan ? `Editando: ${editingPlan.nome}` : 'Configure limites, preços e recorrência.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nome do Plano *</label>
                <input required type="text" placeholder="Ex: Pro, Enterprise..."
                  value={planForm.nome} onChange={e => setPlanForm({ ...planForm, nome: e.target.value })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea rows={2} placeholder="Descreva os benefícios..."
                  value={planForm.descricao} onChange={e => setPlanForm({ ...planForm, descricao: e.target.value })}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Preço (R$) *</label>
                  <input required type="number" min="0" step="0.01" placeholder="0.00"
                    value={planForm.preco} onChange={e => setPlanForm({ ...planForm, preco: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Recorrência</label>
                  <select value={planForm.intervalo} onChange={e => setPlanForm({ ...planForm, intervalo: e.target.value })} style={inputStyle}>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Limite Pedidos/mês</label>
                  <input type="number" min="0" placeholder="Vazio = ilimitado"
                    value={planForm.limite_pedidos} onChange={e => setPlanForm({ ...planForm, limite_pedidos: e.target.value })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Limite Produtos</label>
                  <input type="number" min="0" placeholder="Vazio = ilimitado"
                    value={planForm.limite_produtos} onChange={e => setPlanForm({ ...planForm, limite_produtos: e.target.value })}
                    style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Cancelar</button>
                <button type="submit" disabled={saving} style={saveBtnStyle}>
                  <Save size={14} />
                  {saving ? 'Salvando...' : (editingPlan ? 'Salvar' : 'Criar Plano')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Subscription Modal ── */}
      {subModal && (
        <div
          onClick={() => setSubModal(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '480px',
              background: '#1e293b', borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
              overflow: 'hidden'
            }}
          >
            {/* Modal header */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Gerenciar Assinatura</h3>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{subModal.restaurantes?.nome}</p>
              </div>
              <button onClick={() => setSubModal(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Current info */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Plano Atual</p>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem' }}>{subModal.planos?.nome || '—'}</p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Status</p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '0.75rem', fontWeight: 800,
                    color: subModal.status === 'active' ? '#34d399' : '#f87171'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: subModal.status === 'active' ? '#34d399' : '#f87171' }} />
                    {subModal.status === 'active' ? 'ATIVO' : 'CANCELADO'}
                  </span>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Vencimento</p>
                  <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.875rem' }}>
                    {subModal.vencimento ? new Date(subModal.vencimento).toLocaleDateString('pt-BR') : '—'}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Valor</p>
                  <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem' }}>R$ {Number(subModal.planos?.preco || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Change plan */}
              <div>
                <label style={labelStyle}>Alterar para outro plano</label>
                <select
                  value={changePlanId}
                  onChange={e => setChangePlanId(e.target.value)}
                  style={inputStyle}
                >
                  {planos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} — R$ {Number(p.preco).toFixed(2)}/{p.intervalo}</option>
                  ))}
                </select>
              </div>

              {/* Renew months */}
              <div>
                <label style={labelStyle}>Renovar por quantos meses?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRenewMonths(m)}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: renewMonths === m ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${renewMonths === m ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        color: renewMonths === m ? '#c084fc' : '#94a3b8',
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={handleCancelSub}
                  disabled={subSaving || subModal.status === 'cancelled'}
                  style={{
                    flex: 1, padding: '11px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', fontWeight: 700, fontSize: '0.85rem',
                    cursor: subModal.status === 'cancelled' ? 'not-allowed' : 'pointer',
                    opacity: subModal.status === 'cancelled' ? 0.4 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Ban size={14} /> Cancelar
                </button>
                <button
                  onClick={handleRenewSub}
                  disabled={subSaving}
                  style={{
                    flex: 2, padding: '11px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                    border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', opacity: subSaving ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <RefreshCw size={14} className={subSaving ? 'animate-spin' : ''} />
                  {subSaving ? 'Salvando...' : `Renovar ${renewMonths}m`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Plans Grid ── */}
      {activeTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* New plan card */}
          <button
            onClick={openCreate}
            className="group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-white/10 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all min-h-[260px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-purple-400 group-hover:bg-purple-500/10 group-hover:rotate-12 transition-all mb-4">
              <Plus size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-300">Novo Plano</h4>
            <p className="text-xs text-slate-500 text-center mt-2 px-6 leading-relaxed">Personalize limites, preços e recorrência.</p>
          </button>

          {loading ? (
            <div className="flex items-center justify-center col-span-2 text-slate-500 py-16">
              <RefreshCw size={20} className="animate-spin mr-3" /> Carregando planos...
            </div>
          ) : planos.map((plano) => (
            <div key={plano.id} className="glass-card p-7 flex flex-col relative overflow-hidden group">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all pointer-events-none" />

              {/* Plan header */}
              <div className="flex justify-between items-start mb-5">
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Package size={22} />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(plano)}
                    className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(plano.id)}
                    className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Plan name + description */}
              <h3 className="text-xl font-black text-white mb-1 leading-tight">{plano.nome}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5 line-clamp-2">
                {plano.descricao || 'Sem descrição definida.'}
              </p>

              {/* Price */}
              <div className="mt-auto pt-5 border-t border-white/5">
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="text-xs text-slate-500 font-bold uppercase">R$</span>
                  <span className="text-3xl font-black text-white leading-none">{Number(plano.preco).toFixed(2)}</span>
                  <span className="text-slate-500 text-xs font-medium uppercase">/{INTERVAL_LABELS[plano.intervalo] || plano.intervalo}</span>
                </div>

                {/* Limits */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Zap size={11} className="text-purple-400" />
                    <span className="text-xs font-bold">{plano.limite_pedidos ? `${plano.limite_pedidos} pedidos` : 'Ilimitado'}</span>
                  </div>
                  <div className="w-px h-4 bg-white/5" />
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Package size={11} className="text-purple-400" />
                    <span className="text-xs font-bold">{plano.limite_produtos ? `${plano.limite_produtos} produtos` : 'Ilimitado'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Subscriptions Table ── */
        <div className="glass-card overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2.5">
              <CreditCard size={18} className="text-purple-400" />
              Assinaturas Ativas
            </h3>
            <span className="text-xs text-slate-500 font-medium">{subscriptions.length} registros</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <RefreshCw size={20} className="animate-spin mr-3" /> Carregando...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm italic">Nenhuma assinatura encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-[0.15em] font-black">
                    <th className="px-8 py-4">Restaurante</th>
                    <th className="px-8 py-4">Plano</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Vencimento</th>
                    <th className="px-8 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-white/[0.025] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-transparent flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <p className="text-sm text-slate-100 font-bold leading-tight">{sub.restaurantes?.nome || '—'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sub.restaurantes?.cnpj || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <Zap size={10} className="text-purple-400" />
                          <span className="text-xs font-black text-purple-300 uppercase">{sub.planos?.nome || '—'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black tracking-wider ${
                          sub.status === 'active' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          {sub.status === 'active' ? 'ATIVO' : sub.status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={13} className="text-slate-500" />
                          <span className="text-sm font-medium">
                            {sub.vencimento ? new Date(sub.vencimento).toLocaleDateString('pt-BR') : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => openSubModal(sub)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
                        >
                          Gerenciar <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Shared input styles ────────────────────────
const labelStyle = {
  color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em',
  display: 'block', marginBottom: '7px'
};
const inputStyle = {
  width: '100%', background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
  padding: '10px 13px', color: '#fff', fontSize: '0.9rem',
  boxSizing: 'border-box', outline: 'none',
};
const cancelBtnStyle = {
  padding: '10px 20px', borderRadius: '12px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
};
const saveBtnStyle = {
  padding: '10px 24px', borderRadius: '12px',
  background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.875rem'
};

export default PlansManager;
