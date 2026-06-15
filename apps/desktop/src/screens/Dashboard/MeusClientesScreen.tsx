import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, MapPin, Phone, Mail, MoreVertical, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AgronomistService } from '../../../../../packages/services/src/agronomistService';
import type { LinkedClient } from '../../../../../packages/services/src/agronomistService';
import AreasEPlantioScreen from './AreasEPlantioScreen';
import EstoqueScreen from './EstoqueScreen';
import RecomendacoesScreen from './RecomendacoesScreen';
import VisitasTecnicasScreen from './VisitasTecnicasScreen';
import ManejoDashboard from './Manejo/ManejoDashboard';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export default function MeusClientesScreen() {
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<LinkedClient[]>([]);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [activeViewerModule, setActiveViewerModule] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteCode, setInviteCode] = useState<string>('');
    
    const navigate = useNavigate();
    const { setClientOverrideId } = useAuth();
    const { setBreadcrumbs, setTitle } = useBreadcrumbs();
    
    // Atualiza Breadcrumbs e Título globalmente
    useEffect(() => {
        const baseCrumbs = [
            { label: 'Dashboard', path: '/dashboard/agronomo' },
            { 
                label: 'Clientes', 
                onClick: () => { 
                    setSelectedClient(null); 
                    setActiveViewerModule(null); 
                    setClientOverrideId(null); 
                } 
            }
        ];

        if (selectedClient) {
            const clientName = selectedClient.nome || selectedClient.email;
            if (!activeViewerModule) {
                setBreadcrumbs([...baseCrumbs, { label: clientName }]);
                setTitle(clientName);
            } else {
                baseCrumbs.push({ label: clientName, onClick: () => setActiveViewerModule(null) });
                
                const moduleMap: Record<string, string> = {
                    'GERAL': 'Dados Gerais',
                    'AREAS': 'Talhões e Mapas',
                    'MANEJO': 'Análises de Solo',
                    'ESTOQUE': 'Estoque Técnico',
                    'RECEITAS': 'Recomendações e Receituários',
                    'LAUDOS': 'Visitas Técnicas e Fotos',
                    'RELATORIOS': 'Relatórios Técnicos'
                };
                
                const moduleName = moduleMap[activeViewerModule] || activeViewerModule;
                setBreadcrumbs([...baseCrumbs, { label: moduleName }]);
                setTitle(moduleName);
            }
        } else {
            setBreadcrumbs([{ label: 'Dashboard', path: '/dashboard/agronomo' }, { label: 'Meus Clientes' }]);
            setTitle('Meus Clientes');
        }
        
        // Limpa ao desmontar para evitar vazar breadcrumbs em telas sem contexto
        return () => {
            setBreadcrumbs([]);
            setTitle('');
        };
    }, [selectedClient, activeViewerModule, setBreadcrumbs, setTitle, setClientOverrideId]);
    
    // Motor
    const agronomistService = new AgronomistService(supabase);

    const loadClientes = async () => {
        setLoading(true);
        try {
            // Gera ou busca código de convite do agrônomo
            const code = await agronomistService.generateOrGetInviteCode();
            setInviteCode(code);

            // Busca clientes vinculados (status = ACTIVE)
            const links = await agronomistService.getLinkedClients();
            setClientes(links);
        } catch (error) {
            console.error("Erro ao carregar clientes", error);
            toast.error("Falha ao carregar carteira de clientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClientes();
    }, []);

    const handleWhatsAppInvite = () => {
        const codigoFormatado = inviteCode || 'AGR-0000';
        const msg = `Olá! Sou seu Consultor Agronômico. Baixe o aplicativo AgroGB para acompanhar minhas recomendações para sua fazenda. Use meu código ${codigoFormatado} no seu cadastro. Link: https://agrogb.app`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank');
        setIsModalOpen(false);
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* CABEÇALHO */}
            {!selectedClient ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[rgba(255,255,255,0.05)] pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Meus Clientes</h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1">
                            Central de CRM Agronômico: Gerencie e acesse a ficha técnica de seus produtores.
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Novo Produtor</span>
                    </button>
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[rgba(255,255,255,0.05)] pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            {selectedClient.nome || selectedClient.email}
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {selectedClient.cpf_cnpj || 'CPF/CNPJ não informado'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                const phone = selectedClient.telefone || selectedClient.celular;
                                if (phone) {
                                    // Remove tudo que não for número
                                    const cleanPhone = phone.replace(/\\D/g, '');
                                    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                                } else {
                                    toast.error('Cliente não possui telefone cadastrado');
                                }
                            }}
                            className="bg-transparent hover:bg-white/5 text-white font-bold py-2.5 px-5 rounded-xl border border-[rgba(255,255,255,0.1)] transition-all flex items-center gap-2"
                        >
                            <Phone className="w-4 h-4" /> Ligar
                        </button>
                        <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl transition-all">
                            Nova Recomendação
                        </button>
                    </div>
                </div>
            )}

            {/* CONTEÚDO */}
            {!selectedClient ? (
                <>
                    {/* BARRA DE PESQUISA */}
                    <div className="premium-card p-4 rounded-xl mb-6 flex items-center gap-4">
                        <Search className="w-5 h-5 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome, e-mail ou documento..." 
                            className="bg-transparent border-none text-white outline-none w-full placeholder-[var(--color-muted)] font-medium"
                        />
                    </div>

                    {/* TABELA DE CLIENTES (ERP) */}
                    <div className="premium-card rounded-2xl overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12 text-[var(--color-muted)]">Carregando carteira...</div>
                        ) : clientes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Users className="w-12 h-12 text-[var(--color-muted)] mb-4 opacity-50" />
                                <h2 className="text-xl font-bold text-white mb-2">Carteira Vazia</h2>
                                <p className="text-[var(--color-muted)] text-sm mb-6 text-center max-w-sm">
                                    Nenhum produtor vinculado. Inicie vinculando um e-mail para ter acesso ao caderno agrícola.
                                </p>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-transparent hover:bg-white/5 text-white font-bold py-2.5 px-6 rounded-xl border border-[rgba(255,255,255,0.1)] transition-all"
                                >
                                    Adicionar Cliente
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
                                            <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Produtor / Razão Social</th>
                                            <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider hidden md:table-cell">Contato</th>
                                            <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                                            <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(255,255,255,0.02)]">
                                        {clientes.map((link, idx) => (
                                            <tr key={idx} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-[#0a192f] border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-green-400 font-bold text-lg">
                                                            {(link.nome || link.email || 'C').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-white">{link.nome_completo || link.email}</div>
                                                            <div className="text-xs text-[var(--color-muted)] mt-0.5">{link.email || 'Sem e-mail'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                                                        <Phone className="w-4 h-4 opacity-50" />
                                                        {(link as any).telefone || '(00) 00000-0000'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                        Ativo
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => setSelectedClient(link)}
                                                        className="bg-transparent hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded-lg text-sm transition-all"
                                                    >
                                                        Abrir Ficha
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="animate-fade-in-up">
                    {!activeViewerModule ? (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldAlert className="w-5 h-5 text-green-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Painel Operacional 360º (Leitura)</h3>
                            </div>
                            
                            {/* SUPER GRADE (Dashboard do Agrônomo para o Cliente) */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {[
                                    { nome: 'Dados Gerais', id: 'GERAL', icon: '📋', border: 'border-gray-500/30' },
                                    { nome: 'Localização/Mapa', id: 'AREAS', icon: '🗺️', border: 'border-green-500/30' },
                                    { nome: 'Talhões e Safras', id: 'AREAS', icon: '📍', border: 'border-emerald-500/30' },
                                    { nome: 'Análises de Solo/Folha', id: 'MANEJO', icon: '🧪', border: 'border-amber-500/30' },
                                    { nome: 'Estoque Técnico', id: 'ESTOQUE', icon: '📦', border: 'border-indigo-500/30' },
                                    { nome: 'Recomendações', id: 'RECEITAS', icon: '🌿', border: 'border-teal-500/30' },
                                    { nome: 'Receituários', id: 'RECEITAS', icon: '📄', border: 'border-purple-500/30' },
                                    { nome: 'Visitas Técnicas', id: 'LAUDOS', icon: '📅', border: 'border-rose-500/30' },
                                    { nome: 'Monitoramento', id: 'LAUDOS', icon: '🌱', border: 'border-lime-500/30' },
                                    { nome: 'Fotos', id: 'LAUDOS', icon: '📸', border: 'border-cyan-500/30' },
                                    { nome: 'Relatórios', id: 'RELATORIOS', icon: '📊', border: 'border-blue-500/30' }
                                ].map((modulo, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            setClientOverrideId(selectedClient.client_id);
                                            setActiveViewerModule(modulo.id);
                                        }}
                                        className={`premium-card p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:-translate-y-1 hover:bg-[rgba(255,255,255,0.02)] transition-all cursor-pointer border-t-2 ${modulo.border} group`}
                                    >
                                        <div className={`text-2xl group-hover:scale-110 transition-transform`}>
                                            {modulo.icon}
                                        </div>
                                        <span className="text-white font-bold text-xs tracking-wide">{modulo.nome}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 border-t border-[rgba(255,255,255,0.05)] pt-6 flex items-start gap-4">
                                <div className="bg-[#0a192f] p-3 rounded-lg border border-[rgba(255,255,255,0.05)] shrink-0">
                                    <ShieldAlert className="w-5 h-5 text-[var(--color-muted)]" />
                                </div>
                                <div>
                                    <p className="text-[var(--color-muted)] text-sm">
                                        <strong className="text-white">Modo de Acesso Técnico Restrito:</strong> Como agrônomo, você tem acesso apenas de leitura (visualização) aos módulos técnicos do produtor. Módulos financeiros, comerciais ou de maquinário não estão disponíveis.
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#0a192f] border border-[rgba(255,255,255,0.05)] p-6 rounded-2xl relative min-h-[500px]">
                            <div className="absolute top-2 right-4 z-10 pointer-events-none">
                                <span className="bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-lg shadow-orange-500/50 flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Visualização do Cliente
                                </span>
                            </div>
                            
                            {/* Renderizador do Módulo Interno */}
                            <ErrorBoundary>
                                {activeViewerModule === 'GERAL' && <div className="p-8 text-center text-white font-bold">Resumo da Propriedade (Em Desenvolvimento)</div>}
                                {activeViewerModule === 'AREAS' && <AreasEPlantioScreen />}
                                {activeViewerModule === 'MANEJO' && <ManejoDashboard />}
                                {activeViewerModule === 'ESTOQUE' && <EstoqueScreen />}
                                {activeViewerModule === 'RECEITAS' && <RecomendacoesScreen />}
                                {activeViewerModule === 'LAUDOS' && <VisitasTecnicasScreen />}
                                {activeViewerModule === 'RELATORIOS' && <div className="p-8 text-center text-white font-bold">Relatórios Técnicos (Em Desenvolvimento)</div>}
                            </ErrorBoundary>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL VINCULAR CLIENTE */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="premium-card p-8 rounded-2xl w-full max-w-md relative border border-[rgba(255,255,255,0.05)] shadow-2xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center mb-6">
                            <Users className="w-6 h-6 text-green-400" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Convite WhatsApp</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-6">
                            Envie o seu código exclusivo diretamente para o WhatsApp do produtor. Quando ele se cadastrar, o vínculo será automático.
                        </p>

                        <div className="bg-[#0a192f] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 text-center mb-6">
                            <p className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest mb-2">Seu Código de Consultor</p>
                            <div className="text-3xl font-black text-white tracking-widest bg-[rgba(255,255,255,0.02)] py-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                                {inviteCode || '...'}
                            </div>
                        </div>

                        <button 
                            onClick={handleWhatsAppInvite}
                            className="w-full py-4 rounded-xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black shadow-lg shadow-[#25D366]/20 transition-all flex items-center justify-center gap-3 text-lg mb-4"
                        >
                            <Phone className="w-5 h-5" />
                            Convidar via WhatsApp
                        </button>

                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-3 rounded-xl bg-transparent border border-[rgba(255,255,255,0.1)] text-white font-bold hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
