const fs = require('fs');
const path = 'C:/Users/Bruno/Documents/AppAgro/agrogb-mobile.-main/src/database/database.js';
let content = fs.readFileSync(path, 'utf8');

// Adicionar Coluna anexo em compras, vendas, colheitas se não existir
const migrationCode2 = `
        // MIGRATION: Coluna Anexo para Notas Fiscais e Recibos
        const tablesWithAttachments = ['compras', 'vendas', 'colheitas', 'custos'];
        for (const table of tablesWithAttachments) {
            try { await executeQuery(\`ALTER TABLE \${table} ADD COLUMN anexo TEXT\`); } catch (e) { }
        }
        console.log('✅ Colunas de Anexo migradas');
`;
if (!content.includes('Colunas de Anexo migradas')) {
    content = content.replace("console.log('✅ Soft delete migrado');", migrationCode2 + "\n        console.log('✅ Soft delete migrado');");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patch de Banco de Dados de Anexos aplicado com sucesso!');
