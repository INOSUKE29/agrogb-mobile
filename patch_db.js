const fs = require('fs');
const path = './src/database/database.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Migration for is_deleted
const migrationCode = `
        // MIGRATION: Soft Delete Flag
        const tablesToCheck = ['usuarios', 'colheitas', 'monitoramento', 'vendas', 'estoque', 'compras', 'plantio', 'custos', 'descarte', 'cadastro', 'clientes', 'culturas', 'maquinas', 'manutencao_frota', 'receitas', 'planos_adubacao'];
        for (const table of tablesToCheck) {
            try { await executeQuery(\`ALTER TABLE \${table} ADD COLUMN is_deleted INTEGER DEFAULT 0\`); } catch (e) { }
        }
        console.log('✅ Soft delete migrado');
`;
if (!content.includes('Soft Delete Flag')) {
    content = content.replace("console.log('✅ Arquitetura Monitoramento v6.0 Implementada');", migrationCode + "\n        console.log('✅ Arquitetura Monitoramento v6.0 Implementada');");
}

// 2. Patch Getters
const getters = [
    { target: "SELECT * FROM colheitas ORDER BY data DESC", replace: "SELECT * FROM colheitas WHERE is_deleted = 0 ORDER BY data DESC" },
    { target: "SELECT * FROM vendas ORDER BY data DESC", replace: "SELECT * FROM vendas WHERE is_deleted = 0 ORDER BY data DESC" },
    { target: "SELECT * FROM compras ORDER BY data DESC", replace: "SELECT * FROM compras WHERE is_deleted = 0 ORDER BY data DESC" },
    { target: "SELECT * FROM culturas ORDER BY nome ASC", replace: "SELECT * FROM culturas WHERE is_deleted = 0 ORDER BY nome ASC" },
    { target: "SELECT * FROM clientes ORDER BY nome ASC", replace: "SELECT * FROM clientes WHERE is_deleted = 0 ORDER BY nome ASC" },
    { target: "SELECT * FROM cadastro ORDER BY nome ASC", replace: "SELECT * FROM cadastro WHERE is_deleted = 0 ORDER BY nome ASC" },
    { target: "SELECT * FROM maquinas ORDER BY nome ASC", replace: "SELECT * FROM maquinas WHERE is_deleted = 0 ORDER BY nome ASC" },
    { target: "SELECT * FROM usuarios ORDER BY usuario ASC", replace: "SELECT * FROM usuarios WHERE is_deleted = 0 ORDER BY usuario ASC" },
    { target: "SELECT * FROM \${tab} WHERE sync_status = 0`", replace: "SELECT * FROM \${tab} WHERE sync_status = 0 AND is_deleted = 0`" }
];

getters.forEach(g => {
    content = content.split(g.target).join(g.replace);
});

// manual fix for estoque
const estoqueTarget = "FROM estoque e\n        LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)";
const estoqueReplace = "FROM estoque e\n        LEFT JOIN cadastro c ON UPPER(e.produto) = UPPER(c.nome)\n        WHERE e.is_deleted = 0";
content = content.split(estoqueTarget).join(estoqueReplace);

// 3. Patch Deletes
const deletes = [
    { target: "DELETE FROM colheitas WHERE uuid", replace: "UPDATE colheitas SET is_deleted = 1, sync_status = 0 WHERE uuid" },
    { target: "DELETE FROM vendas WHERE uuid", replace: "UPDATE vendas SET is_deleted = 1, sync_status = 0 WHERE uuid" },
    { target: "DELETE FROM compras WHERE uuid", replace: "UPDATE compras SET is_deleted = 1, sync_status = 0 WHERE uuid" },
    { target: "DELETE FROM culturas WHERE id", replace: "UPDATE culturas SET is_deleted = 1, sync_status = 0 WHERE id" },
    { target: "DELETE FROM clientes WHERE id", replace: "UPDATE clientes SET is_deleted = 1, sync_status = 0 WHERE id" },
    { target: "DELETE FROM cadastro WHERE id", replace: "UPDATE cadastro SET is_deleted = 1, sync_status = 0 WHERE id" },
    { target: "DELETE FROM maquinas WHERE uuid", replace: "UPDATE maquinas SET is_deleted = 1, sync_status = 0 WHERE uuid" },
    { target: "DELETE FROM usuarios WHERE id", replace: "UPDATE usuarios SET is_deleted = 1 WHERE id" }
];

deletes.forEach(d => {
    content = content.split(d.target).join(d.replace);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Patch aplicado com sucesso!');
