import { useState, useCallback } from 'react';
import { ProductionService } from '../services/ProductionService';

export function useProduction() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const saveHarvest = async (data) => {
        setLoading(true);
        setError(null);
        try {
            return await ProductionService.recordHarvest(data);
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const saveFreezing = async (data) => {
        setLoading(true);
        try { return await ProductionService.recordFreezing(data); }
        finally { setLoading(false); }
    };

    const saveWaste = async (data) => {
        setLoading(true);
        try { return await ProductionService.recordWaste(data); }
        finally { setLoading(false); }
    };

    return { saveHarvest, saveFreezing, saveWaste, loading, error };
}
