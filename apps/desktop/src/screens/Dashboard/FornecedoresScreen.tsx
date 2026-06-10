import React, { useState, useEffect, useRef } from 'react';
import { Store, Search, Plus, MapPin, Phone, Mail, MoreVertical, Building2, ExternalLink, Edit2, Trash2, CreditCard, Landmark } from 'lucide-react';
import { supabase } from '../../services/supabase';
import DraggableModal from '../../components/common/DraggableModal';

export default function FornecedoresScreen() {
    const [loading, setLoading] = useState(true);
    const [fornecedores, setFornecedores] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [selectedFornecedor, setSelectedFornecedor] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Formulário de fornecedor
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    
    // Dados de Pagamento
    const [chavePix, setChavePix] = useState('');
    const [banco, setBanco] = useState('');
    const [agencia, setAgencia] = useState('');
    const [contaBancaria, setContaBancaria] = useState('');

    const [submitting, setSubmitting] = useState(false);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = () => setMenuOpen(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadFornecedores = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v2_fornecedores')
                .select('*')
                .order('nome_fantasia', { ascending: true });
            
            if (error && error.code !== '42P01') throw error;
            if (data) {
                setFornecedores(data);
            }
        } catch (error) {
            console.error("Erro ao carregar fornecedores", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFornecedores();
    }, []);

    const handleSaveFornecedor = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                const { error } = await supabase.from('v2_fornecedores')
                    .update({
                        nome_fantasia: nomeFantasia,
                        email: email,
                        telefone: telefone,
                        chave_pix: chavePix,
                        banco: banco,
                        agencia: agencia,
                        conta_bancaria: contaBancaria
                    })
                    .eq('uuid', editingId);

                if (error) throw error;
            } else {
                const { error } = await supabase.from('v2_fornecedores').insert({
                    nome_fantasia: nomeFantasia,
                    email: email,
                    telefone: telefone,
                    chave_pix: chavePix,
                    banco: banco,
                    agencia: agencia,
                    conta_bancaria: contaBancaria
                });

                if (error) throw error;
            }
            
            setIsModalOpen(false);
            setNomeFantasia('');
            setEmail('');
            setTelefone('');
            setChavePix('');
            setBanco('');
            setAgencia('');
            setContaBancaria('');
            setEditingId(null);
            loadFornecedores();
            
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (forn: any) => {
        setEditingId(forn.uuid);
        setNomeFantasia(forn.nome_fantasia || '');
        setEmail(forn.email || '');
        setTelefone(forn.telefone || '');
        setChavePix(forn.chave_pix || '');
        setBanco(forn.banco || '');
        setAgencia(forn.agencia || '');
        setContaBancaria(forn.conta_bancaria || '');
        setIsModalOpen(true);
        setMenuOpen(null);
    };

    const handleDelete = async (uuid: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este fornecedor?')) return;
        try {
            const { error } = await supabase.from('v2_fornecedores').delete().eq('uuid', uuid);
            if (error) throw error;
            loadFornecedores();
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const openNewModal = () => {
        setEditingId(null);
        setNomeFantasia('');
        setEmail('');
        setTelefone('');
        setChavePix('');
        setBanco('');
        setAgencia('');
        setContaBancaria('');
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* CABEÇALHO */}
            {!selectedFornecedor ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <Building2 className="w-4 h-4" /> Gestão de Contatos
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Meus Fornecedores</h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1">
                            Gerencie sua rede de parceiros de negócios e fornecedores de insumos.
                        </p>
                    </div>
                    <button 
                        onClick={openNewModal}
                        className="bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Novo Fornecedor</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                    <div>
                        <button 
                            onClick={() => setSelectedFornecedor(null)}
                            className="text-[var(--color-muted)] hover:text-white mb-2 flex items-center gap-2 transition-colors font-bold text-sm"
                        >
                            ← Voltar para a lista
                        </button>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            {selectedFornecedor.nome_fantasia}
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedFornecedor.cnpj || 'CNPJ não cadastrado'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-5 rounded-xl border border-white/10 transition-all flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Ligar
                        </button>
                        <button className="bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Nova Cotação
                        </button>
                    </div>
                </div>
            )}

            {/* CONTEÚDO */}
            {!selectedFornecedor ? (
                <>
                    {/* BARRA DE PESQUISA */}
                    <div className="glass p-4 rounded-2xl mb-8 flex items-center gap-4">
                        <Search className="w-5 h-5 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar fornecedor por nome ou email..." 
                            className="bg-transparent border-none text-white outline-none w-full placeholder-[var(--color-muted)]"
                        />
                    </div>

                    {/* LISTA DE FORNECEDORES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-12 text-[var(--color-muted)]">Carregando carteira de fornecedores...</div>
                        ) : fornecedores.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 glass rounded-3xl">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Store className="w-10 h-10 text-[var(--color-muted)]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Nenhum fornecedor cadastrado</h2>
                                <p className="text-[var(--color-muted)] mb-8 text-center max-w-md">
                                    Sua agenda de fornecedores está vazia. Comece a cadastrar parceiros para poder enviar cotações.
                                </p>
                                <button 
                                    onClick={openNewModal}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all"
                                >
                                    Cadastrar Primeiro Fornecedor
                                </button>
                            </div>
                        ) : (
                            fornecedores.map((forn, idx) => (
                                <div key={idx} className="glass p-6 rounded-2xl group hover:-translate-y-1 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] font-bold text-xl">
                                                {(forn.nome_fantasia || 'F').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg">{forn.nome_fantasia}</h3>
                                                <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">Ativo</span>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMenuOpen(menuOpen === forn.uuid ? null : String(forn.uuid));
                                                }}
                                                className="text-[var(--color-muted)] hover:text-white transition-colors p-1"
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                            
                                            {menuOpen === forn.uuid && (
                                                <div className="absolute right-0 mt-2 w-48 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl shadow-2xl py-2 z-20 animate-fade-in">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEdit(forn);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-white/5 text-white text-sm flex items-center gap-2"
                                                    >
                                                        <Edit2 className="w-4 h-4" /> Editar
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(String(forn.uuid));
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-white/5 text-red-400 text-sm flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Excluir
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                                            <Mail className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{forn.email || 'Email não cadastrado'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                                            <Phone className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{forn.telefone || 'Telefone não informado'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* DADOS BANCÁRIOS E PIX */}
                                    <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
                                        <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2">Dados de Pagamento</p>
                                        {(forn.chave_pix || forn.banco) ? (
                                            <>
                                                {forn.chave_pix && (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                                                        <CreditCard className="w-4 h-4 text-emerald-400" />
                                                        <span className="truncate">PIX: {forn.chave_pix}</span>
                                                    </div>
                                                )}
                                                {forn.banco && (
                                                    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                                                        <Landmark className="w-4 h-4 text-blue-400" />
                                                        <span className="truncate">
                                                            {forn.banco} {forn.agencia && `| Ag: ${forn.agencia}`} {forn.conta_bancaria && `| Cc: ${forn.conta_bancaria}`}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-xs text-[var(--color-muted)] italic">Nenhum dado de pagamento cadastrado.</p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => setSelectedFornecedor(forn)}
                                        className="w-full mt-6 py-2.5 rounded-xl border border-[var(--color-border)] text-white hover:bg-white/5 transition-all text-sm font-bold"
                                    >
                                        Ver Histórico de Compras
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in-up">
                    <h3 className="text-xl font-bold text-white mb-6">Módulos de Negociação</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                            { nome: 'Resumo', icon: '📊', color: 'bg-blue-500/20 text-blue-400' },
                            { nome: 'Cotações', icon: '📝', color: 'bg-green-500/20 text-green-400' },
                            { nome: 'Pedidos', icon: '📦', color: 'bg-amber-500/20 text-amber-400' },
                            { nome: 'Financeiro', icon: '💵', color: 'bg-emerald-500/20 text-emerald-400' },
                            { nome: 'Contratos', icon: '📄', color: 'bg-purple-500/20 text-purple-400' }
                        ].map((modulo, idx) => (
                            <div key={idx} className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-1 hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${modulo.color} group-hover:scale-110 transition-transform`}>
                                    {modulo.icon}
                                </div>
                                <span className="text-white font-bold text-sm">{modulo.nome}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL NOVO FORNECEDOR */}
            <DraggableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                width="800px"
                title={
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--color-primary)]/20 rounded-xl flex items-center justify-center border border-[var(--color-primary)]/30">
                            <Building2 className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                            <p className="text-[var(--color-muted)] text-sm">
                                {editingId ? 'Atualize as informações da empresa parceira.' : 'Cadastre as informações da empresa parceira.'}
                            </p>
                        </div>
                    </div>
                }
                footer={
                    <div className="flex gap-3 w-full">
                        <button 
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 py-4 rounded-xl border border-[var(--color-border)] text-[var(--color-muted)] font-bold hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" form="fornecedorForm"
                            disabled={submitting}
                            className="flex-[2] py-4 rounded-xl bg-[var(--color-primary)] hover:opacity-90 text-white font-bold shadow-lg shadow-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                        </button>
                    </div>
                }
            >
                <form id="fornecedorForm" onSubmit={handleSaveFornecedor} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Nome Fantasia / Razão Social *</label>
                        <input 
                            type="text"
                            required
                            value={nomeFantasia}
                            onChange={(e) => setNomeFantasia(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="Ex: Agro Insumos S.A"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Telefone / WhatsApp</label>
                        <input 
                            type="text"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="(00) 00000-0000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">E-mail de Contato</label>
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholder="vendas@fornecedor.com"
                        />
                    </div>

                    <div className="border-t border-[var(--color-border)] pt-4 mt-2">
                        <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 flex items-center gap-2">
                            <Landmark className="w-4 h-4" /> Opções de Pagamento
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Chave PIX</label>
                                <input 
                                    type="text"
                                    value={chavePix}
                                    onChange={(e) => setChavePix(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                                    placeholder="CPF/CNPJ, Email, Celular ou Aleatória"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Banco</label>
                                    <input 
                                        type="text"
                                        value={banco}
                                        onChange={(e) => setBanco(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                                        placeholder="Ex: Nubank"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Agência</label>
                                    <input 
                                        type="text"
                                        value={agencia}
                                        onChange={(e) => setAgencia(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                                        placeholder="0001"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Conta</label>
                                    <input 
                                        type="text"
                                        value={contaBancaria}
                                        onChange={(e) => setContaBancaria(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                                        placeholder="12345-6"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </DraggableModal>
        </div>
    );
}
