import React, { useState, useEffect } from 'react';
import {
  Settings, Save, Globe, ShieldAlert, Mail,
  CheckCircle2, Loader2, Power, PowerOff, Info,
  Calendar, Activity,
} from 'lucide-react';
import { apiFetch } from '../../lib/supabase';

const S = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },

  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  h1: { fontSize: '1.75rem', fontWeight: 900, color: '#f1f5f9', margin: '0 0 4px 0', letterSpacing: '-0.02em' },
  h1span: { background: 'linear-gradient(135deg,#818cf8,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  sub: { fontSize: '0.82rem', color: '#334155', margin: 0 },

  live: { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 100, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', color: '#4ade80' },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'sdb-pulse 2s infinite' },

  toast: (t) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderRadius: 14, fontSize: '0.84rem', fontWeight: 600, border: '1px solid', background: t === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderColor: t === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: t === 'success' ? '#4ade80' : '#f87171' }),

  grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: 16 },
  right: { display: 'flex', flexDirection: 'column', gap: 16 },

  card: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' },
  cardHead: { padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: '0.83rem', fontWeight: 800, color: '#cbd5e1', margin: 0 },
  cardBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 },

  fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 7 },
  label: { fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569' },

  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 12, color: '#334155', pointerEvents: 'none', display: 'flex' },
  input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 36px 10px 38px', color: '#e2e8f0', fontSize: '0.87rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' },
  inputNum: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 52px 10px 14px', color: '#e2e8f0', fontSize: '1.3rem', fontWeight: 800, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' },
  inputSave: { position: 'absolute', right: 12, color: '#334155', display: 'flex' },
  inputSuffix: { position: 'absolute', right: 12, color: '#475569', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 },

  separator: { height: 1, background: 'rgba(255,255,255,0.05)' },

  maintBadge: (on) => ({ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700, background: on ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${on ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`, color: on ? '#f87171' : '#4ade80' }),
  maintDot: (on) => ({ width: 6, height: 6, borderRadius: '50%', background: on ? '#f87171' : '#4ade80', ...(on ? { animation: 'sdb-pulse 1.5s infinite' } : {}) }),

  maintBtn: (on) => ({ width: '100%', padding: '12px 0', borderRadius: 12, border: `1px solid ${on ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, background: on ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: on ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '0.05em', transition: 'all 0.2s' }),

  infoBox: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14 },
  infoText: { fontSize: '0.74rem', color: '#334155', lineHeight: 1.6, margin: 0 },
};

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
    } catch {}
    finally { setLoading(false); }
  };

  const handleUpdate = async (chave, valor) => {
    setSavingKey(chave);
    try {
      await apiFetch('/config', { method: 'PUT', body: JSON.stringify({ chave, valor }) });
      setMessage({ text: `"${chave}" salvo com sucesso.`, type: 'success' });
      setConfigs(prev => {
        const exists = prev.find(c => c.chave === chave);
        if (exists) return prev.map(c => c.chave === chave ? { ...c, valor } : c);
        return [...prev, { chave, valor }];
      });
    } catch {
      setMessage({ text: 'Falha ao salvar configuração.', type: 'error' });
    } finally {
      setSavingKey(null);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const findValue = (chave) => configs.find(c => c.chave === chave)?.valor ?? '';
  const maintenanceActive = findValue('maintenance_mode') === true || findValue('maintenance_mode') === 'true' || findValue('maintenance_mode') === 1;

  if (loading) {
    return (
      <div style={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.15)', borderTopColor: '#6366f1', animation: 'spin 0.75s linear infinite' }} />
        <p style={{ color: '#334155', fontSize: '0.83rem', margin: 0 }}>Carregando parâmetros globais...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{`@keyframes sdb-pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Configurações <span style={S.h1span}>Globais</span></h1>
          <p style={S.sub}>Controle das diretrizes e status operacional do ecossistema.</p>
        </div>
        <div style={S.live}><span style={S.liveDot} /> SERVIDORES ONLINE</div>
      </div>

      {/* Toast */}
      {message.text && (
        <div style={S.toast(message.type)}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
          {message.text}
        </div>
      )}

      {/* Grid */}
      <div style={S.grid}>
        <div style={S.left}>

          {/* Identidade */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={15} color="#818cf8" />
              </div>
              <p style={S.cardTitle}>Identidade do Ecossistema</p>
            </div>
            <div style={S.cardBody}>
              <div style={S.fieldGrid}>
                <ConfigField
                  label="Nome da Plataforma"
                  icon={<Globe size={14} />}
                  defaultValue={findValue('platform_name')}
                  placeholder="Ex: Pedi&Recebe"
                  onSave={(v) => handleUpdate('platform_name', v)}
                  saving={savingKey === 'platform_name'}
                />
                <ConfigField
                  label="E-mail de Suporte"
                  icon={<Mail size={14} />}
                  defaultValue={findValue('support_email')}
                  placeholder="suporte@pedirecebe.com"
                  type="email"
                  onSave={(v) => handleUpdate('support_email', v)}
                  saving={savingKey === 'support_email'}
                />
              </div>
            </div>
          </div>


        </div>

        {/* Lateral */}
        <div style={S.right}>

          {/* Manutenção */}
          <div style={{ ...S.card, borderLeft: '3px solid rgba(239,68,68,0.35)' }}>
            <div style={S.cardHead}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={15} color="#f87171" />
              </div>
              <p style={{ ...S.cardTitle, color: '#f87171' }}>Modo de Crise</p>
            </div>
            <div style={{ ...S.cardBody, gap: 14 }}>
              <p style={{ fontSize: '0.77rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Ao ativar, o painel de todos os restaurantes será bloqueado com mensagem de manutenção.
              </p>

              <div style={S.maintBadge(maintenanceActive)}>
                <span style={S.maintDot(maintenanceActive)} />
                {maintenanceActive ? 'Sistema em manutenção' : 'Sistema operacional'}
              </div>

              <button
                disabled={savingKey === 'maintenance_mode'}
                style={S.maintBtn(maintenanceActive)}
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
                {savingKey === 'maintenance_mode'
                  ? <Loader2 size={14} style={{ animation: 'spin 0.75s linear infinite' }} />
                  : maintenanceActive
                    ? <><Power size={14} /> Desativar Manutenção</>
                    : <><PowerOff size={14} /> Ativar Manutenção</>
                }
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={S.infoBox}>
            <Info size={14} color="#334155" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={S.infoText}>
              Todas as interações aqui são registradas na Trilha de Auditoria com IP e timestamp.
            </p>
          </div>

          {/* Status infra */}
          <div style={S.card}>
            <div style={S.cardHead}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(56,189,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={15} color="#38bdf8" />
              </div>
              <p style={S.cardTitle}>Infraestrutura</p>
            </div>
            <div style={{ ...S.cardBody, gap: 10 }}>
              {[
                { label: 'Backend', value: 'Render.com', status: true },
                { label: 'Banco de dados', value: 'Supabase', status: true },
                { label: 'Deploy front', value: 'Vercel', status: true },
              ].map(({ label, value, status }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: '0.7rem', color: '#334155', margin: '2px 0 0 0' }}>{value}</p>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, color: '#4ade80' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                    Online
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

function ConfigField({ label, icon, defaultValue, placeholder, type = 'text', onSave, saving }) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  useEffect(() => { setValue(defaultValue); }, [defaultValue]);

  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>{label}</label>
      <div style={S.inputWrap}>
        <span style={S.inputIcon}>{icon}</span>
        <input
          type={type}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => { setFocused(false); if (value !== defaultValue) onSave(value); }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          style={{
            ...S.input,
            borderColor: focused ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.12)' : 'none',
          }}
        />
        <span style={S.inputSave}>
          {saving
            ? <Loader2 size={13} color="#818cf8" style={{ animation: 'spin 0.75s linear infinite' }} />
            : <Save size={13} color="#334155" />}
        </span>
      </div>
    </div>
  );
}


export default GlobalSettings;
