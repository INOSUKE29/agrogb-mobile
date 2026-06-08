import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, MapPin, Phone, Mail, MoreVertical, ShieldAlert } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function MeusClientesScreen() {
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulário de vínculo
    const [emailProdutor, setEmailProdutor] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadClientes = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .eq('agronomo_id', user.id);
            
            if (data) {
                setClientes(data);
            }
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClientes();
    }, []);

    const handleVincular = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Agora usamos a tabela mestre 'clientes'
            // O formulário pede apenas o email. Se houver um usuário no auth com este email e role 'cliente',
            // nós atualizaríamos o agronomo_id dele. Mas por limitação do RLS para o Agrônomo atualizar de forma global,
            // em produção, isso poderia chamar uma Edge Function ou ser feito via ADM. 
            // Para o MVP (Simulação local), criamos um cliente fake ou atualizamos:
            
            const { error } = await supabase.from('clientes').insert({
                agronomo_id: user.id,
                email: emailProdutor,
                nome: emailProdutor.split('@')[0] || 'Produtor',
            });

            if (error) throw error;
            
            alert('Produtor vinculado com sucesso!');
            setIsModalOpen(false);
            setEmailProdutor('');
            loadClientes();
            
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            alert('Erro ao vincular: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* CABEÇALHO */}
            {!selectedClient ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Meus Clientes</h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1">
                            Gerencie sua carteira de produtores e acesse o perfil técnico de cada fazenda.
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Vincular Produtor</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                    <div>
                        <button 
                            onClick={() => setSelectedClient(null)}
                            className="text-[var(--color-muted)] hover:text-white mb-2 flex items-center gap-2 transition-colors font-bold text-sm"
                        >
                            ← Voltar para a lista
                        </button>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            {selectedClient.nome || selectedClient.email}
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedClient.cpf_cnpj || 'CPF/CNPJ não informado'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-5 rounded-xl border border-white/10 transition-all flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Ligar
                        </button>
                        <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-green-500/20 transition-all">
                            Nova Recomendação
                        </button>
                    </div>
                </div>
            )}

            {/* CONTEÚDO */}
            {!selectedClient ? (
                <>
                    {/* BARRA DE PESQUISA */}
                    <div className="glass p-4 rounded-2xl mb-8 flex items-center gap-4">
                        <Search className="w-5 h-5 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar produtor por nome, fazenda ou email..." 
                            className="bg-transparent border-none text-white outline-none w-full placeholder-[var(--color-muted)]"
                        />
                    </div>

                    {/* LISTA DE CLIENTES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-12 text-[var(--color-muted)]">Carregando carteira de clientes...</div>
                        ) : clientes.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-24 glass rounded-3xl">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Users className="w-10 h-10 text-[var(--color-muted)]" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Nenhum cliente vinculado</h2>
                                <p className="text-[var(--color-muted)] mb-8 text-center max-w-md">
                                    Você ainda não possui produtores na sua carteira. Vincule um novo produtor para começar a enviar recomendações.
                                </p>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all"
                                >
                                    Vincular meu primeiro produtor
                                </button>
                            </div>
                        ) : (
                            clientes.map((link, idx) => (
                                <div key={idx} className="glass p-6 rounded-2xl group hover:-translate-y-1 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold text-xl">
                                                {(link.nome || link.email || 'C').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold text-lg">{link.nome || link.email}</h3>
                                                <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Ativo</span>
                                            </div>
                                        </div>
                                        <button className="text-[var(--color-muted)] hover:text-white transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3 mt-6">
                                        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                                            <Mail className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{link.email || 'Email não cadastrado'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{link.telefone || 'Telefone não informado'}</span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setSelectedClient(link)}
                                        className="w-full mt-6 py-2.5 rounded-xl border border-[var(--color-border)] text-white hover:bg-white/5 transition-all text-sm font-bold"
                                    >
                                        Ver Perfil Técnico
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in-up">
                    <h3 className="text-xl font-bold text-white mb-6">Módulos da Propriedade</h3>
                    
                    {/* SUPER GRADE (Dashboard do Agrônomo para o Cliente) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {[
                            { nome: 'Resumo', icon: '📊', color: 'bg-blue-500/20 text-blue-400' },
                            { nome: 'Propriedades', icon: '🗺️', color: 'bg-green-500/20 text-green-400' },
                            { nome: 'Talhões', icon: '📍', color: 'bg-emerald-500/20 text-emerald-400' },
                            { nome: 'Culturas', icon: '🌱', color: 'bg-lime-500/20 text-lime-400' },
                            { nome: 'Solo', icon: '🟤', color: 'bg-amber-500/20 text-amber-400' },
                            { nome: 'Foliar', icon: '🍃', color: 'bg-teal-500/20 text-teal-400' },
                            { nome: 'Aplicações', icon: '🚜', color: 'bg-orange-500/20 text-orange-400' },
                            { nome: 'Estoque', icon: '📦', color: 'bg-indigo-500/20 text-indigo-400' },
                            { nome: 'Recomendações', icon: '📝', color: 'bg-purple-500/20 text-purple-400' },
                            { nome: 'Visitas', icon: '📅', color: 'bg-rose-500/20 text-rose-400' }
                        ].map((modulo, idx) => (
                            <div key={idx} className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-1 hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${modulo.color} group-hover:scale-110 transition-transform`}>
                                    {modulo.icon}
                                </div>
                                <span className="text-white font-bold text-sm">{modulo.nome}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 glass p-8 rounded-3xl text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                            <ShieldAlert className="w-8 h-8 text-[var(--color-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Visão do Agrônomo (Leitura)</h3>
                        <p className="text-[var(--color-muted)] max-w-lg mx-auto">
                            Você está visualizando os dados da fazenda em modo leitura. 
                            O produtor gerencia as operações financeiras e de estoque localmente. 
                            Você pode interagir enviando Recomendações e registrando Visitas.
                        </p>
                    </div>
                </div>
            )}

            {/* MODAL VINCULAR CLIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                            <Users className="w-6 h-6 text-green-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">Vincular Produtor</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-6">
                            Informe o e-mail do produtor. Ele receberá um convite ou será vinculado automaticamente caso já possua conta.
                        </p>

                        <form onSubmit={handleVincular} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">E-mail do Produtor *</label>
                                <input 
                                    type="email"
                                    required
                                    value={emailProdutor}
                                    onChange={(e) => setEmailProdutor(e.target.value)}
                                    className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors"
                                    placeholder="produtor@fazenda.com"
                                />
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 mt-4">
                                <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0" />
                                <p className="text-xs text-yellow-200">
                                    O produtor precisará aceitar o vínculo pelo aplicativo dele para você ter acesso aos talhões e estoque.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-white font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Vinculando...' : 'Confirmar Vínculo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
