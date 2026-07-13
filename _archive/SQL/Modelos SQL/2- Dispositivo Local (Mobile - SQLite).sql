CREATE TABLE metadados_sincronizacao (
    chave TEXT PRIMARY KEY,
    valor_versao INTEGER NOT NULL DEFAULT 0
);
INSERT INTO metadados_sincronizacao (chave, valor_versao) VALUES ('ultima_versao_servidor', 0);

CREATE TABLE clientes_local (
    id_cliente TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    versao_registro INTEGER DEFAULT 0,
    deletado_logico INTEGER DEFAULT 0,
    status_sincronizacao TEXT DEFAULT 'SINCRONIZADO'
);
