import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../services/supabase';
import { format, parseISO, isToday, isThisMonth } from 'date-fns';
import {
    Users as UsersIcon, ShieldAlert, CheckCircle, Shield,
    Loader2, Plus, X, Eye, EyeOff, UserCheck, UserX, Leaf, User,
    Search, Filter, ChevronDown, ChevronUp, History, Activity, AlertCircle, Calendar, Star, Hash
} from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_access?: string;
    status?: string;
    plan_type?: string;
    empresa?: string;
}

interface AuditLog {
    id: string;
    action_type: string;
    description: string;
    created_at: string;
    actor_id: string;
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
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    
    // Filtros e Pesquisa
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    
    // Ordenação
    const [sortField, setSortField] = useState<'name' | 'created_at' | 'last_access' | 'role' | 'status'>('created_at');
    const [sortAsc, setSortAsc] = useState(false);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // form
    const [formName,  setFormName]  = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPass,  setFormPass]  = useState('');
    const [formRole,  setFormRole]  = useState('CLIENTE');
    const [formAgronomoId, setFormAgronomoId] = useState('');
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [showPass, setShowPass] = useState(false);

    // ── fetch ────────────────────────────────────────────────────────────────
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            
            // Tratamento mock para last_access e outras infos que possam faltar se a tabela n tiver dados
            const enrichedData = data?.map(d => ({
                ...d,
                last_access: d.last_access || d.created_at, // mock
                status: d.status || (d.is_active !== false ? 'ATIVO' : 'BLOQUEADO'),
                plan_type: d.plan_type || 'TESTE',
                empresa: d.empresa || 'AgroGB Demo',
            })) || [];

            setProfiles(enrichedData);
        } catch (e: any) {
            console.error('Erro ao buscar usuários:', e);
            toast.error('Erro ao carregar lista de usuários.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('target_user_id', userId)
                .order('created_at', { ascending: false });
            
            if (!error && data) {
                setAuditLogs(data);
            }
        } catch (e) {
            console.error("Erro ao buscar logs", e);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const kpis = useMemo(() => {
        return {
            total: profiles.length,
            ativosHoje: profiles.filter(p => p.last_access && isToday(parseISO(p.last_access))).length,
            bloqueados: profiles.filter(p => p.status === 'BLOQUEADO' || p.is_active === false).length,
            novosMes: profiles.filter(p => p.created_at && isThisMonth(parseISO(p.created_at))).length,
        };
    }, [profiles]);

    // ── FILTROS E ORDENACAO E PAGINACAO ──────────────────────────────────────
    const filteredAndSortedProfiles = useMemo(() => {
        let result = profiles;

        // Filtro Busca
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(p => 
                (p.full_name && p.full_name.toLowerCase().includes(lowerSearch)) ||
                (p.email && p.email.toLowerCase().includes(lowerSearch)) ||
                (p.id.toLowerCase().includes(lowerSearch)) ||
                (p.empresa && p.empresa.toLowerCase().includes(lowerSearch))
            );
        }

        // Filtros avançados
        if (filterRole) result = result.filter(p => p.role?.toUpperCase() === filterRole);
        if (filterStatus) result = result.filter(p => p.status === filterStatus);
        if (filterPlan) result = result.filter(p => p.plan_type === filterPlan);

        // Ordenação
        result.sort((a, b) => {
            let valA: any = a.created_at;
            let valB: any = b.created_at;

            if (sortField === 'name') { valA = a.full_name || ''; valB = b.full_name || ''; }
            if (sortField === 'last_access') { valA = a.last_access || ''; valB = b.last_access || ''; }
            if (sortField === 'role') { valA = a.role || ''; valB = b.role || ''; }
            if (sortField === 'status') { valA = a.status || ''; valB = b.status || ''; }

            if (valA < valB) return sortAsc ? -1 : 1;
            if (valA > valB) return sortAsc ? 1 : -1;
            return 0;
        });

        return result;
    }, [profiles, searchTerm, filterRole, filterStatus, filterPlan, sortField, sortAsc]);

    const paginatedProfiles = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedProfiles.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedProfiles, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedProfiles.length / itemsPerPage);

    // ── criar usuário ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setFormError('');
        if (!formEmail.trim()) return setFormError('E-mail obrigatório.');
        if (formPass.length < 6)  return setFormError('Senha deve ter ao menos 6 caracteres.');

        setSaving(true);
        try {
            const { data: { session: adminSession } } = await supabase.auth.getSession();

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

            if (formRole === 'CLIENTE') {
                const { error: clienteErr } = await supabase.from('clientes').insert({
                    id: userId,
                    agronomo_id: formAgronomoId || null,
                    nome: formName.trim(),
                    email: formEmail.toLowerCase().trim()
                });
                if (clienteErr) console.warn("Erro ao criar registro na tabela clientes:", clienteErr);
            }

            // Auditoria
            if (adminSession?.user?.id) {
                await supabase.from('audit_logs').insert([{
                    actor_id: adminSession.user.id,
                    target_user_id: userId,
                    action_type: 'CRIACAO_USUARIO',
                    description: `Admin criou o usuário com acesso ${formRole}`
                }]);
            }

            if (adminSession) {
                await supabase.auth.setSession({
                    access_token: adminSession.access_token,
                    refresh_token: adminSession.refresh_token,
                });
            }

            setShowModal(false);
            resetForm();
            setTimeout(() => fetchUsers(), 1500);
            toast.success(`Usuário ${formName || formEmail} criado!`);

        } catch (e: any) {
            let errorMsg = e.message || 'Erro ao criar usuário.';
            if (errorMsg.includes('Password should contain at least one character of each')) {
                errorMsg = 'A senha do Supabase exige: Pelo menos 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial (!@#$...).';
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

    // ── alterar status / role rápida (sem modal) ──────────────────────────────
    const updateRole = async (id: string, newRole: string) => {
        try {
            const { data, error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id).select();
            if (error) throw error;
            
            const { data: userData } = await supabase.auth.getUser();
            await supabase.from('audit_logs').insert([{
                actor_id: userData.user?.id,
                target_user_id: id,
                action_type: 'PERFIL_ALTERADO',
                description: `Acesso alterado para ${newRole}`
            }]);

            toast.success('Nível de acesso alterado.');
            fetchUsers();
            if (selectedUser?.id === id) {
                setSelectedUser({ ...selectedUser, role: newRole });
                fetchAuditLogs(id);
            }
        } catch (e: any) {
            toast.error('Erro ao alterar nível: ' + e.message);
        }
    };

    const toggleActive = async (id: string, currentStatus: string) => {
        const isCurrentlyActive = currentStatus === 'ATIVO';
        const newStatus = isCurrentlyActive ? 'BLOQUEADO' : 'ATIVO';
        
        if (!window.confirm(`Deseja ${isCurrentlyActive ? 'bloquear' : 'reativar'} este usuário?`)) return;
        try {
            const { data, error } = await supabase.from('profiles')
                .update({ is_active: !isCurrentlyActive, status: newStatus }).eq('id', id).select();
            if (error) throw error;
            
            const { data: userData } = await supabase.auth.getUser();
            await supabase.from('audit_logs').insert([{
                actor_id: userData.user?.id,
                target_user_id: id,
                action_type: isCurrentlyActive ? 'BLOQUEIO' : 'REATIVACAO',
                description: `Usuário ${isCurrentlyActive ? 'bloqueado' : 'reativado'} pelo admin.`
            }]);

            toast.success(`Usuário ${isCurrentlyActive ? 'bloqueado' : 'reativado'}!`);
            fetchUsers();
            if (selectedUser?.id === id) {
                setSelectedUser({ ...selectedUser, is_active: !isCurrentlyActive, status: newStatus });
                fetchAuditLogs(id);
            }
        } catch (e: any) {
            toast.error('Erro: ' + e.message);
        }
    };

    const openUserDetails = (user: Profile) => {
        setSelectedUser(user);
        fetchAuditLogs(user.id);
        setShowDetailModal(true);
    }

    const handleSort = (field: 'name' | 'created_at' | 'last_access' | 'role' | 'status') => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    }

    const renderSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortAsc ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />;
    }

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-6">

            {/* Header & Dashboard */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-[var(--color-primary)]" />
                        Gestão de Usuários
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Painel avançado de acessos, auditoria e controle de contas.
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 rounded-xl font-black text-white shadow-lg shadow-green-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" /> Adicionar Usuário
                </button>
            </div>

            {/* KPIs Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <UsersIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Total</p>
                        <p className="text-2xl font-black text-white">{kpis.total}</p>
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Acessos Hoje</p>
                        <p className="text-2xl font-black text-white">{kpis.ativosHoje}</p>
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Bloqueados</p>
                        <p className="text-2xl font-black text-white">{kpis.bloqueados}</p>
                    </div>
                </div>
                <div className="glass p-5 rounded-2xl border border-[var(--color-border)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Novos no Mês</p>
                        <p className="text-2xl font-black text-white">{kpis.novosMes}</p>
                    </div>
                </div>
            </div>

            {/* Controles de Filtro e Busca */}
            <div className="glass p-4 rounded-2xl border border-[var(--color-border)] flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Pesquisar por nome, email, ID, empresa..." 
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[var(--color-muted)]" />
                        <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }} className="bg-[var(--color-background)] border border-[var(--color-border)] text-white text-sm rounded-xl py-3 px-4 outline-none appearance-none">
                            <option value="">Qualquer Tipo</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="AGRONOMO">Agrônomo</option>
                            <option value="CLIENTE">Cliente</option>
                        </select>
                    </div>
                    <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="bg-[var(--color-background)] border border-[var(--color-border)] text-white text-sm rounded-xl py-3 px-4 outline-none appearance-none">
                        <option value="">Qualquer Status</option>
                        <option value="ATIVO">Ativo</option>
                        <option value="BLOQUEADO">Bloqueado</option>
                    </select>
                </div>
            </div>

            {/* Tabela Principal */}
            {loading ? (
                <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-[var(--color-primary)]" />
                    <p className="font-bold">Analisando dados dos usuários...</p>
                </div>
            ) : filteredAndSortedProfiles.length === 0 ? (
                <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <UsersIcon className="w-16 h-16 mb-4 opacity-50" />
                    <p className="font-bold text-white text-xl mb-2">Nenhum resultado encontrado</p>
                    <p className="text-sm text-center">Tente ajustar seus filtros ou termos de pesquisa.</p>
                </div>
            ) : (
                <div className="glass rounded-3xl overflow-hidden border border-[var(--color-border)] flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse" style={{ minWidth: '900px' }}>
                            <thead>
                                <tr className="bg-[var(--color-background)]/80 border-b border-[var(--color-border)]">
                                    <th className="p-5 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                        Usuário {renderSortIcon('name')}
                                    </th>
                                    <th className="p-5 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('role')}>
                                        Nível de Acesso {renderSortIcon('role')}
                                    </th>
                                    <th className="p-5 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                        Status {renderSortIcon('status')}
                                    </th>
                                    <th className="p-5 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('last_access')}>
                                        Último Acesso {renderSortIcon('last_access')}
                                    </th>
                                    <th className="p-5 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedProfiles.map(row => {
                                    const isAdmin = row.role === 'admin' || row.role === 'ADMIN';
                                    const badgeClass = roleStyle[row.role?.toUpperCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                                    const initials = (row.full_name || row.email || 'U').charAt(0).toUpperCase();

                                    return (
                                        <tr key={row.id} className="border-b border-[var(--color-border)] hover:bg-white/5 transition-all cursor-pointer" onClick={() => openUserDetails(row)}>
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/30">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-base">{row.full_name || 'Usuário Sem Nome'}</p>
                                                        <p className="text-sm text-[var(--color-muted)]">{row.email}</p>
                                                        <p className="text-xs text-[var(--color-muted)]/60 font-mono mt-1 flex items-center gap-1"><Hash className="w-3 h-3"/> {row.id.substring(0, 13)}...</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border uppercase tracking-wider ${badgeClass}`}>
                                                    {isAdmin ? <Shield className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                                                    {row.role}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                {(() => {
                                                    const isActive = row.status === 'ATIVO' || row.status === 'active' || row.status === 'true' || row.status === true;
                                                    const statusText = isActive ? 'ATIVO' : 'BLOQUEADO';
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border tracking-wider ${isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                                                            {isActive ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                            {statusText}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{row.last_access ? format(parseISO(row.last_access), 'dd/MM/yyyy') : 'Nunca'}</span>
                                                    <span className="text-xs text-[var(--color-muted)]">{row.last_access ? format(parseISO(row.last_access), 'HH:mm') : ''}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openUserDetails(row)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors border border-[var(--color-border)]">
                                                        Detalhes
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-[var(--color-muted)]">Página {currentPage} de {totalPages} ({filteredAndSortedProfiles.length} resultados)</span>
                            <div className="flex gap-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded-lg bg-white/5 border border-[var(--color-border)] text-white disabled:opacity-30">Anterior</button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded-lg bg-white/5 border border-[var(--color-border)] text-white disabled:opacity-30">Próxima</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── MODAL: Detalhes do Usuário (Nível 3) ──────────────────────────── */}
            {showDetailModal && selectedUser && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowDetailModal(false)}>
                    <div className="glass w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        
                        {/* Header Profile Modal */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-start bg-indigo-900/10">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-3xl border border-indigo-500/30">
                                    {selectedUser.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white">{selectedUser.full_name || 'Sem Nome'}</h2>
                                    <p className="text-indigo-300 font-medium">{selectedUser.email}</p>
                                    <div className="flex gap-2 mt-3">
                                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${roleStyle[selectedUser.role?.toUpperCase()]}`}>{selectedUser.role}</span>
                                        <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${selectedUser.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{selectedUser.status}</span>
                                        <span className="px-3 py-1 rounded-xl text-xs font-black uppercase bg-blue-500/20 text-blue-400">Plano: {selectedUser.plan_type}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all"><X className="w-6 h-6"/></button>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Esquerda: Ações e Stats */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest mb-4">Ações Administrativas</h3>
                                    <div className="space-y-3">
                                        <div className="glass p-4 rounded-2xl border border-white/5">
                                            <p className="text-xs font-bold text-gray-400 mb-2">Alterar Nível de Acesso</p>
                                            <select 
                                                value={selectedUser.role?.toUpperCase()} 
                                                onChange={e => updateRole(selectedUser.id, e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="CLIENTE">Agricultor / Cliente</option>
                                                <option value="AGRONOMO">Agrônomo</option>
                                                <option value="ADMIN">Administrador</option>
                                            </select>
                                        </div>

                                        <button 
                                            onClick={() => toggleActive(selectedUser.id, selectedUser.status || 'ATIVO')}
                                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-2 border transition-all ${selectedUser.status === 'ATIVO' ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                                        >
                                            {selectedUser.status === 'ATIVO' ? <><UserX className="w-5 h-5"/> Bloquear Usuário</> : <><UserCheck className="w-5 h-5"/> Reativar Acesso</>}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest mb-4">Estatísticas do Perfil</h3>
                                    <div className="glass p-5 rounded-2xl border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Data de Cadastro</span>
                                            <span className="text-sm font-bold text-white">{format(parseISO(selectedUser.created_at), 'dd/MM/yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Último Acesso</span>
                                            <span className="text-sm font-bold text-white">{selectedUser.last_access ? format(parseISO(selectedUser.last_access), 'dd/MM/yyyy HH:mm') : '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Fazendas Vinculadas</span>
                                            <span className="text-sm font-bold text-white">Mock (0)</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-400">Talhões Ativos</span>
                                            <span className="text-sm font-bold text-white">Mock (0)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Direita: Auditoria (Logs) */}
                            <div className="lg:col-span-2 flex flex-col">
                                <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest mb-4 flex items-center gap-2"><History className="w-4 h-4"/> Histórico de Auditoria</h3>
                                <div className="glass flex-1 rounded-2xl border border-white/5 overflow-hidden p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {auditLogs.length === 0 ? (
                                        <div className="p-8 text-center text-[var(--color-muted)]">
                                            Nenhum registro de auditoria encontrado para este usuário.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-white/5">
                                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)]">Data/Hora</th>
                                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)]">Ação Executada</th>
                                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)]">Detalhe</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.map(log => (
                                                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                                                        <td className="p-4 text-xs text-gray-400 font-mono whitespace-nowrap">{format(parseISO(log.created_at), 'dd/MM/yyyy HH:mm:ss')}</td>
                                                        <td className="p-4">
                                                            <span className="px-2 py-1 bg-white/10 text-white rounded text-[10px] font-bold uppercase tracking-wider">{log.action_type}</span>
                                                        </td>
                                                        <td className="p-4 text-sm text-white">{log.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>,
                document.body
            )}

            {/* ── MODAL: Novo Usuário (Nível 2) ───────────────────────────── */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
                    <div className="glass w-full max-w-lg rounded-3xl p-8 border border-white/10 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-white">Criar Usuário</h2>
                                <p className="text-sm text-green-400 font-bold mt-1">Acesso imediato ao sistema</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>

                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Nível de Permissão</p>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {ROLES.map(r => {
                                const Icon = r.icon;
                                const active = formRole === r.id;
                                return (
                                    <button
                                        key={r.id} onClick={() => setFormRole(r.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${active ? 'bg-' + r.color + '-500/20 border-' + r.color + '-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${active ? 'text-' + r.color + '-400' : 'text-gray-500'}`} />
                                        <span className={`text-xs font-bold ${active ? 'text-' + r.color + '-400' : 'text-gray-500'}`}>{r.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-green-500 outline-none" />
                            <input type="email" placeholder="E-mail *" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-green-500 outline-none" />
                            
                            <div className="relative">
                                <input type={showPass ? 'text' : 'password'} placeholder="Senha Forte *" value={formPass} onChange={e => setFormPass(e.target.value)} className="w-full px-5 py-4 pr-12 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-green-500 outline-none" />
                                <button onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {formError && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold rounded-xl text-center">{formError}</div>}
                            
                            <button onClick={handleCreate} disabled={saving} className="mt-4 w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {saving ? 'CRIANDO...' : 'CONFIRMAR CADASTRO'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
