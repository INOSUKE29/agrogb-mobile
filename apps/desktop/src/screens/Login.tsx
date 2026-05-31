import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulação do carregamento do @agrogb/auth
    setTimeout(() => {
      setLoading(false);
      alert('Autenticação Supabase em breve!');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-300/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-[420px] bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl p-8 z-10 animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-3xl">🌿</span>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">AgroGB Desktop</h1>
          <p className="text-foreground/60 text-sm">Acesse o painel central do ecossistema</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 pl-1">E-mail corporativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="exemplo@agrogb.com.br"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1">
              <label className="text-sm font-medium text-foreground/80">Senha</label>
              <a href="#" className="text-xs text-primary hover:underline">Esqueceu?</a>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-background/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex justify-center items-center"
          >
            {loading ? (
              <span className="animate-pulse">Autenticando...</span>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-foreground/40 font-medium">
          AgroGB Enterprise Edition © 2026
        </div>
      </div>
    </div>
  );
}
