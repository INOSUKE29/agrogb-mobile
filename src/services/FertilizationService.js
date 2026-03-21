import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * FertilizationService - Gestão de Receitas e Aplicações 🌿🧪
 */
export const FertilizationService = {
    /**
     * Cria uma nova receita com seus itens
     */
    createRecipe: async (recipe, items) => {
        const recipeId = uuidv4();
        const now = new Date().toISOString();

        // 1. Salvar Cabeçalho da Receita
        await executeQuery(
            `INSERT INTO fertilization_recipes (id, name, type, culture, description, user_id, created_at, last_updated) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [recipeId, recipe.name, recipe.type, recipe.culture, recipe.description, recipe.user_id, now, now]
        );

        // 2. Salvar Itens da Receita
        for (const item of items) {
            await executeQuery(
                `INSERT INTO fertilization_items (id, recipe_id, product_name, quantity, unit, last_updated) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), recipeId, item.product_name, item.quantity, item.unit, now]
            );
        }

        return recipeId;
    },

    /**
     * Obtém todas as receitas agrupadas por cultura
     */
    getRecipes: async () => {
        const res = await executeQuery(`SELECT * FROM fertilization_recipes WHERE is_deleted = 0 ORDER BY culture, name`);
        const recipes = [];
        for (let i = 0; i < res.rows.length; i++) {
            recipes.push(res.rows.item(i));
        }
        return recipes;
    },

    /**
     * Obtém detalhes de uma receita e seus itens
     */
    getRecipeDetails: async (recipeId) => {
        const resRecipe = await executeQuery(`SELECT * FROM fertilization_recipes WHERE id = ?`, [recipeId]);
        if (resRecipe.rows.length === 0) return null;

        const recipe = resRecipe.rows.item(0);
        const resItems = await executeQuery(`SELECT * FROM fertilization_items WHERE recipe_id = ? AND is_deleted = 0`, [recipeId]);
        
        const items = [];
        for (let i = 0; i < resItems.rows.length; i++) {
            items.push(resItems.rows.item(i));
        }

        return { ...recipe, items };
    },

    /**
     * Registra uma nova aplicação e integra com estoque e caderno
     */
    createApplication: async (appData, items) => {
        const appId = uuidv4();
        const now = new Date().toISOString();

        // 1. Salvar Aplicação
        await executeQuery(
            `INSERT INTO fertilization_applications (id, recipe_id, date, culture, notes, user_id, created_at, last_updated) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [appId, appData.recipe_id, appData.date, appData.culture, appData.notes, appData.user_id, now, now]
        );

        // 2. Registrar no Caderno de Notas (Integração Automática)
        const noteMsg = `[ADUBAÇÃO] Aplicação de ${appData.recipe_name} na cultura ${appData.culture}. Insumos: ${items.map(it => `${it.product_name} (${it.quantity}${it.unit})`).join(', ')}`;
        await executeQuery(
            `INSERT INTO caderno_notas (uuid, observacao, data, last_updated, sync_status, is_deleted) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), noteMsg, appData.date, now, 0, 0]
        );

        return appId;
    },

    /**
     * Obtém histórico de aplicações
     */
    getApplications: async () => {
        const res = await executeQuery(`
            SELECT a.*, r.name as recipe_name 
            FROM fertilization_applications a
            JOIN fertilization_recipes r ON a.recipe_id = r.id
            WHERE a.is_deleted = 0
            ORDER BY a.date DESC
        `);
        const apps = [];
        for (let i = 0; i < res.rows.length; i++) {
            apps.push(res.rows.item(i));
        }
        return apps;
    }
};
