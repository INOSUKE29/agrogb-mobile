import { useState } from 'react';
import { ProductionService } from '../services/ProductionService';

export function useFertilization() {
    const [loading, setLoading] = useState(false);
    const [itens, setItens] = useState([]); // Lista de insumos da receita atual

    const addInsumo = (insumo) => {
        setItens(prev => [...prev, { ...insumo, tempId: Math.random().toString() }]);
    };

    const removeInsumo = (tempId) => {
        setItens(prev => prev.filter(i => i.tempId !== tempId));
    };

    const savePlan = async (planoData) => {
        setLoading(true);
        try {
            await ProductionService.saveFertilizationPlan(planoData, itens);
        } finally {
            setLoading(false);
        }
    };

    const applyPlan = async (uuid) => {
        setLoading(true);
        try {
            await ProductionService.applyFertilization(uuid);
        } finally {
            setLoading(false);
        }
    };

    return { itens, setItens, addInsumo, removeInsumo, savePlan, applyPlan, loading };
}
