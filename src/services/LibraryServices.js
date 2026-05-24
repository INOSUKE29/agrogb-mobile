// LibraryServices.js - Centralized intelligence layer for autocompletes, recent selections, favorites, and quick add triggers
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

// Helper for upper casing search/inputs to match the AgroGB DB constraints
const up = (text) => text ? text.toString().toUpperCase().trim() : '';

// Generic Local Storage Helper for Recents & Favorites
const StorageHelper = {
    async getList(key) {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error reading ${key} from AsyncStorage:`, e);
            return [];
        }
    },

    async addRecent(key, item) {
        try {
            let list = await this.getList(key);
            // Deduplicate: remove if already present, insert at the top
            list = list.filter(i => i.uuid !== item.uuid);
            list.unshift(item);
            if (list.length > 8) list.pop(); // Cap at 8 items
            await AsyncStorage.setItem(key, JSON.stringify(list));
            return list;
        } catch (e) {
            console.error(`Error adding recent to ${key}:`, e);
            return [];
        }
    },

    async toggleFavorite(key, item) {
        try {
            let list = await this.getList(key);
            const exists = list.some(i => i.uuid === item.uuid);
            if (exists) {
                list = list.filter(i => i.uuid !== item.uuid);
            } else {
                list.push(item);
            }
            await AsyncStorage.setItem(key, JSON.stringify(list));
            return list;
        } catch (e) {
            console.error(`Error toggling favorite in ${key}:`, e);
            return [];
        }
    }
};

// 1. CLIENT LIBRARY SERVICE
export const ClientLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `SELECT * FROM clientes WHERE is_deleted = 0 AND (nome LIKE ? OR telefone LIKE ?) ORDER BY nome ASC LIMIT 15`;
        const res = await executeQuery(sql, [`%${cleanQuery}%`, `%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_clients');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_clients', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_clients');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_clients', item);
    },

    async quickAdd(nome, telefone = '', endereco = '', cpfCnpj = '', observacao = '') {
        if (!nome) throw new Error('Nome do cliente é obrigatório');
        const uuid = uuidv4();
        const sql = `INSERT INTO clientes (uuid, nome, telefone, endereco, cpf_cnpj, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`;
        await executeQuery(sql, [uuid, up(nome), telefone, up(endereco), cpfCnpj, up(observacao), new Date().toISOString()]);
        return { uuid, nome: up(nome), telefone, endereco: up(endereco), cpf_cnpj: cpfCnpj, observacao: up(observacao) };
    }
};

// 2. PRODUCT / INSUMO LIBRARY SERVICE
export const ProductLibraryService = {
    async search(query, filterType = null) {
        const cleanQuery = up(query);
        let sql = `SELECT * FROM cadastro WHERE is_deleted = 0 AND (nome LIKE ? OR principio_ativo LIKE ?)`;
        const params = [`%${cleanQuery}%`, `%${cleanQuery}%`];
        
        if (filterType) {
            sql += ` AND tipo = ?`;
            params.push(up(filterType));
        }
        
        sql += ` ORDER BY nome ASC LIMIT 15`;
        const res = await executeQuery(sql, params);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_products');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_products', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_products');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_products', item);
    },

    async quickAdd(nome, tipo = 'INSUMO', unidade = 'KG', principioAtivo = '', precoVenda = 0, estocavel = 1, vendavel = 1) {
        if (!nome) throw new Error('Nome do produto é obrigatório');
        const uuid = uuidv4();
        const sql = `INSERT INTO cadastro (uuid, nome, unidade, tipo, principle_ativo, preco_venda, estocavel, vendavel, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`;
        // Inserimos princípio_ativo em duas colunas devido a possíveis diferenças de nome de campo em schemas de migração
        await executeQuery(
            `INSERT INTO cadastro (uuid, nome, unidade, tipo, principio_ativo, preco_venda, estocavel, vendavel, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
            [uuid, up(nome), up(unidade), up(tipo), up(principioAtivo), parseFloat(precoVenda) || 0, estocavel, vendavel, new Date().toISOString()]
        );
        // Garantir que exista no estoque
        try {
            await executeQuery(`INSERT OR IGNORE INTO estoque (produto, quantidade, last_updated, is_deleted) VALUES (?, 0, ?, 0)`, [up(nome), new Date().toISOString()]);
        } catch (e) {
            console.log('Erro ao criar estoque para novo cadastro:', e);
        }
        return { uuid, nome: up(nome), unidade: up(unidade), tipo: up(tipo), principio_ativo: up(principioAtivo), preco_venda: precoVenda };
    }
};

// 3. TALHÃO / ÁREA LIBRARY SERVICE
export const TalhaoLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `SELECT * FROM talhoes WHERE is_deleted = 0 AND nome LIKE ? ORDER BY nome ASC LIMIT 15`;
        const res = await executeQuery(sql, [`%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_talhoes');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_talhoes', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_talhoes');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_talhoes', item);
    },

    async quickAdd(nome, areaHa = 0, observacao = '') {
        if (!nome) throw new Error('Nome do talhão é obrigatório');
        const uuid = uuidv4();
        const sql = `INSERT INTO talhoes (uuid, nome, area_ha, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, 0, 0)`;
        await executeQuery(sql, [uuid, up(nome), parseFloat(areaHa) || 0, up(observacao), new Date().toISOString()]);
        return { uuid, nome: up(nome), area_ha: areaHa, observacao: up(observacao) };
    }
};

// 4. CROP / CULTURA LIBRARY SERVICE
export const CropLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `SELECT * FROM culturas WHERE is_deleted = 0 AND nome LIKE ? ORDER BY nome ASC LIMIT 15`;
        const res = await executeQuery(sql, [`%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_crops');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_crops', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_crops');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_crops', item);
    },

    async quickAdd(nome, observacao = '') {
        if (!nome) throw new Error('Nome da cultura é obrigatório');
        const uuid = uuidv4();
        const sql = `INSERT INTO culturas (uuid, nome, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, 0, 0)`;
        await executeQuery(sql, [uuid, up(nome), up(observacao), new Date().toISOString()]);
        return { uuid, nome: up(nome), observacao: up(observacao) };
    }
};

// 5. RECIPE LIBRARY SERVICE
export const RecipeLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `
            SELECT DISTINCT c.* 
            FROM cadastro c 
            JOIN receitas r ON c.uuid = r.produto_pai_uuid 
            WHERE c.is_deleted = 0 AND c.nome LIKE ? 
            ORDER BY c.nome ASC LIMIT 15
        `;
        const res = await executeQuery(sql, [`%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_recipes');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_recipes', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_recipes');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_recipes', item);
    },

    async getRecipeItems(paiUuid) {
        const sql = `
            SELECT r.*, c.nome as nome_filho, c.unidade as unidade_filho 
            FROM receitas r 
            JOIN cadastro c ON r.item_filho_uuid = c.uuid 
            WHERE r.produto_pai_uuid = ?
        `;
        const res = await executeQuery(sql, [paiUuid]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async quickAdd(nomePai, itemsArray = []) {
        if (!nomePai) throw new Error('Nome da receita principal é obrigatório');
        
        const uuid = uuidv4();
        // 1. Criar o item Pai no Cadastro
        await executeQuery(
            `INSERT INTO cadastro (uuid, nome, unidade, tipo, estocavel, vendavel, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
            [uuid, up(nomePai), 'UNID', 'PRODUTO', 1, 1, new Date().toISOString()]
        );

        // 2. Criar os itens filhos vinculados na receita
        for (const item of itemsArray) {
            await executeQuery(
                `INSERT INTO receitas (produto_pai_uuid, item_filho_uuid, quantidade, last_updated, sync_status) VALUES (?, ?, ?, ?, 0)`,
                [uuid, item.filhoUuid, parseFloat(item.quantidade) || 0, new Date().toISOString()]
            );
        }

        return { uuid, nome: up(nomePai), itemsCount: itemsArray.length };
    }
};

// 6. FORNECEDOR LIBRARY SERVICE
export const FornecedorLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `SELECT * FROM fornecedores WHERE is_deleted = 0 AND (nome LIKE ? OR contato LIKE ?) ORDER BY nome ASC LIMIT 15`;
        const res = await executeQuery(sql, [`%${cleanQuery}%`, `%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_suppliers');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_suppliers', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_suppliers');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_suppliers', item);
    },

    async quickAdd(nome, contato = '', telefone = '', email = '', observacao = '') {
        if (!nome) throw new Error('Nome do fornecedor é obrigatório');
        const uuid = uuidv4();
        const sql = `INSERT INTO fornecedores (uuid, nome, contato, telefone, email, observacao, last_updated, sync_status, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`;
        await executeQuery(sql, [uuid, up(nome), up(contato), telefone, email, up(observacao), new Date().toISOString()]);
        return { uuid, nome: up(nome), contato: up(contato), telefone, email, observacao: up(observacao) };
    }
};

// 7. COST CENTER / CATEGORY LIBRARY SERVICE
export const CostCenterLibraryService = {
    async search(query) {
        const cleanQuery = up(query);
        const sql = `SELECT * FROM cost_categories WHERE is_deleted = 0 AND name LIKE ? ORDER BY name ASC LIMIT 15`;
        const res = await executeQuery(sql, [`%${cleanQuery}%`]);
        const rows = [];
        for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
        return rows;
    },

    async getRecents() {
        return await StorageHelper.getList('agrogb_recents_cost_centers');
    },

    async addRecent(item) {
        return await StorageHelper.addRecent('agrogb_recents_cost_centers', item);
    },

    async getFavorites() {
        return await StorageHelper.getList('agrogb_favorites_cost_centers');
    },

    async toggleFavorite(item) {
        return await StorageHelper.toggleFavorite('agrogb_favorites_cost_centers', item);
    },

    async quickAdd(nome, tipo = 'variavel') {
        if (!nome) throw new Error('Nome do centro de custo é obrigatório');
        const sql = `INSERT INTO cost_categories (name, type, is_default, is_deleted, created_at) VALUES (?, ?, 0, 0, ?)`;
        await executeQuery(sql, [up(nome), tipo.toLowerCase(), new Date().toISOString()]);
        
        // Obter o registro criado (SQLite auto-increment id)
        const check = await executeQuery('SELECT * FROM cost_categories WHERE name = ? AND is_deleted = 0', [up(nome)]);
        return check.rows.length > 0 ? check.rows.item(0) : { name: up(nome), type: tipo };
    }
};
