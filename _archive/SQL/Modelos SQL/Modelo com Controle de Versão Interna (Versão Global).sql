-- ============================================================================
-- MODELO 2: VERSÃO INTERNA / GLOBAL (SERVIDOR CENTRAL / DESKTOP)
-- ============================================================================

-- Tabela controladora da versão atual do banco do servidor
CREATE TABLE controle_versoes (
    id_controle INT NOT NULL,
    versao_atual BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT pk_controle_versoes PRIMARY KEY (id_controle)
);

-- Inserir o registro inicial obrigatório
INSERT INTO controle_versoes (id_controle, versao_atual) VALUES (1, 1);

-- Tabela de Clientes
CREATE TABLE clientes (
    id_cliente VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    versao_registro BIGINT NOT NULL DEFAULT 1,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_clientes PRIMARY KEY (id_cliente)
);

-- Tabela de Endereços
CREATE TABLE enderecos (
    id_endereco VARCHAR(36) NOT NULL,
    id_cliente VARCHAR(36) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    versao_registro BIGINT NOT NULL DEFAULT 1,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_enderecos PRIMARY KEY (id_endereco),
    CONSTRAINT fk_enderecos_clientes FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- Índices para busca rápida por versão
CREATE INDEX idx_clientes_versao ON clientes (versao_registro);
CREATE INDEX idx_enderecos_versao ON enderecos (versao_registro);


-- ============================================================================
-- MODELO 2: LOCAL (DISPOSITIVO MOBILE / SQLITE)
-- ============================================================================

-- Armazena o número da última versão que o mobile conseguiu baixar com sucesso
CREATE TABLE metadados_sincronizacao (
    chave TEXT PRIMARY KEY,
    valor_versao INTEGER NOT NULL DEFAULT 0
);

INSERT INTO metadados_sincronizacao (chave, valor_versao) VALUES ('ultima_versao_servidor', 0);

CREATE TABLE clientes_local (
    id_cliente TEXT NOT NULL,
    nome TEXT NOT NULL,
    versao_registro INTEGER DEFAULT 0,
    deletado_logico INTEGER DEFAULT 0,
    status_sincronizacao TEXT DEFAULT 'SINCRONIZADO',
    PRIMARY KEY (id_cliente)
);
