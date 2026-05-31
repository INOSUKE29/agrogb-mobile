import { useState, useCallback } from 'react';
import { FleetService } from '../services/FleetService';

export function useFleet() {
    const [loading, setLoading] = useState(false);
    const [machines, setMachines] = useState([]);

    const fetchMachines = useCallback(async () => {
        setLoading(true);
        try {
            const data = await FleetService.getAll();
            setMachines(data);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveMachine = async (data) => {
        setLoading(true);
        try {
            await FleetService.saveMachine(data);
            await fetchMachines();
        } finally {
            setLoading(false);
        }
    };

    return { machines, loading, fetchMachines, saveMachine };
}
