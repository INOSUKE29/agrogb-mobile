import { AUTH_SCHEMA } from '../schemas/auth_schema';
import { FINANCE_SCHEMA } from '../schemas/finance_schema';
import { INVENTORY_SCHEMA } from '../schemas/inventory_schema';
import { PRODUCTION_SCHEMA } from '../schemas/production_schema';
import { FARM_SCHEMA } from '../schemas/farm_schema';
import { SYSTEM_SCHEMA } from '../schemas/system_schema';

export const V1_DIAMOND_PRO = [
    ...AUTH_SCHEMA,
    ...FINANCE_SCHEMA,
    ...INVENTORY_SCHEMA,
    ...PRODUCTION_SCHEMA,
    ...FARM_SCHEMA,
    ...SYSTEM_SCHEMA,

    // --- MIGRATIONS CONSOLIDADAS (ALTER TABLES / PATCHES) ---
    `ALTER TABLE usuarios ADD COLUMN email TEXT;`,
    `ALTER TABLE cadastro ADD COLUMN estocavel INTEGER DEFAULT 1;`,
    `ALTER TABLE cadastro ADD COLUMN vendavel INTEGER DEFAULT 1;`,
    // ... (restante das queries de alter table conforme necessário para v1.1)
    
    // Seeders & Admins (Finalização)
    `INSERT OR IGNORE INTO usuarios (usuario, senha, nivel, email, nome_completo) VALUES ('ADMIN', '1234', 'ADM', 'admin@agrogb.com', 'ADMINISTRADOR MESTRE');`,
    `UPDATE usuarios SET email = 'admin@agrogb.com', nome_completo = 'ADMINISTRADOR MESTRE' WHERE usuario = 'ADMIN' AND (email IS NULL OR email = '');`,
    `INSERT OR IGNORE INTO app_settings (id, updated_at) VALUES (1, '${new Date().toISOString()}');`
];
