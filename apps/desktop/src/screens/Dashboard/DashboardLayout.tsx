import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { 
    LayoutDashboard, 
    Users, 
    Sprout, 
    DollarSign, 
    Settings, 
    LogOut,
    Bell,
    Menu,
    Leaf,
    FileText,
    Calendar,
    Map,
    CreditCard,
    ChevronDown,
    Search,
    UserCircle,
    Activity,
    X,
    Package,
    Truck,
    Store,
    ListTodo,
    CloudRain,
    CheckSquare,
    TrendingDown,
    Tags,
    ShoppingCart,
    Car,
    Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, role: contextRole, hasPermission, loading } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    
    // NOVO: Estado do Simulador de Perfil (Role Sandbox)
    const [simulatedRole, setSimulatedRole] = useState<'ADMIN' | 'AGRONOMO' | 'CLIENTE' | null>(null);
    const [realRole, setRealRole] = useState<string | null>(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const isDevPortalUnlocked = sessionStorage.getItem('dev_portal_unlocked') === 'true';
    
    // Accordion state
    const [openGroups, setOpenGroups] = useState<string[]>(['Visão Geral', 'Operação Agrícola']);

    const toggleGroup = (group: string) => {
        setOpenGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
    };

    const [notifications, setNotifications] = useState([
        {
            id: '1',
            title: 'Novo usuário registrado',
            message: 'Carlos Silva solicitou acesso como Agrônomo. Por favor, revise as credenciais no painel de usuários e aprove o acesso.',
            time: 'Há 5 min',
            read: false,
            type: 'info',
            icon: Activity,
            color: 'blue'
        },
        {
            id: '2',
            title: 'Relatório processado',
            message: 'O relatório consolidado de colheita mensal está pronto para download. Você pode acessá-lo na central de relatórios.',
            time: 'Ontem',
            read: false,
            type: 'success',
            icon: FileText,
            color: 'green'
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleOpenNotification = (n: Record<string, string | number | boolean | null>) => {
        setSelectedNotification(n);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
        setShowNotifications(false);
    };

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    };

    useEffect(() => {
        // Redirecionamento inicial baseado nas permissões do motor granular
        if (user) {
            // Se possui permissão de ver tudo (Admin)
            if (hasPermission('view_all_clients') || isDevPortalUnlocked) {
                setRealRole('ADMIN');
            } else if (hasPermission('manage_own_clients')) {
                // Agrônomo
                setRealRole('AGRONOMO');
                if (!simulatedRole) {
                    setSimulatedRole('AGRONOMO');
                    if (location.pathname === '/dashboard') navigate('/dashboard/agronomo');
                }
            } else if (hasPermission('view_owndata')) {
                // Produtor
                setRealRole('CLIENTE');
                if (!simulatedRole) {
                    setSimulatedRole('CLIENTE');
                    if (location.pathname === '/dashboard') navigate('/dashboard/cliente');
                }
            } else if (contextRole) {
                // Fallback para role do profile caso as permissões granulares não estejam configuradas
                setRealRole(contextRole.toUpperCase());
                if (contextRole.toUpperCase() === 'CLIENTE') {
                    setSimulatedRole('CLIENTE');
                    if (location.pathname === '/dashboard') navigate('/dashboard/cliente');
                } else if (contextRole.toUpperCase() === 'AGRONOMO') {
                    setSimulatedRole('AGRONOMO');
                    if (location.pathname === '/dashboard') navigate('/dashboard/agronomo');
                }
            }
        } else if (!user && location.pathname.startsWith('/dashboard')) {
            // BACKDOOR PARA TESTE LOCAL (Se não tiver sessão real, usa o mock)
            // setUser({ email: 'bruno@agrogb.com', id: 'mock-admin' }); <-- Removido para usar o Context
        }
    }, [user, hasPermission, contextRole, navigate, location.pathname, simulatedRole]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    type NavItem = { path: string; label: string; icon: React.ElementType; group?: string };

    const getNavItems = (role: string): NavItem[] => {
        if (role === 'AGRONOMO') {
            return [
                { path: '/dashboard/agronomo', label: 'Dashboard Agrônomo', icon: LayoutDashboard },
                { path: '/dashboard/agronomo/clientes', label: 'Meus Clientes', icon: Users },
                { path: '/dashboard/agronomo/recomendacoes', label: 'Recomendações', icon: FileText },
                { path: '/dashboard/agronomo/visitas', label: 'Visitas Técnicas', icon: Calendar },
            ];
        } else if (role === 'CLIENTE') {
            return [
                { path: '/dashboard/cliente', label: 'Início', icon: LayoutDashboard, group: 'Visão Geral' },
                { path: '/dashboard/cliente/relatorios', label: 'Relatórios', icon: FileText, group: 'Visão Geral' },

                { path: '/dashboard/cliente/manejo', label: 'Manejo da Lavoura', icon: ListTodo, group: 'Operacional' },
                { path: '/dashboard/cliente/areas', label: 'Meus Talhões', icon: Map, group: 'Operacional' },
                { path: '/dashboard/cliente/colheita', label: 'Produção e Colheita', icon: Sprout, group: 'Operacional' },
                
                { path: '/dashboard/cliente/vendas', label: 'Vendas', icon: Store, group: 'Comercial e Financeiro' },
                { path: '/dashboard/cliente/compras', label: 'Compras', icon: ShoppingCart, group: 'Comercial e Financeiro' },
                { path: '/dashboard/cliente/financeiro', label: 'Financeiro', icon: DollarSign, group: 'Comercial e Financeiro' },

                { path: '/dashboard/cliente/estoque', label: 'Estoque', icon: Package, group: 'Logística e Suprimentos' },
                { path: '/dashboard/cliente/encomendas', label: 'Encomendas', icon: Truck, group: 'Logística e Suprimentos' },
                { path: '/dashboard/cliente/frota', label: 'Gestão de Frota', icon: Car, group: 'Logística e Suprimentos' },
            ];
        } else {
            return [
                { path: '/dashboard/admin', label: 'Dashboard Geral', icon: LayoutDashboard },
                { path: '/dashboard/admin/usuarios', label: 'Gestão de Usuários', icon: Users },
                { path: '/dashboard/admin/planos', label: 'Planos e Assinaturas', icon: CreditCard },
                { path: '/dashboard/admin/financeiro', label: 'Financeiro Global', icon: DollarSign },
                { path: '/dashboard/admin/biblioteca', label: 'Biblioteca Global', icon: Database },
            ];
        }
    };

    const navItems = simulatedRole ? getNavItems(simulatedRole) : [];

    const handleRoleChange = (role: 'ADMIN' | 'AGRONOMO' | 'CLIENTE') => {
        setSimulatedRole(role);
        
        // Redireciona para as rotas correspondentes
        if (role === 'ADMIN') navigate('/dashboard/admin');
        else if (role === 'AGRONOMO') navigate('/dashboard/agronomo');
        else if (role === 'CLIENTE') navigate('/dashboard/cliente');
    };

    // Cores dinâmicas baseadas no portal ativo
    const getAccentColorClass = () => {
        if (simulatedRole === 'ADMIN') return 'text-purple-500';
        if (simulatedRole === 'AGRONOMO') return 'text-green-500';
        if (simulatedRole === 'CLIENTE') return 'text-blue-500';
        return 'text-[var(--color-primary)]';
    };

    const getBgColorClass = () => {
        if (simulatedRole === 'ADMIN') return 'bg-purple-500';
        if (simulatedRole === 'AGRONOMO') return 'bg-green-500';
        if (simulatedRole === 'CLIENTE') return 'bg-blue-500';
        return 'bg-[var(--color-primary)]';
    };

    const getBgLightClass = () => {
        if (simulatedRole === 'ADMIN') return 'bg-purple-500/10 hover:bg-purple-500/20';
        if (simulatedRole === 'AGRONOMO') return 'bg-green-500/10 hover:bg-green-500/20';
        if (simulatedRole === 'CLIENTE') return 'bg-blue-500/10 hover:bg-blue-500/20';
        return 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20';
    };

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading || !user) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-gray-900 dark:text-white">Carregando...</div>;

    // TELA DE SELEÇÃO DE PORTAL (MODO AUDITORIA / SIMULADOR FULLSCREEN)
    if (!simulatedRole) {
        return (
            <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 flex flex-col items-center max-w-5xl w-full animate-fade-in">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 overflow-hidden shadow-lg border border-[var(--color-primary)]/20">
                        <img src="/logo.png" alt="AgroGB Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Modo Auditoria</h1>
                    <p className="text-[var(--color-muted)] text-lg mb-12">Selecione qual portal você deseja simular na sessão atual.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                        {/* Admin Card */}
                        <button 
                            onClick={() => handleRoleChange('ADMIN')}
                            className="glass p-10 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 transition-all border-2 border-transparent hover:border-purple-500/50"
                        >
                            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Settings className="w-12 h-12 text-purple-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Portal Admin</h2>
                            <p className="text-[var(--color-muted)] text-sm">Gestão global da plataforma, usuários, planos e fluxo financeiro geral.</p>
                        </button>

                        {/* Agrônomo Card */}
                        <button 
                            onClick={() => handleRoleChange('AGRONOMO')}
                            className="glass p-10 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-2xl hover:shadow-green-500/20 transition-all border-2 border-transparent hover:border-green-500/50"
                        >
                            <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sprout className="w-12 h-12 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Portal Agrônomo</h2>
                            <p className="text-[var(--color-muted)] text-sm">Carteira de clientes, emissão de receituários e visitas técnicas.</p>
                        </button>

                        {/* Agricultor Card */}
                        <div
                            onClick={() => handleRoleChange('CLIENTE')}
                            className="glass p-10 rounded-3xl flex flex-col items-center text-center group hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 transition-all border-2 border-transparent hover:border-blue-500/50"
                        >
                            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Leaf className="w-12 h-12 text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Portal Produtor</h2>
                            <p className="text-[var(--color-muted)] text-sm">Controle da fazenda, talhões, operações agrícolas e financeiro.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: 'var(--color-background)' }}>
            
            {/* SIDEBAR - Navigation Rail / Drawer (8-point system) */}
            <aside
                className={`transition-all duration-300 bg-gradient-to-b from-[#0A101D] to-[#000000] border-r border-[rgba(255,255,255,0.05)] flex flex-col z-20 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${isSidebarOpen ? 'w-64' : 'w-20'}`}
            >
                
                {/* Logo Area */}
                <div
                    className="flex items-center border-b border-[var(--color-border)] shrink-0 hover:bg-[var(--color-foreground)]/5 transition-colors cursor-pointer px-4"
                    style={{ height: '72px' }}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-[var(--color-border)] transition-all">
                        <img src="/logo.png" alt="AgroGB Logo" className="w-full h-full object-cover" />
                    </div>
                    {isSidebarOpen && (
                        <div className="flex flex-col ml-3 animate-slide-in-right overflow-hidden">
                            <span className="font-black text-xl text-white tracking-tight whitespace-nowrap leading-tight">
                                AgroGB
                            </span>
                            <span className="text-xs font-bold text-[#19B34A]">
                                PORTAL {simulatedRole}
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(128,128,128,0.2) transparent' }}>
                    
                    {/* Render Grouped Items */}
                    {simulatedRole === 'CLIENTE' ? (
                        Array.from(new Set(navItems.map(i => i.group))).map(group => (
                            <div key={group || 'geral'} className="mb-2">
                                {/* Group Header */}
                                {isSidebarOpen && group && (
                                    <button 
                                        onClick={() => toggleGroup(group as string)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded-lg"
                                    >
                                        <span>{group}</span>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${openGroups.includes(group) ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                                
                                {/* Group Items */}
                                <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-300 ${(!isSidebarOpen || openGroups.includes(group)) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                    {navItems.filter(i => i.group === group).map((item, _index) => {
                                        const Icon = item.icon;
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className={`flex items-center px-3 min-h-[44px] rounded-xl transition-all duration-200 group focus:outline-none ${
                                                    isActive 
                                                        ? 'bg-[#19B34A]/10 text-[#19B34A] border border-[#19B34A]/20 shadow-sm font-semibold' 
                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1 border border-transparent'
                                                }`}
                                                title={!isSidebarOpen ? item.label : undefined}
                                            >
                                                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#19B34A]' : 'text-white'} ${!isSidebarOpen ? 'mx-auto' : ''}`} />
                                                {isSidebarOpen && <span className={`ml-3 text-sm whitespace-nowrap ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        // Render Flat Items for Admin/Agronomo
                        navItems.map((item, _index) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center px-3 min-h-[44px] rounded-xl transition-all duration-200 group focus:outline-none ${
                                        isActive 
                                            ? 'bg-[#19B34A]/10 text-[#19B34A] border border-[#19B34A]/20 shadow-sm font-semibold' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1 border border-transparent'
                                    }`}
                                    title={!isSidebarOpen ? item.label : undefined}
                                >
                                    <Icon className={`w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#19B34A]' : 'text-white'} ${!isSidebarOpen ? 'mx-auto' : ''}`} />
                                    {isSidebarOpen && <span className={`ml-3 text-sm whitespace-nowrap ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                                </Link>
                            );
                        })
                    )}
                </nav>

                {/* User Area Bottom */}
                <div className="p-4 border-t border-[var(--color-border)] shrink-0">
                    <button 
                        onClick={handleLogout}
                        className={`w-full flex items-center px-3 min-h-[44px] rounded-xl text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 border border-transparent hover:border-[var(--color-danger)]/20 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)] active:scale-95`}
                        title={!isSidebarOpen ? 'Sair do Sistema' : undefined}
                    >
                        <LogOut className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${!isSidebarOpen ? 'mx-auto' : ''}`} />
                        {isSidebarOpen && <span className="ml-3 font-semibold text-sm whitespace-nowrap">Sair do Sistema</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
                
                {/* Header - Premium V8 */}
                <header
                    className="bg-gradient-to-r from-[#0D8C39] to-[#18B34A] rounded-b-3xl flex items-start justify-between z-10 shrink-0 shadow-lg relative mx-2 mt-0 pt-6"
                    style={{ height: '160px', paddingLeft: 'clamp(16px, 2vw, 32px)', paddingRight: 'clamp(16px, 2vw, 32px)' }}
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-white hidden md:block tracking-tight drop-shadow-sm">
                                {navItems.find(i => i.path === location.pathname)?.label || 'Painel Administrativo'}
                            </h2>
                            <p className="text-white/80 text-sm hidden md:block mt-1 font-medium">AgroGB Premium Management</p>
                        </div>
                    </div>

                    {/* BUSCA GLOBAL */}
                    <div className="hidden lg:flex flex-1 max-w-md mx-6 relative">
                        <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="Buscar clientes, relatórios..." 
                            className="w-full bg-gray-100 dark:bg-[#1A1A1A] border border-[var(--color-border)] text-gray-900 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6">
                        
                        {/* NOTIFICAÇÕES */}
                        <div className="relative">
                            <button 
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfileMenu(false);
                                }}
                                className={`relative p-2 transition-colors rounded-full ${showNotifications ? 'bg-white/10 text-gray-900 dark:text-white' : 'text-[var(--color-muted)] hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[var(--color-background)] rounded-full animate-pulse"></span>
                                )}
                            </button>

                            {/* DROPDOWN NOTIFICAÇÕES */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-[var(--color-border)] bg-white dark:bg-[#121212] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-50 animate-fade-in">
                                    <div className="p-4 border-b border-[var(--color-border)] bg-white/5 flex justify-between items-center">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notificações {unreadCount > 0 && `(${unreadCount})`}</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllAsRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                                Marcar todas como lidas
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-[var(--color-muted)] text-sm">
                                                Nenhuma notificação no momento.
                                            </div>
                                        ) : (
                                            notifications.map(n => {
                                                const Icon = n.icon;
                                                return (
                                                    <div 
                                                        key={n.id}
                                                        onClick={() => handleOpenNotification(n)}
                                                        className={`p-4 border-b border-[var(--color-border)] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${n.read ? 'opacity-60' : ''}`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-full bg-${n.color}-500/20 flex items-center justify-center shrink-0`}>
                                                            <Icon className={`w-4 h-4 text-${n.color}-400`} />
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-medium ${n.read ? 'text-[var(--color-muted)]' : 'text-gray-900 dark:text-white'}`}>{n.title}</p>
                                                            <p className="text-xs text-[var(--color-muted)] mt-0.5 line-clamp-1">{n.message}</p>
                                                            <p className={`text-xs mt-1 ${n.read ? 'text-[var(--color-muted)]' : `text-${n.color}-400`}`}>{n.time}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="p-3 bg-black/20 text-center border-t border-[var(--color-border)] hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                                        <span className="text-sm text-[var(--color-muted)] font-medium">Ver todas as notificações</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SELETOR DE SIMULAÇÃO (ADMIN APENAS) */}
                        {(realRole === 'ADMIN' || hasPermission('view_all_clients') || isDevPortalUnlocked) && (
                            <button 
                                onClick={() => setSimulatedRole(null)}
                                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-current/20 font-bold text-sm transition-all ${getBgLightClass()} ${getAccentColorClass()} hover:scale-105`}
                            >
                                <Settings className="w-4 h-4" />
                                Trocar Visão
                            </button>
                        )}

                        {/* PERFIL E DROPDOWN */}
                        <div className="relative pl-4 sm:pl-6 border-l border-[var(--color-border)]">
                            <button 
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false);
                                }}
                                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.email}</p>
                                    <p className={`text-xs font-semibold mt-0.5 ${getAccentColorClass()}`}>Acesso Autorizado</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full ${getBgColorClass()} flex items-center justify-center border-2 border-[var(--color-background)] shadow-lg`}>
                                    <span className="text-gray-900 dark:text-white font-bold">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* MENU DROPDOWN */}
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[var(--color-border)] bg-white dark:bg-[#121212] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-50 animate-fade-in">
                                    <div className="p-4 border-b border-[var(--color-border)] bg-white/5">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.email}</p>
                                        <p className="text-xs text-[var(--color-muted)] mt-1">Nível: {simulatedRole || 'Admin'}</p>
                                    </div>
                                    <div className="p-2">
                                        <Link 
                                            to="/dashboard/configuracoes" 
                                            onClick={() => setShowProfileMenu(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <UserCircle className="w-4 h-4" />
                                            Minha Conta
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors mt-1"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sair do Sistema
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* ══ Área de conteúdo com SCROLL ══ */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        minHeight: 0,          /* ESSENCIAL para flex+scroll */
                        padding: 'clamp(16px, 2vw, 32px)',
                        position: 'relative',
                    }}
                >
                    {/* Orb decorativo — fixed para não afetar o scroll */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0, right: 0,
                            width: '400px', height: '400px',
                            borderRadius: '50%',
                            filter: 'blur(100px)',
                            opacity: 0.05,
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                        className={getBgColorClass()}
                    />

                    {/* Conteúdo da página */}
                    <div 
                        className="transition-all duration-500 w-full h-full"
                        style={{ maxWidth: '1600px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '1rem 2rem 3rem 2rem' }}
                    >
                        <Outlet />
                    </div>
                </div>

                {/* MODAL DE NOTIFICAÇÃO COMPLETA */}
                {selectedNotification && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedNotification(null)}>
                        <div 
                            className="bg-white dark:bg-[#121212] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between">
                                <div className="flex gap-4 items-center">
                                    <div className={`w-12 h-12 rounded-full bg-${selectedNotification.color}-500/20 flex items-center justify-center shrink-0`}>
                                        <selectedNotification.icon className={`w-6 h-6 text-${selectedNotification.color}-400`} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedNotification.title}</h2>
                                        <p className="text-sm text-[var(--color-muted)]">{selectedNotification.time}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedNotification(null)}
                                    className="p-2 rounded-lg text-[var(--color-muted)] hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-900 dark:text-white text-base leading-relaxed">
                                    {selectedNotification.message}
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 border-t border-[var(--color-border)] flex justify-end">
                                <button 
                                    onClick={() => setSelectedNotification(null)}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
