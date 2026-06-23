import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ListTodo, AlertTriangle, Sprout, Wind, Droplet, Plus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { ExecucaoService } from '../../../services/ExecucaoService';

export default function ManejoDashboard() {
    const navigate = useNavigate();
    const [pendentes, setPendentes] = useState<any[]>([]);

    useEffect(() => {
        async function fetchPendentes() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase.from('plantio').select('*').eq('user_id', user.id).eq('status', 'EM ANDAMENTO');
            
            if (data && data.length > 0) {
                setPendentes(data.map((d: any) => ({
                    id: d.id,
                    codigo: d.id.substring(0,2).toUpperCase(),
                    tipo: 'Operação',
                    objetivo: d.cultura,
                    data: new Date(d.data_plantio).toLocaleDateString(),
                    status: d.status,
                    programa: `Atividade no Talhão ${d.talhao_id}`
                })));
            } else {
                setPendentes([]);
            }
        }
        fetchPendentes();
    }, []);

    return (
        <div className="animate-fade-in pb-12 space-y-6">
            {/* HERO CABEÇALHO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <ListTodo className="w-4 h-4" /> Central Operacional
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Manejo da Lavoura
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            O coração do AgroGB. Execute as atividades e nós cuidamos de alimentar o estoque, financeiro e histórico automaticamente.
                        </p>
                    </div>
                    <div>
                        <button 
                            onClick={() => navigate('/dashboard/cliente/manejo/programas')}
                            className="px-6 py-4 rounded-2xl font-black text-white shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-95 active:scale-90"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary), #047857)' }}
                        >
                            <Plus className="w-5 h-5" /> Novo Programa
                        </button>
                    </div>
                </div>
            </div>

            {/* SEÇÕES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* PRÓXIMAS ATIVIDADES */}
                    <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                            Atividades Pendentes
                        </h2>
                        
                        <div className="space-y-4">
                            {pendentes.length > 0 ? pendentes.map((ativ) => (
                                <div key={ativ.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-[var(--color-primary)]/50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                                            ativ.tipo === 'Foliar' ? 'bg-green-500/20 text-green-400' :
                                            ativ.tipo === 'Gotejo' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-purple-500/20 text-purple-400'
                                        }`}>
                                            {ativ.codigo}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{ativ.objetivo} ({ativ.tipo})</h3>
                                            <p className="text-sm text-[var(--color-muted)]">{ativ.programa} • Agendado para {ativ.data}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            ExecucaoService.executarAtividade(ativ, 'user-id-mock').then((success) => {
                                                if (success) {
                                                    setPendentes(pendentes.filter(p => p.id !== ativ.id));
                                                }
                                            });
                                        }}
                                        className="w-full sm:w-auto px-6 py-2 bg-[var(--color-primary)] hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 justify-center"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Executar
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-8">
                                    <ListTodo className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-50" />
                                    <p className="text-[var(--color-muted)]">Nenhuma atividade pendente no momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* ALERTAS CLIMÁTICOS */}
                    <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Wind className="w-5 h-5 text-amber-400" />
                            Alertas de Clima
                        </h2>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-[#19B34A] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-[#19B34A]">Condições Favoráveis</h4>
                                    <p className="text-sm text-[var(--color-muted)] mt-1">Nenhum alerta meteorológico crítico para as próximas horas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* ATALHOS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div onClick={() => navigate('/dashboard/cliente/recomendacoes')} className="glass p-4 rounded-2xl border border-[var(--color-border)] text-center cursor-pointer hover:bg-white/5 transition-all">
                            <ListTodo className="w-8 h-8 text-[var(--color-primary)] mx-auto mb-2" />
                            <span className="text-sm font-bold text-white">Receituários</span>
                        </div>
                        <div onClick={() => navigate('/dashboard/cliente/clima')} className="glass p-4 rounded-2xl border border-[var(--color-border)] text-center cursor-pointer hover:bg-white/5 transition-all">
                            <Wind className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <span className="text-sm font-bold text-white">Previsão</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
