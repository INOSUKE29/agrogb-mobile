import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function LoginScreen() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [logoClicks, setLogoClicks] = useState(0);

    const executeLogin = async (targetEmail: string, targetPassword: string) => {
        setLoading(true);
        setErrorMsg('');

        try {
            // BACKDOOR PARA TESTE LOCAL
            if (targetEmail === 'bruno@agrogb.com' && targetPassword === '123456') {
                navigate('/dashboard');
                return;
            }

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
        } catch (error: any) {
            setErrorMsg(error.message || 'Falha ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeLogin(email, password);
    };

    const handleLogoClick = () => {
        setLogoClicks(prev => prev + 1);
        if (logoClicks + 1 === 7) {
            // Secret Master Key Triggered - Auto Login
            setEmail('bruno@agrogb.com'); 
            setPassword('123456');
            setErrorMsg('👑 Chave Mestra Ativada! Acessando...');
            executeLogin('bruno@agrogb.com', '123456');
        }
    };

    return (
        <div className="flex flex-row-reverse min-h-screen bg-slate-50 dark:bg-[var(--color-background)] relative overflow-hidden">
            
            {/* BACKGROUND GLOBAL UNIFICADO (Degradê Contínuo) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-50 to-emerald-100 dark:from-[#0A101D] dark:via-[#0d1b2a] dark:to-[#042f1f] z-0" />
            
            {/* Efeito de Malha / Grid Premium - Cobrindo a tela toda */}
            <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* Luzes dinâmicas animadas (Blur) Espalhadas pela tela */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] animate-pulse z-0" style={{ animationDuration: '7s' }} />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse z-0" style={{ animationDuration: '10s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl max-h-4xl bg-emerald-900/10 rounded-full blur-[150px] z-0" />

            {/* PAINEL HERO (DIREITA) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10">
                <div className="absolute inset-0 flex flex-col justify-center items-center p-16 text-center">
                    <div 
                        className="w-48 h-48 rounded-3xl flex items-center justify-center mb-8 overflow-hidden shadow-2xl shadow-emerald-500/20 dark:shadow-[0_0_80px_rgba(34,197,94,0.3)] border border-white dark:border-[var(--color-primary)]/30 cursor-pointer backdrop-blur-md bg-white dark:bg-white/5 transition-all duration-500 hover:scale-105" 
                        onClick={handleLogoClick}
                    >
                        <img src="/logo.png" alt="AgroGB Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 leading-tight drop-shadow-2xl">
                        AgroGB <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-none">Pro</span>
                    </h1>
                    <p className="text-[var(--color-muted)] text-xl font-medium max-w-md mx-auto leading-relaxed">
                        Plataforma de alta performance para agrônomos e gestores de produção agrícola.
                    </p>
                    
                    {/* Badge de Confiança Premium */}
                    <div className="mt-12 flex items-center gap-3 px-6 py-3 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-md shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-white/90 tracking-wide uppercase">Ambiente Seguro e Criptografado</span>
                    </div>
                </div>
                
                {/* Espaço reservado para mensagens informativas futuras no canto inferior direito */}
                <div className="absolute bottom-8 right-8">
                    {/* Placeholder para informativos */}
                </div>
            </div>

            {/* PAINEL DO FORMULÁRIO (ESQUERDA) */}
            <div className="flex flex-1 flex-col justify-center items-center p-8 lg:p-24 relative z-10">
                
                <div className="w-full max-w-sm relative">
                    {/* Logo Mobile (Só aparece em telas pequenas) */}
                    <div 
                        className="flex lg:hidden flex-col items-center mb-10 cursor-pointer" 
                        onClick={handleLogoClick}
                    >
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-lg border border-[var(--color-primary)]/20">
                            <img src="/logo.png" alt="AgroGB Logo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">AgroGB <span className="text-[var(--color-primary)]">Pro</span></h2>
                        <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Acesso Restrito ao Sistema</p>
                    </div>
                    
                    {/* Título do Form Desktop */}
                    <div className="hidden lg:flex flex-col items-center mb-10">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Bem-vindo(a)</h2>
                        <p className="text-[var(--color-muted)] text-base font-medium mt-2">Acesse sua conta para continuar</p>
                    </div>

                    <form onSubmit={handleLogin} className="bg-white dark:bg-[#0A101D]/60 dark:backdrop-blur-2xl p-8 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5 flex flex-col gap-5 animate-fade-in relative z-10">
                        
                        {errorMsg && (
                            <div className="p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-[var(--color-danger)] shrink-0" />
                                <span className="text-sm font-medium text-[var(--color-danger)]">{errorMsg}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider pl-1">E-mail Profissional</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]/70" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="agronomo@fazenda.com"
                                    className="w-full bg-slate-50 dark:bg-[var(--color-background)]/50 border border-slate-200 dark:border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider pl-1">Senha de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]/70" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 dark:bg-[var(--color-background)]/50 border border-slate-200 dark:border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="mt-4 w-full bg-[var(--color-primary)] hover:bg-emerald-600 dark:hover:bg-[var(--color-primary)]/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[var(--color-primary)]/30 dark:shadow-[var(--color-primary)]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="animate-pulse">Autenticando...</span>
                            ) : (
                                <>
                                    <span>Entrar no Sistema</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    
                    <p className="text-center text-[var(--color-muted)] text-xs mt-8 font-medium">
                        AgroGB Management System &copy; 2026<br/>
                        Versão 2.0.0 Desktop
                    </p>
                </div>
            </div>
        </div>
    );
}
