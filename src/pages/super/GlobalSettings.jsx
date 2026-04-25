import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Globe, Percent, ShieldAlert, Mail,
  CheckCircle2, RefreshCw, Info, Power, PowerOff, Loader2
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const GlobalSettings = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/config');
      if (Array.isArray(data)) setConfigs(data);
      else if (data?.success && Array.isArray(data.data)) setConfigs(data.data);
    } catch (err) {
      console.error('Erro ao buscar configs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (chave, valor) => {
    setSavingKey(chave);
    try {
      await apiFetch('/config', {
        method: 'PUT',
        body: JSON.stringify({ chave, valor })
      });
      setMessage({ text: `"${chave}" salvo com sucesso.`, type: 'success' });
      // Update local state optimistically to avoid full refetch
      setConfigs(prev => {
        const exists = prev.find(c => c.chave === chave);
        if (exists) return prev.map(c => c.chave === chave ? { ...c, valor } : c);
        return [...prev, { chave, valor }];
      });
    } catch (err) {
      setMessage({ text: 'Falha ao salvar configuração.', type: 'error' });
    } finally {
      setSavingKey(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const findValue = (chave) => configs.find(c => c.chave === chave)?.valor ?? '';

  const maintenanceActive = findValue('maintenance_mode') === true
    || findValue('maintenance_mode') === 'true'
    || findValue('maintenance_mode') === 1;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <RefreshCw size={28} className="animate-spin mb-4" />
        <p>Carregando parâmetros globais...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Settings className="text-purple-400" size={26} />
            Parâmetros Globais
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Controle das diretrizes e status operacional do ecossistema.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black text-slate-400 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Servidores Online
          </div>
        </div>
      </div>

      {/* Feedback */}
      {message.text && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-semibold animate-fadeIn ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identidade */}
          <div className="glass-card p-8">
            <h3 className="text-base font-black text-white mb-6 flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
              Identidade do Ecossistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigField
                label="Nome da Plataforma"
                icon={<Globe size={16} className="text-slate-500" />}
                defaultValue={findValue('platform_name')}
                placeholder="Ex: Pedi&Recebe"
                onSave={(v) => handleUpdate('platform_name', v)}
                saving={savingKey === 'platform_name'}
              />
              <ConfigField
                label="E-mail de Suporte"
                icon={<Mail size={16} className="text-slate-500" />}
                defaultValue={findValue('support_email')}
                placeholder="suporte@pedirecebe.com"
                type="email"
                onSave={(v) => handleUpdate('support_email', v)}
                saving={savingKey === 'support_email'}
              />
            </div>
          </div>

          {/* Financeiro */}
          <div className="glass-card p-8">
            <h3 className="text-base font-black text-white mb-6 flex items-center gap-2.5">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              Parâmetros Financeiros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ConfigFieldNumber
                label="Taxa de Marketplace (%)"
                suffix="%"
                defaultValue={findValue('marketplace_fee')}
                onSave={(v) => handleUpdate('marketplace_fee', parseFloat(v))}
                saving={savingKey === 'marketplace_fee'}
              />
              <ConfigFieldNumber
                label="Período de Trial (dias)"
                suffix="dias"
                defaultValue={findValue('trial_days')}
                onSave={(v) => handleUpdate('trial_days', parseInt(v))}
                saving={savingKey === 'trial_days'}
              />
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Modo de Manutenção */}
          <div className="glass-card p-7 border-l-4 border-l-rose-500/40">
            <div className="flex items-center gap-2.5 mb-4">
              <ShieldAlert size={20} className="text-rose-400" />
              <span className="text-sm font-black text-rose-400 uppercase tracking-wide">Modo de Crise</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              Ao ativar a manutenção, o painel dos restaurantes será bloqueado com mensagem de reparo.
            </p>

            {/* Status atual */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-5 text-xs font-bold ${
              maintenanceActive
                ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${maintenanceActive ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
              {maintenanceActive ? 'Sistema em manutenção' : 'Sistema operacional'}
            </div>

            <button
              disabled={savingKey === 'maintenance_mode'}
              className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                maintenanceActive
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'
                  : 'bg-white/5 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
              }`}
              onClick={() => {
                if (!maintenanceActive) {
                  if (window.confirm('⚠️ ATENÇÃO: Ativar manutenção bloqueará TODOS os restaurantes. Confirma?')) {
                    handleUpdate('maintenance_mode', true);
                  }
                } else {
                  handleUpdate('maintenance_mode', false);
                }
              }}
            >
              {savingKey === 'maintenance_mode' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : maintenanceActive ? (
                <><Power size={14} /> Desativar Manutenção</>
              ) : (
                <><PowerOff size={14} /> Ativar Manutenção</>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <Info size={16} className="mx-auto mb-3 text-slate-600" />
            <p className="text-[11px] text-slate-600 leading-relaxed italic">
              Todas as interações aqui são registradas na Trilha de Auditoria com IP e timestamp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Campo de texto com save ao blur ────────────
function ConfigField({ label, icon, defaultValue, placeholder, type = 'text', onSave, saving }) {
  const [value, setValue] = useState(defaultValue);

  // Sync when config loads
  useEffect(() => { setValue(defaultValue); }, [defaultValue]);

  const handleBlur = () => {
    if (value !== defaultValue) onSave(value);
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 pointer-events-none">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-700"
        />
        <span className="absolute right-3">
          {saving
            ? <Loader2 size={14} className="text-purple-400 animate-spin" />
            : <Save size={14} className="text-slate-700" />}
        </span>
      </div>
    </div>
  );
}

function ConfigFieldNumber({ label, suffix, defaultValue, onSave, saving }) {
  const [value, setValue] = useState(defaultValue ?? '');

  useEffect(() => { setValue(defaultValue ?? ''); }, [defaultValue]);

  const handleBlur = () => {
    if (String(value) !== String(defaultValue)) onSave(value);
  };

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-white tabular-nums pr-16 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 outline-none transition-all"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {saving
            ? <Loader2 size={13} className="text-amber-400 animate-spin" />
            : null}
          <span className="text-slate-600 font-black text-xs uppercase">{suffix}</span>
        </span>
      </div>
    </div>
  );
}

export default GlobalSettings;
