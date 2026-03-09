import AsyncStorage from '@react-native-async-storage/async-storage';

const MENU_ORDER_KEY = '@agrogb_menu_order';
const MENU_USAGE_KEY = '@agrogb_menu_usage';
const MENU_IS_MANUAL_KEY = '@agrogb_menu_manual';
const USAGE_RESET_KEY = '@agrogb_usage_reset';

// === BASE MENU ITEMS ===
export const BASE_MENU = [
    { id: 'colheita', label: 'Colheita', icon: 'leaf', route: 'Colheita' },
    { id: 'vendas', label: 'Vendas', icon: 'cash', route: 'Vendas' },
    { id: 'estoque', label: 'Estoque', icon: 'cube', route: 'Estoque' },
    { id: 'compras', label: 'Compras', icon: 'cart', route: 'Compras' },
    { id: 'plantio', label: 'Plantio', icon: 'leaf-outline', route: 'Plantio' },
    { id: 'custos', label: 'Custos', icon: 'wallet', route: 'Custos' },
    { id: 'monitorar', label: 'Monitorar', icon: 'eye', route: 'Monitoramento' },
    { id: 'frota', label: 'Frota', icon: 'car', route: 'Frota' },
    { id: 'relatorios', label: 'Relatórios', icon: 'bar-chart', route: 'Relatorios' },
    { id: 'clientes', label: 'Clientes', icon: 'people', route: 'Clientes' },
    { id: 'adubacao', label: 'Adubação', icon: 'flask', route: 'AdubacaoList' },
    { id: 'processamento', label: 'Processamento', icon: 'snow', route: 'Processamento' },
    { id: 'caderno', label: 'Caderno', icon: 'book', route: 'CadernoCampo' },
    { id: 'cadastros', label: 'Cadastros', icon: 'list', route: 'Cadastro' },
];

// === RECORD USAGE ===
export const recordUsage = async (screenId) => {
    try {
        const raw = await AsyncStorage.getItem(MENU_USAGE_KEY);
        const stats = raw ? JSON.parse(raw) : {};
        stats[screenId] = (stats[screenId] || 0) + 1;
        await AsyncStorage.setItem(MENU_USAGE_KEY, JSON.stringify(stats));
    } catch { }
};

// === SAVE MANUAL ORDER (drag & drop) ===
export const saveManualOrder = async (order) => {
    try {
        await AsyncStorage.setItem(MENU_ORDER_KEY, JSON.stringify(order));
        await AsyncStorage.setItem(MENU_IS_MANUAL_KEY, 'true');
    } catch { }
};

// === GET ORDER ===
export const getMenuOrder = async () => {
    try {
        // If user set manual order, use it
        const isManual = await AsyncStorage.getItem(MENU_IS_MANUAL_KEY);
        const savedOrder = await AsyncStorage.getItem(MENU_ORDER_KEY);

        if (isManual === 'true' && savedOrder) {
            const savedIds = JSON.parse(savedOrder);
            // Merge: keep saved order but add new items not yet in saved list
            const savedItems = savedIds.map(id => BASE_MENU.find(m => m.id === id)).filter(Boolean);
            const newItems = BASE_MENU.filter(m => !savedIds.includes(m.id));
            return [...savedItems, ...newItems];
        }

        // Otherwise sort by usage (smart order)
        const rawUsage = await AsyncStorage.getItem(MENU_USAGE_KEY);
        const stats = rawUsage ? JSON.parse(rawUsage) : {};

        // Check if we should reset (every 7 days)
        const lastReset = await AsyncStorage.getItem(USAGE_RESET_KEY);
        if (lastReset) {
            const daysSince = (Date.now() - parseInt(lastReset)) / (1000 * 60 * 60 * 24);
            if (daysSince >= 7) {
                await AsyncStorage.removeItem(MENU_USAGE_KEY);
                await AsyncStorage.setItem(USAGE_RESET_KEY, Date.now().toString());
                return BASE_MENU;
            }
        } else {
            await AsyncStorage.setItem(USAGE_RESET_KEY, Date.now().toString());
        }

        const sorted = [...BASE_MENU].sort((a, b) => (stats[b.id] || 0) - (stats[a.id] || 0));
        return sorted;
    } catch {
        return BASE_MENU;
    }
};

// === RESET MANUAL ORDER ===
export const resetMenuOrder = async () => {
    try {
        await AsyncStorage.removeItem(MENU_ORDER_KEY);
        await AsyncStorage.removeItem(MENU_IS_MANUAL_KEY);
    } catch { }
};
