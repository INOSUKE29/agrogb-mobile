import { useState, useCallback } from 'react';
import { PlantioService } from '../services/PlantioService';
import { showToast } from '../../../ui/Toast';
import { useInventory } from '../../inventory/hooks/useInventory';

/**
 * usePlantio (DIAMOND PRO) 🪝🌱
 * Gerencia o ciclo de vida do plantio e a integração com estoque de sementes.
 */
export function usePlantio() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { updateStock } = useInventory(); // Para baixa automática

    const loadHistory = useCallback(async () => {
        setLoading(true);
        try {
            const data = await PlantioService.getHistory();
            setHistory(data);
        } catch (e) {
            showToast('Erro ao carregar histórico de plantio');
        } finally {
            setLoading(false);
        }
    }, []);

    const registerPlanting = async (plantingData, seedItem = null) => {
        setLoading(true);
        try {
            // 1. Salva o registro de plantio
            const result = await PlantioService.savePlanting(plantingData);

            // 2. Se houver semente vinculada (estoque), dá baixa automática
            if (seedItem && seedItem.quantidade > 0) {
                await updateStock(seedItem.id || seedItem.produto, -plantingData.quantidade_pes);
                showToast(`Plantio registrado! Baixa de ${plantingData.quantidade_pes} ${seedItem.unidade} no estoque.`);
            } else {
                showToast('Plantio registrado com sucesso!');
            }

            await loadHistory();
            return result;
        } catch (error) {
            showToast('Erro ao registrar plantio');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removePlanting = async (uuid) => {
        try {
            await PlantioService.deletePlanting(uuid);
            showToast('Registro removido');
            await loadHistory();
        } catch (e) {
            showToast('Erro ao excluir registro');
        }
    };

    return {
        history,
        loading,
        loadHistory,
        registerPlanting,
        removePlanting
    };
}
