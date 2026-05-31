import { useState, useCallback } from 'react';
import { InventoryService } from '../services/InventoryService';

export function useInventory() {
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [error, setError] = useState(null);

    const fetchStock = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await InventoryService.getStock();
            setItems(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const adjustStock = async (productName, delta) => {
        setLoading(true);
        try {
            await InventoryService.updateStock(productName, delta);
            await fetchStock();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { items, loading, error, fetchStock, adjustStock };
}
