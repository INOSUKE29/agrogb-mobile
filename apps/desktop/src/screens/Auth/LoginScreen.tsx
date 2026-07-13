import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Terminal, X, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import logo from '../../assets/logo.png';

export default function LoginScreen() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Dev Mode States
    const [logoClicks, setLogoClicks] = useState(0);
    const [isDevMode, setIsDevMode] = useState(false);
    const [devPin, setDevPin] = useState('');

    // Dicionário de Crachás (PIN -> Credenciais Reais)
    const adminBadges: Record<string, { email: string, pass: string }> = {
        '29346702': { email: 'bruno@agrogb.com', pass: '29346702' },
        // '11223344': { email: 'outro_admin@agrogb.com', pass: 'senha123' }
    };

    const executeLogin = async (targetEmail: string, targetPassword: string) => {
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: targetEmail,
                password: targetPassword,
            });

            if (error) throw error;

            if (data.user) {
                // Fetch profile to verify role
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    console.error("Erro ao ler profile:", profileError);
                    setErrorMsg(`Erro no banco: ${profileError.message}`);
                    await supabase.auth.signOut();
                    return;
                }

                if (!profile) {
                    setErrorMsg('Erro: Nenhum perfil encontrado para este usuário.');
                    await supabase.auth.signOut();
                    return;
                }

                if (profile.role !== 'ADMIN' && profile.role !== 'AGRONOMO' && profile.role !== 'CLIENTE') {
                    setErrorMsg(`Acesso negado. Seu nível atual é: ${profile.role}`);
                    await supabase.auth.signOut();
                    return;
                }

                // Redirect to dashboard
                navigate('/dashboard');
            }
        } catch (error: unknown) {
            const err = error as Error;
            setErrorMsg(err.message || 'Falha ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeLogin(email, password);
    };

    const handleLogoClick = () => {
        const newClicks = logoClicks + 1;
        setLogoClicks(newClicks);
        if (newClicks >= 15) {
            setIsDevMode(true);
            setErrorMsg('');
        }
    };

    // Atalho de Teclado (Ctrl + Alt + D) para abrir direto sem clicar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setIsDevMode(true);
                setErrorMsg('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleDevPinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const badge = adminBadges[devPin];
        
        if (badge) {
            setErrorMsg(`👑 Identificação reconhecida: ${badge.email}. Autenticando...`);
            sessionStorage.setItem('dev_portal_unlocked', 'true');
            await executeLogin(badge.email, badge.pass);
        } else {
            setErrorMsg('Acesso Negado: Crachá/PIN não reconhecido.');
            setDevPin('');
        }
    };

    return (
        <div className={`flex flex-row-reverse min-h-screen relative overflow-hidden transition-colors duration-1000 ${isDevMode ? 'bg-black' : 'bg-[#06111C]'}`}>
            
            {/* BACKGROUND GLOBAL */}
            {!isDevMode ? (
                <>
                    <img src="/hero_agrogb.png" alt="Agro Background" className="absolute inset-0 w-full h-full object-cover opacity-45 z-0 blur-[2px]" />
                    <div className="absolute inset-0 bg-[#06111C]/60 z-0" />
                    <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse z-0" style={{ animationDuration: '7s' }} />
                </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-black z-0" />
                    <div className="absolute inset-0 opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,255,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-green-500/5 rounded-full blur-[150px] z-0" />
                </>
            )}

            {/* PAINEL HERO (DIREITA) */}
            <div className={`hidden lg:flex lg:w-1/2 relative z-10 transition-opacity duration-700 ${isDevMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="absolute inset-0 flex flex-col justify-center items-center p-16 text-center">
                    <div 
                        className="w-48 h-48 rounded-3xl flex items-center justify-center mb-8 overflow-hidden shadow-2xl shadow-emerald-500/20 dark:shadow-[0_0_80px_rgba(34,197,94,0.3)] border border-white dark:border-[var(--color-primary)]/30 cursor-pointer backdrop-blur-md bg-white dark:bg-white/5 transition-all duration-500 hover:scale-105" 
                        onClick={handleLogoClick}
                    >
                        <img src={logo} alt="AgroGB Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight drop-shadow-2xl">
                        AgroGB <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-none">Pro</span>
                    </h1>
                    <p className="text-[var(--color-muted)] text-xl font-medium max-w-md mx-auto leading-relaxed">
                        Plataforma de alta performance para agrônomos e gestores de produção agrícola.
                    </p>
                    
                    <div className="mt-12 flex items-center gap-3 px-6 py-3 rounded-full border border-white/10 bg-[rgba(18,30,45,0.4)] backdrop-blur-md">
                        <ShieldCheck className="w-5 h-5 text-[#19B34A]" />
                        <span className="text-sm font-semibold text-white/90 tracking-wide uppercase">Ambiente Seguro e Criptografado</span>
                    </div>
                </div>
            </div>

            {/* PAINEL DO FORMULÁRIO (ESQUERDA / CENTRO SE DEV) */}
            <div className={`flex flex-1 flex-col justify-center items-center p-8 lg:p-24 relative z-10 transition-all duration-700 ${isDevMode ? 'lg:w-full' : ''}`}>
                
                <div className="w-full max-w-sm relative">
                    
                    {/* MODO NORMAL */}
                    {!isDevMode ? (
                        <>
                            {/* Logo Mobile */}
                            <div className="flex lg:hidden flex-col items-center mb-10 cursor-pointer" onClick={handleLogoClick}>
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-lg border border-[var(--color-primary)]/20">
                                    <img src={logo} alt="AgroGB Logo" className="w-full h-full object-cover" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">AgroGB <span className="text-[var(--color-primary)]">Pro</span></h2>
                                <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Acesso Restrito ao Sistema</p>
                            </div>
                            
                            <div className="hidden lg:flex flex-col items-center mb-10">
                                <h2 className="text-3xl font-black text-white tracking-tight">Bem-vindo(a)</h2>
                                <p className="text-[var(--color-muted)] text-base font-medium mt-2">Acesse sua conta para continuar</p>
                            </div>

                            <form onSubmit={handleLogin} className="p-8 rounded-3xl flex flex-col gap-6 animate-fade-in relative z-10" style={{ background: 'rgba(18,30,45,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                
                                {errorMsg && (
                                    <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
                                        <span className="text-sm font-medium text-[var(--color-danger)]">{errorMsg}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider pl-1">E-mail ou Telefone</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Ex: 62999999999"
                                            className="w-full bg-[rgba(10,15,25,0.4)] border border-[rgba(255,255,255,0.08)] rounded-[16px] h-[60px] pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#19B34A] focus:ring-1 focus:ring-[#19B34A] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider pl-1">Senha de Acesso</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
                                        <input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-[rgba(10,15,25,0.4)] border border-[rgba(255,255,255,0.08)] rounded-[16px] h-[60px] pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-[#19B34A] focus:ring-1 focus:ring-[#19B34A] transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-1">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="w-5 h-5 rounded bg-[#19B34A] flex items-center justify-center">
                                            <ShieldCheck className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-white group-hover:text-[#19B34A] transition-colors">Lembrar de mim</span>
                                    </label>
                                    <a href="#" className="text-sm font-medium text-[#19B34A] hover:text-[#2BD76D] transition-colors">Esqueci minha senha</a>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="mt-2 w-full btn-premium py-4 px-4 flex items-center justify-center gap-2 disabled:opacity-70 group"
                                >
                                    {loading ? (
                                        <span className="animate-pulse">Autenticando...</span>
                                    ) : (
                                        <>
                                            <span className="uppercase tracking-widest text-sm">Entrar no Sistema</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                
                                <div className="flex items-center gap-4 my-2 opacity-50">
                                    <div className="h-px bg-white flex-1"></div>
                                    <span className="text-white text-xs">ou</span>
                                    <div className="h-px bg-white flex-1"></div>
                                </div>
                                
                                <button type="button" className="w-full bg-transparent border border-[#19B34A] hover:bg-[#19B34A]/10 text-white font-bold py-4 px-4 rounded-[16px] transition-all flex items-center justify-center gap-3">
                                    <img src="https://cdn-icons-png.flaticon.com/512/3596/3596091.png" alt="Biometria" className="w-6 h-6 filter invert" style={{opacity: 0.8}} />
                                    <span>Entrar com Biometria</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        /* MODO DEV PORTAL */
                        <div className="animate-fade-in-up">
                            <div className="flex flex-col items-center mb-8">
                                <div className="w-20 h-20 bg-black border-2 border-green-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                    <Terminal className="w-10 h-10 text-green-400" />
                                </div>
                                <h2 className="text-3xl font-black text-green-400 tracking-tight font-mono uppercase">Portal Dev</h2>
                                <p className="text-green-500/60 text-sm font-mono mt-2 uppercase tracking-widest">Acesso Restrito do Arquiteto</p>
                            </div>

                            <form onSubmit={handleDevPinSubmit} className="bg-black/80 backdrop-blur-3xl p-8 rounded-3xl border-2 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] flex flex-col gap-6 relative z-10">
                                
                                {errorMsg && (
                                    <div className="p-4 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-3">
                                        <Terminal className="w-5 h-5 text-red-500 shrink-0" />
                                        <span className="text-sm font-mono font-bold text-red-500">{errorMsg}</span>
                                    </div>
                                )}

                                <div className="flex flex-col gap-3">
                                    <label className="text-xs font-mono font-bold text-green-500 uppercase tracking-widest pl-1">Insira o Crachá (PIN)</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500/50" />
                                        <input 
                                            type="password" 
                                            value={devPin}
                                            onChange={(e) => setDevPin(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-black border-2 border-green-500/30 rounded-xl py-4 pl-12 pr-4 text-green-400 placeholder-green-500/30 focus:outline-none focus:border-green-400 focus:shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all font-mono text-xl tracking-[0.5em] text-center"
                                            maxLength={8}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-2">
                                    <button 
                                        type="button"
                                        onClick={() => { setIsDevMode(false); setLogoClicks(0); setDevPin(''); setErrorMsg(''); }}
                                        className="w-1/3 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-500 font-mono font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="w-2/3 bg-green-500/10 border border-green-500 hover:bg-green-500/20 text-green-400 font-mono font-bold py-4 px-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="animate-pulse">Descriptografando...</span>
                                        ) : (
                                            <span>AUTORIZAR</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    
                    {!isDevMode && (
                        <p className="text-center text-[var(--color-muted)] text-xs mt-8 font-medium">
                            AgroGB Management System &copy; 2026<br/>
                            Versão 2.0.0 Desktop
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
