import { initConnection, executeQuery } from './core';
import { runMigrations } from './migrations';
import { VendasRepository, ColheitasRepository, CustosRepository, ClientesRepository, ComprasRepository, EstoqueRepository } from '../repositories/TransactionRepository';
import { getSupabase, syncTable } from '../services/supabase';
import bcrypt from 'react-native-bcrypt';
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkAdminRights = async () => {
    const level = await AsyncStorage.getItem('@user_level');
    if (level !== 'ADMIN') {
        throw new Error('Acesso Negado: Apenas ADMINISTRADORES podem arquivar/excluir na lixeira.');
    }
};
// --- INITIALIZATION ---
export const initDB = async () => {
    const db = await initConnection();
    await runMigrations();
    return db;
};

// --- ISOLATION CONTEXT ---
let CURRENT_USER_ID = null;

export const setGlobalUserId = (id) => {
    CURRENT_USER_ID = id;
    console.log('🔒 [DB] Usuário isolado definido:', id);
};

// --- EXPORTS ---
export { initConnection, executeQuery, getSupabase, syncTable };

// --- HELPER FUNCTIONS (Legacy Support) ---

export const hashPassword = (plainPassword) => {
    if (!plainPassword) return null;
    if (plainPassword.startsWith('$2a$')) return plainPassword;
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plainPassword, salt);
};

// --- AUTH & USER ---

export const insertUsuario = async (user) => {
    const hashed = hashPassword(user.senha);
    const sql = `INSERT INTO usuarios (usuario, senha, nivel, nome_completo, telefone, endereco, provider, avatar_url, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        user.usuario,
        hashed,
        user.nivel || 'USUARIO',
        user.nome_completo,
        user.telefone,
        user.endereco,
        user.provider || 'local',
        user.avatar_url || null,
        new Date().toISOString()
    ];
    return await executeQuery(sql, params);
};

export const checkLogin = async (usuario, senha) => {
    const sql = `SELECT * FROM usuarios WHERE usuario = ? LIMIT 1`;
    const res = await executeQuery(sql, [usuario]);
    if (res.rows.length > 0) {
        const user = res.rows.item(0);
        const isValid = bcrypt.compareSync(senha, user.senha);
        if (isValid) return user;
    }
    return null;
};

// --- TRANSACTION WRAPPERS (With Isolation) ---

// COLHEITAS
export const insertColheita = async (data) => {
    // Adapter to Repository
    // Data comes as { uuid, cultura, produto, quantidade, data, observacao... }
    // New Repository expects (data, userId)
    if (!CURRENT_USER_ID) console.warn('⚠️ [Insert] User ID not set! Data might be orphan or global.');
    return await ColheitasRepository.create(data, CURRENT_USER_ID);
};

export const getColheitasRecentes = async () => {
    return await ColheitasRepository.findAll(CURRENT_USER_ID);
};

export const updateColheita = async (uuid, data) => {
    return await ColheitasRepository.update(uuid, data, CURRENT_USER_ID);
};

export const deleteColheita = async (uuid) => {
    await checkAdminRights();
    return await ColheitasRepository.delete(uuid, CURRENT_USER_ID);
};

// VENDAS
export const insertVenda = async (data) => {
    return await VendasRepository.create(data, CURRENT_USER_ID);
};

export const getVendasRecentes = async () => {
    return await VendasRepository.findAll(CURRENT_USER_ID);
};

export const updateVenda = async (uuid, data) => {
    return await VendasRepository.update(uuid, data, CURRENT_USER_ID);
};

export const deleteVenda = async (uuid) => {
    await checkAdminRights();
    return await VendasRepository.delete(uuid, CURRENT_USER_ID);
};

// CUSTOS
export const insertCusto = async (data) => {
    return await CustosRepository.create(data, CURRENT_USER_ID);
};

export const getCustosRecentes = async () => {
    return await CustosRepository.findAll(CURRENT_USER_ID);
};

export const updateCusto = async (uuid, data) => {
    return await CustosRepository.update(uuid, data, CURRENT_USER_ID);
};

export const deleteCusto = async (uuid) => {
    await checkAdminRights();
    return await CustosRepository.delete(uuid, CURRENT_USER_ID);
};

// COMPRAS
export const insertCompra = async (data) => {
    return await ComprasRepository.create(data, CURRENT_USER_ID);
};

export const getComprasRecentes = async () => {
    return await ComprasRepository.findAll(CURRENT_USER_ID);
};

export const updateCompra = async (uuid, data) => {
    return await ComprasRepository.update(uuid, data, CURRENT_USER_ID);
};

export const deleteCompra = async (uuid) => {
    await checkAdminRights();
    return await ComprasRepository.delete(uuid, CURRENT_USER_ID);
};

// CLIENTES
export const insertCliente = async (data) => {
    return await ClientesRepository.create(data, CURRENT_USER_ID);
};

export const getClientes = async () => {
    return await ClientesRepository.findAll(CURRENT_USER_ID, 'nome ASC');
};

export const updateCliente = async (uuid, data) => {
    return await ClientesRepository.update(uuid, data, CURRENT_USER_ID);
};

export const deleteCliente = async (uuid) => {
    await checkAdminRights();
    return await ClientesRepository.delete(uuid, CURRENT_USER_ID);
};

// ESTOQUE (Special Logic)
export const getEstoque = async () => {
    // Estoque generally is calculated or stored. 
    // Assuming simple select for now based on 'estoque' table
    if (!CURRENT_USER_ID) return [];
    const res = await executeQuery(`SELECT * FROM estoque WHERE user_id = ?`, [CURRENT_USER_ID]);
    const rows = [];
    for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
    return rows;
};

// --- DASHBOARD STATS ---
export const getDashboardStats = async () => {
    // This is complex, usually aggregates. 
    // Implementing a simplified version compatible with Home Screen

    if (!CURRENT_USER_ID) return { saldo: 0, colheitaHoje: 0, vendasHoje: 0, plantioAtivo: 0, maquinasAlert: 0, pendentes: 0 };

    const uid = CURRENT_USER_ID;
    const today = new Date().toISOString().split('T')[0];

    // Colheita Hoje
    const colheitaRes = await executeQuery(`SELECT SUM(quantidade) as total FROM colheitas WHERE user_id = ? AND data = ?`, [uid, today]);
    const colheitaHoje = colheitaRes.rows.item(0).total || 0;

    // Vendas Hoje
    const vendasRes = await executeQuery(`SELECT SUM(valor) as total FROM vendas WHERE user_id = ? AND data = ?`, [uid, today]);
    const vendasHoje = vendasRes.rows.item(0).total || 0;

    // Saldo Mês (Simplified)
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const vendasMesRes = await executeQuery(`SELECT SUM(valor) as total FROM vendas WHERE user_id = ? AND data LIKE ?`, [uid, `${month}%`]);
    const custosMesRes = await executeQuery(`SELECT SUM(valor_total) as total FROM custos WHERE user_id = ? AND data LIKE ?`, [uid, `${month}%`]);

    const saldo = (vendasMesRes.rows.item(0).total || 0) - (custosMesRes.rows.item(0).total || 0);

    return {
        saldo,
        colheitaHoje,
        vendasHoje,
        plantioAtivo: 0, // Implement if needed
        maquinasAlert: 0,
        pendentes: 0
    };
};
