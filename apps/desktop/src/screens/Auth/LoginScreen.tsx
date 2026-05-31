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
        <div className="flex min-h-screen bg-[var(--color-background)]">
            
            {/* PAINEL ESQUERDO: Imagem Hero */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10" />
                <img 
                    src="https://images.unsplash.com/photo-1592982537447-6f2c6c0c1692?q=80&w=2070&auto=format&fit=crop" 
                    alt="AgroGB Fazenda"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-16 left-16 z-20 max-w-md animate-fade-in">
                    <h1 className="text-4xl font-black text-white mb-4 leading-tight">
                        A evolução da <br/>gestão no campo.
                    </h1>
                    <p className="text-[var(--color-muted)] text-lg font-medium">
                        Plataforma de alta performance para agrônomos e gestores de produção agrícola.
                    </p>
                </div>
            </div>

            {/* PAINEL DIREITO: Formulário */}
            <div className="flex flex-1 flex-col justify-center items-center p-8 lg:p-24 relative">
                
                {/* Efeitos de Luz no Fundo */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />

                <div className="w-full max-w-sm relative z-10">
                    <div 
                        className="flex flex-col items-center mb-10 cursor-pointer" 
                        onClick={handleLogoClick}
                    >
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 overflow-hidden shadow-lg border border-[var(--color-primary)]/20">
                            <img src="/logo.png" alt="AgroGB Logo" className="w-full h-full object-cover" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">AgroGB <span className="text-[var(--color-primary)]">Pro</span></h2>
                        <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Acesso Restrito ao Sistema</p>
                    </div>

                    <form onSubmit={handleLogin} className="glass p-8 rounded-3xl shadow-2xl flex flex-col gap-5 animate-fade-in">
                        
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
                                    className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
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
                                    className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="mt-4 w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
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
