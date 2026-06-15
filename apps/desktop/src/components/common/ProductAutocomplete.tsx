import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Globe } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ProductItem {
    id: string;
    nome: string;
    categoria?: string;
    isLocal: boolean;
    quantidadeLocal?: number;
    unidade?: string;
}

interface ProductAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function ProductAutocomplete({ value, onChange, placeholder = "Ex: Nitrato de Cálcio", className = "" }: ProductAutocompleteProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState<ProductItem[]>([]);
    const [filteredOptions, setFilteredOptions] = useState<ProductItem[]>([]);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { clientOverrideId, user } = useAuth();

    // Fecha o dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Busca consolidada (Global + Local)
    useEffect(() => {
        let mounted = true;

        async function fetchProducts() {
            setLoading(true);
            try {
                // 1. Busca todos os produtos (Mestre / Global)
                const { data: produtosGlobal } = await supabase
                    .from('v2_produtos')
                    .select('id, nome, categoria, unidade_medida')
                    .order('nome');

                // 2. Busca estoque atual (Local)
                const currentUserId = clientOverrideId || user?.id;
                let queryEstoque = supabase.from('v2_estoque_atual').select('*');
                if (currentUserId) queryEstoque = queryEstoque.eq('user_id', currentUserId);
                
                const { data: estoqueLocal } = await queryEstoque;

                if (!mounted) return;

                const globalList = produtosGlobal || [];
                const localList = estoqueLocal || [];

                // Mapa para acesso rápido ao estoque
                const localMap = new Map<string, any>();
                localList.forEach(item => {
                    if (item.produto_id) localMap.set(item.produto_id, item);
                });

                const combined: ProductItem[] = globalList.map(prod => {
                    const localStock = localMap.get(prod.id);
                    return {
                        id: prod.id,
                        nome: prod.nome,
                        categoria: prod.categoria,
                        unidade: prod.unidade_medida,
                        isLocal: !!localStock,
                        quantidadeLocal: localStock ? Number(localStock.quantidade) : 0
                    };
                });

                // Ordena: Primeiro os que tem estoque local, depois ordem alfabética
                combined.sort((a, b) => {
                    if (a.isLocal && !b.isLocal) return -1;
                    if (!a.isLocal && b.isLocal) return 1;
                    return a.nome.localeCompare(b.nome);
                });

                setOptions(combined);
            } catch (error) {
                console.error("Erro ao buscar produtos para autocomplete", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchProducts();

        return () => { mounted = false; };
    }, [clientOverrideId, user?.id]);

    // Filtra baseado na digitação do usuário
    useEffect(() => {
        if (!value.trim()) {
            setFilteredOptions(options);
            return;
        }

        const lowerVal = value.toLowerCase();
        const filtered = options.filter(opt => opt.nome.toLowerCase().includes(lowerVal));
        setFilteredOptions(filtered);
    }, [value, options]);

    const handleSelect = (item: ProductItem) => {
        onChange(item.nome);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                className={`w-full bg-transparent border-b border-[rgba(255,255,255,0.1)] text-white text-sm focus:border-green-500 outline-none pb-1 font-bold ${className}`}
                required
            />
            
            {/* Ícone Indicador */}
            <div className="absolute right-0 top-0 bottom-1 flex items-center pr-2 pointer-events-none text-[var(--color-muted)]">
                {loading ? (
                    <div className="w-3 h-3 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Search className="w-3 h-3" />
                )}
            </div>

            {/* Dropdown de Sugestões */}
            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#112240] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden hide-scrollbar">
                    <div className="p-1">
                        {filteredOptions.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-white/5 rounded-lg group transition-colors"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.isLocal && item.quantidadeLocal && item.quantidadeLocal > 0 ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-[var(--color-muted)]'}`}>
                                        {item.isLocal ? <Package className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-white text-sm truncate">{item.nome}</span>
                                        <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider truncate">
                                            {item.isLocal ? 'Estoque Local' : 'Biblioteca Global'}
                                        </span>
                                    </div>
                                </div>
                                
                                {item.isLocal && item.quantidadeLocal !== undefined && (
                                    <div className="text-right shrink-0 ml-2 hidden sm:block">
                                        <div className="text-xs font-black text-green-400">{item.quantidadeLocal} {item.unidade || 'UN'}</div>
                                        <div className="text-[10px] text-[var(--color-muted)] uppercase">Disponível</div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
