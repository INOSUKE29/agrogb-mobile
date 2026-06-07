import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import {
    Users as UsersIcon, ShieldAlert, CheckCircle, Shield,
    Loader2, Plus, X, Eye, EyeOff, UserCheck, UserX, Leaf, User
} from 'lucide-react';
import { createPortal } from 'react-dom';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

const ROLES = [
    { id: 'ADMIN',    label: 'Administrador', color: 'purple',  icon: Shield,      desc: 'Acesso total ao sistema' },
    { id: 'AGRONOMO', label: 'Agrônomo',       color: 'green',   icon: Leaf,        desc: 'Dashboard do agrônomo'  },
    { id: 'CLIENTE',  label: 'Agricultor',     color: 'yellow',    icon: User,        desc: 'Portal do agricultor'   },
];

const roleStyle: Record<string, string> = {
    ADMIN:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    AGRONOMO: 'bg-green-500/20  text-green-400  border-green-500/30',
    AGRICULTOR:'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    CLIENTE:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function UsersScreen() {
    const [profiles, setProfiles]   = useState<Profile[]>([]);
    const [loading, setLoading]     = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [showPass, setShowPass]   = useState(false);

    // form
    const [formName,  setFormName]  = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPass,  setFormPass]  = useState('');
    const [formRole,  setFormRole]  = useState('CLIENTE');
    const [formAgronomoId, setFormAgronomoId] = useState('');
    const [formError, setFormError] = useState('');

    // ── fetch ────────────────────────────────────────────────────────────────
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProfiles(data || []);
        } catch (e: any) {
            console.error('Erro ao buscar usuários:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // ── criar usuário ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setFormError('');
        if (!formEmail.trim()) return setFormError('E-mail obrigatório.');
        if (formPass.length < 6)  return setFormError('Senha deve ter ao menos 6 caracteres.');

        setSaving(true);
        try {
            // Salva a sessão atual do Admin para restaurar depois
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            // Cria a conta do novo usuário
            const { data: authData, error: authErr } = await supabase.auth.signUp({
                email: formEmail.toLowerCase().trim(),
                password: formPass,
                options: { 
                    data: { 
                        nome_completo: formName.trim(),
                        full_name: formName.trim(),
                        role: formRole,
                        nivel: formRole
                    } 
                },
            });
            
            if (authErr) throw authErr;

            const userId = authData?.user?.id;
            if (!userId) throw new Error('Não foi possível obter o ID do usuário após a criação.');

            // Se for cliente, cria o registro na tabela clientes já vinculado ao agrônomo
            if (formRole === 'CLIENTE') {
                const { error: clienteErr } = await supabase.from('clientes').insert({
                    id: userId,
                    agronomo_id: formAgronomoId || null,
                    nome: formName.trim(),
                    email: formEmail.toLowerCase().trim()
                });
                if (clienteErr) console.warn("Erro ao criar registro na tabela clientes:", clienteErr);
            }

            // Restaura a sessão do Admin imediatamente
            if (adminSession) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token,
                });
            }

            // Sucesso
            setShowModal(false);
            resetForm();
            setTimeout(() => fetchUsers(), 1500); // pequeno delay para o trigger criar o perfil
            alert(`✅ Usuário criado!\n\n${formName || formEmail}\nRole: ${formRole}\n\nJá pode fazer login no app mobile.`);


        } catch (e: any) {
            let errorMsg = e.message || 'Erro ao criar usuário.';
            
            // Traduzir erro de senha fraca do Supabase
            if (errorMsg.includes('Password should contain at least one character of each')) {
                errorMsg = 'A senha do Supabase exige: Pelo menos 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial (!@#$...). Para usar senhas simples, desative a política de senhas fortes no painel do Supabase (Authentication -> Providers -> Email).';
            }
            
            setFormError(errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormName(''); setFormEmail(''); setFormPass('');
        setFormRole('CLIENTE'); setFormAgronomoId(''); setFormError(''); setShowPass(false);
    };

    // ── alterar role ─────────────────────────────────────────────────────────
    const updateRole = async (id: string, newRole: string) => {
        try {
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
            if (error) throw error;
            fetchUsers();
        } catch (e: any) {
            alert('Erro ao alterar nível: ' + e.message);
        }
    };

    // ── bloquear/desbloquear ──────────────────────────────────────────────────
    const toggleActive = async (id: string, current: boolean) => {
        const action = current ? 'bloquear' : 'reativar';
        if (!window.confirm(`Deseja ${action} este usuário?`)) return;
        try {
            const { error } = await supabase.from('profiles')
                .update({ is_active: !current }).eq('id', id);
            if (error) throw error;
            fetchUsers();
        } catch (e: any) {
            alert('Erro: ' + e.message);
        }
    };

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in pb-12">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-[var(--color-primary)]" />
                        Gestão de Acessos
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Crie e gerencie usuários. Acesso refletido imediatamente no app mobile.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #10B981, #047857)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
                >
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {ROLES.map(r => {
                    const count = profiles.filter(p => p.role === r.id || p.role === r.id.toUpperCase()).length;
                    const Icon = r.icon;
                    return (
                        <div key={r.id} className="glass rounded-2xl p-4 border border-[var(--color-border)] flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${r.color}-500/15`}>
                                <Icon className={`w-5 h-5 text-${r.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{count}</p>
                                <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">{r.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabela */}
            {loading ? (
                <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-[var(--color-primary)]" />
                    <p className="font-bold">Carregando usuários da nuvem...</p>
                </div>
            ) : profiles.length === 0 ? (
                <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <ShieldAlert className="w-12 h-12 mb-4" />
                    <p className="font-bold text-white text-lg mb-2">Nenhum usuário encontrado</p>
                    <p className="text-sm text-center max-w-sm">Verifique se as permissões RLS do Supabase permitem leitura da tabela <code>profiles</code>.</p>
                </div>
            ) : (
                <div className="glass rounded-2xl overflow-hidden border border-[var(--color-border)]">
                    <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                        <thead>
                            <tr className="bg-[var(--color-background)]/80 border-b border-[var(--color-border)]">
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Usuário</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Criado em</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-center">Nível Atual</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(row => {
                                const isAdmin = row.role === 'admin' || row.role === 'ADMIN';
                                const isActive = row.is_active !== false;
                                const badgeClass = roleStyle[row.role] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                                const initials = (row.full_name || row.email || 'U').charAt(0).toUpperCase();

                                return (
                                    <tr key={row.id} className={`border-b border-[var(--color-border)] hover:bg-white/5 transition-colors ${!isActive ? 'opacity-50' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-sm">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">{row.full_name || '—'}</p>
                                                    <p className="text-xs text-[var(--color-muted)]">{row.email}</p>
                                                    <p className="text-xs text-[var(--color-muted)] font-mono">ID: {row.id.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-[var(--color-muted)] font-medium">
                                            {row.created_at ? format(parseISO(row.created_at), 'dd/MM/yyyy HH:mm') : '—'}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                                                {isAdmin ? <Shield className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                                {row.role?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${isActive ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                                                {isActive ? '● ATIVO' : '● BLOQUEADO'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {!isAdmin && (
                                                    <>
                                                        <select
                                                            value={row.role?.toUpperCase() || 'CLIENTE'}
                                                            onChange={(e) => updateRole(row.id, e.target.value)}
                                                            className="bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-1.5 px-3 text-white text-xs font-bold focus:outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer"
                                                        >
                                                            <option value="CLIENTE">Agricultor</option>
                                                            <option value="AGRONOMO">Agrônomo</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => toggleActive(row.id, isActive)}
                                                            title={isActive ? 'Bloquear' : 'Reativar'}
                                                            className={`p-2 rounded-xl border transition-all ${isActive ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}
                                                        >
                                                            {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                                {isAdmin && (
                                                    <span className="text-xs text-[var(--color-muted)] font-medium">Nível Máximo</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* ── MODAL: Novo Usuário ───────────────────────────────────────────── */}
            {showModal && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div
                        className="w-full my-auto rounded-3xl border border-white/10"
                        style={{ maxWidth: 'clamp(320px, 90vw, 480px)', background: '#0D1711', padding: 'clamp(20px, 3vw, 32px)' }}
                    >

                        {/* header modal */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-white">👤 Novo Usuário</h2>
                                <p className="text-xs text-green-400 font-bold mt-1">☁️ Criado no Supabase — acesso imediato ao app</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* role cards */}
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Tipo de Acesso</p>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {ROLES.map(r => {
                                const Icon = r.icon;
                                const active = formRole === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => setFormRole(r.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${active ? 'bg-' + r.color + '-500/15 border-' + r.color + '-500/50' : 'bg-white/3 border-white/8 hover:bg-white/5'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${active ? 'text-' + r.color + '-400' : 'text-gray-500'}`} />
                                        <span className={`text-xs font-bold ${active ? 'text-' + r.color + '-400' : 'text-gray-500'}`}>{r.label}</span>
                                        <span className="text-[10px] text-gray-600 text-center leading-tight">{r.desc}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* campos */}
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Dados do Usuário</p>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Nome completo"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/8 text-white placeholder-gray-600 text-sm font-medium focus:outline-none focus:border-green-500/50 transition-all"
                            />
                            <input
                                type="email"
                                placeholder="E-mail *"
                                value={formEmail}
                                onChange={e => setFormEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/8 text-white placeholder-gray-600 text-sm font-medium focus:outline-none focus:border-green-500/50 transition-all"
                            />
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Senha (mín. 6 caracteres) *"
                                    value={formPass}
                                    onChange={e => setFormPass(e.target.value)}
                                    className="w-full px-4 py-3 pr-12 rounded-2xl bg-black/40 border border-white/8 text-white placeholder-gray-600 text-sm font-medium focus:outline-none focus:border-green-500/50 transition-all"
                                />
                                <button
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            
                            {formRole === 'cliente' && (
                                <div className="mt-2">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-2">Vincular a um Agrônomo</p>
                                    <select
                                        value={formAgronomoId}
                                        onChange={e => setFormAgronomoId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/8 text-white text-sm font-medium focus:outline-none focus:border-green-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Sem vínculo imediato (Adicionar depois)</option>
                                        {profiles.filter(p => p.role?.toUpperCase() === 'AGRONOMO').map(agro => (
                                            <option key={agro.id} value={agro.id}>{agro.full_name || agro.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <p className="text-[10px] text-gray-500 font-medium px-2 leading-tight">
                                A senha deve conter pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$...).
                            </p>
                        </div>

                        {/* erro */}
                        {formError && (
                            <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                                ⚠️ {formError}
                            </div>
                        )}

                        {/* botão */}
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="mt-6 w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #10B981, #047857)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                            {saving ? 'Criando...' : 'CRIAR USUÁRIO'}
                        </button>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
