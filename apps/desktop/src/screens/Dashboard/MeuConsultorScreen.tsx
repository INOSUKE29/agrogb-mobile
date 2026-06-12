import React, { useState, useEffect } from 'react';
import { 
    Briefcase, 
    Link as LinkIcon, 
    UserCheck, 
    AlertCircle,
    UserX,
    CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { AgronomistService, LinkedAgronomist } from '../../../../../packages/services/src/agronomistService';

export default function MeuConsultorScreen() {
    const [loading, setLoading] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [vinculado, setVinculado] = useState(false);
    
    const [agronomoAtual, setAgronomoAtual] = useState<LinkedAgronomist | null>(null);

    const agronomistService = new AgronomistService(supabase);

    useEffect(() => {
        carregarAgronomo();
    }, []);

    const carregarAgronomo = async () => {
        try {
            const agronomo = await agronomistService.getLinkedAgronomist();
            if (agronomo) {
                setAgronomoAtual(agronomo);
                setVinculado(true);
            }
        } catch (error) {
            console.error('Erro ao buscar agrônomo:', error);
            toast.error('Não foi possível carregar seu agrônomo vinculado.');
        }
    };

    const handleVincular = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigo || codigo.length < 5) return;

        setLoading(true);
        try {
            await agronomistService.acceptInvite(codigo);
            toast.success('Consultor vinculado com sucesso!');
            await carregarAgronomo();
            setCodigo('');
        } catch (error: any) {
            console.error('Erro ao aceitar convite:', error);
            toast.error(error.message || 'Código de convite inválido ou expirado.');
        } finally {
            setLoading(false);
        }
    };

    const handleDesvincular = async () => {
        if (!agronomoAtual) return;
        
        if (window.confirm('Tem certeza que deseja revogar o acesso deste agrônomo aos seus dados?')) {
            try {
                await agronomistService.revokeAccess(agronomoAtual.agronomist_id);
                setAgronomoAtual(null);
                setVinculado(false);
                setCodigo('');
                toast.success('Acesso do consultor revogado com sucesso.');
            } catch (error) {
                console.error('Erro ao revogar acesso:', error);
                toast.error('Não foi possível revogar o acesso no momento.');
            }
        }
    };

    return (
        <div className="animate-fade-in pb-12 px-4 sm:px-6 lg:px-8 mt-6 max-w-[1200px] mx-auto">
            
            {/* CABEÇALHO */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    Meu Agrônomo / Consultor
                </h1>
                <p className="text-[var(--color-muted)] font-medium mt-1 text-sm">
                    Gerencie quem tem acesso técnico à sua fazenda e receituários.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* ÁREA DE VINCULAÇÃO (Esquerda) */}
                <div className="lg:col-span-7">
                    <div className="premium-card p-8">
                        {agronomoAtual ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
                                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center border-4 border-green-500/20 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                                    <UserCheck className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-1">Fazenda Vinculada!</h3>
                                <p className="text-[var(--color-muted)] mb-6 max-w-md">
                                    Seus dados de caderno agrícola estão sendo monitorados ativamente pelo seu consultor.
                                </p>
                                
                                <div className="w-full bg-[var(--color-background)] rounded-xl p-6 border border-[rgba(255,255,255,0.05)] text-left mb-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Consultor Responsável</p>
                                            <p className="text-lg font-bold text-white">{agronomoAtual.nome_completo}</p>
                                            <p className="text-sm text-gray-400">{agronomoAtual.email}</p>
                                        </div>
                                        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30 flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Acesso Ativo
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleDesvincular}
                                    className="text-red-400 hover:text-red-300 font-bold text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-red-500/10"
                                >
                                    <UserX className="w-4 h-4" />
                                    Revogar Acesso do Consultor
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <LinkIcon className="w-5 h-5 text-blue-400" />
                                    Vincular Novo Consultor
                                </h3>
                                <p className="text-[var(--color-muted)] text-sm mb-6">
                                    Você recebeu um convite do seu agrônomo? Insira o código de 6 dígitos abaixo para conceder acesso técnico à sua fazenda.
                                </p>

                                <form onSubmit={handleVincular} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-300 mb-2">Código do Agrônomo</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={codigo}
                                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                                placeholder="EX: AGR-1234"
                                                maxLength={10}
                                                className="w-full bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-xl py-4 px-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-lg tracking-widest uppercase"
                                                required
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                                <AlertCircle className={`w-5 h-5 ${codigo.length > 5 ? 'text-green-400' : 'text-gray-500'}`} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">O código geralmente tem o formato AGR-XXXX e é enviado via WhatsApp.</p>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading || codigo.length < 5}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                Confirmar Vinculação
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* INFORMAÇÕES (Direita) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
                        <h4 className="font-bold text-blue-400 mb-3 text-sm uppercase tracking-wider">Como funciona?</h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">1</span>
                                <p>O Agrônomo envia o código exclusivo dele para você (via WhatsApp ou e-mail).</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">2</span>
                                <p>Você insere o código nesta página e autoriza o vínculo.</p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold shrink-0">3</span>
                                <p>O Agrônomo passa a ter acesso aos dados do seu Caderno Agrícola para emitir Recomendações.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                        <h4 className="font-bold text-red-400 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Privacidade
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                            A fazenda e os dados sempre serão <strong>seus</strong>. O agrônomo não tem acesso às suas informações financeiras ou de compras. Você pode revogar o acesso do agrônomo a qualquer momento com um único clique.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
