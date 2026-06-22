import React, { useState } from 'react';
import DraggableModal from './DraggableModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface QuickAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName: string;
    type: 'PRODUTO' | 'TALHAO';
    onSuccess: () => void;
}

export default function QuickAddModal({ isOpen, onClose, initialName, type, onSuccess }: QuickAddModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categoria, setCategoria] = useState(type === 'PRODUTO' ? 'PRODUTO FRESCO' : '');

    const handleSave = async () => {
        setLoading(true);
        try {
            if (type === 'PRODUTO') {
                // Salvar como PENDENTE na Biblioteca (Crowdsourcing)
                const { error } = await supabase.from('v2_produtos').insert([{
                    nome: initialName.toUpperCase(),
                    categoria: categoria.toUpperCase(),
                    empresa_id: user?.id,
                    status_aprovacao: 'PENDENTE'
                }]);
                if (error) throw error;
                toast.success('Produto criado e enviado para aprovação global!');
            } else if (type === 'TALHAO') {
                // Salvar localmente
                const { error } = await supabase.from('v2_talhoes').insert([{
                    nome: initialName.toUpperCase(),
                    empresa_id: user?.id,
                    ativo: true
                }]);
                if (error) throw error;
                toast.success('Talhão criado com sucesso!');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error in QuickAdd:', error);
            toast.error(error.message || 'Erro ao salvar o item.');
        } finally {
            setLoading(false);
        }
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <button 
                onClick={onClose}
                className="px-6 py-3 font-bold text-[var(--color-muted)] hover:text-white transition-colors"
                disabled={loading}
            >
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 font-black text-white bg-[var(--color-primary)] rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
            >
                {loading ? 'Salvando...' : 'Salvar e Usar'}
            </button>
        </div>
    );

    return (
        <DraggableModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Adicionar ${type === 'PRODUTO' ? 'Novo Produto' : 'Novo Talhão'}`}
            width="500px"
            footer={footer}
        >
            <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
                    <p className="text-sm text-blue-200">
                        {type === 'PRODUTO' 
                            ? "Este produto será salvo para o seu uso imediato e enviado para aprovação na Biblioteca Global."
                            : "Este talhão será salvo na sua fazenda para uso imediato."}
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                        Nome Oficial *
                    </label>
                    <input 
                        type="text" 
                        value={initialName.toUpperCase()} 
                        disabled
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none cursor-not-allowed opacity-70"
                    />
                </div>

                {type === 'PRODUTO' && (
                    <div>
                        <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                            Categoria *
                        </label>
                        <select 
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-[var(--color-primary)] transition-colors"
                        >
                            <option value="PRODUTO FRESCO" className="bg-[#1a1f2e]">Produto Fresco (Colheita)</option>
                            <option value="INSUMO" className="bg-[#1a1f2e]">Insumo / Defensivo</option>
                            <option value="SEMENTE" className="bg-[#1a1f2e]">Semente</option>
                            <option value="FERTILIZANTE" className="bg-[#1a1f2e]">Fertilizante</option>
                        </select>
                    </div>
                )}
            </div>
        </DraggableModal>
    );
}
