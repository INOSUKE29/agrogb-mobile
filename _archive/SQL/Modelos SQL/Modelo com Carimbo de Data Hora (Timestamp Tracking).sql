-- ============================================================================
-- MODELO 1: TIMESTAMP TRACKING (SERVIDOR CENTRAL / DESKTOP)
-- ============================================================================

-- Tabela de Usuários (Exemplo de Entidade)
CREATE TABLE usuarios (
    id_usuario VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario)
);

-- Tabela de Vendas (Exemplo de Entidade com Relacionamento)
CREATE TABLE vendas (
    id_venda VARCHAR(36) NOT NULL,
    id_usuario VARCHAR(36) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_vendas PRIMARY KEY (id_venda),
    CONSTRAINT fk_vendas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Índices essenciais para otimizar a busca de sincronização
CREATE INDEX idx_usuarios_sinc ON usuarios (ultima_atualizacao, deletado_logico);
CREATE INDEX idx_vendas_sinc ON vendas (ultima_atualizacao, deletado_logico);


-- ============================================================================
-- MODELO 1: LOCAL (DISPOSITIVO MOBILE / SQLITE)
-- ============================================================================

CREATE TABLE usuarios_local (
    id_usuario TEXT NOT NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    ultima_atualizacao TEXT,
    deletado_logico INTEGER DEFAULT 0,
    status_sincronizacao TEXT DEFAULT 'SINCRONIZADO', -- Valores: 'PENDENTE' ou 'SINCRONIZADO'
    PRIMARY KEY (id_usuario)
);

CREATE TABLE vendas_local (
    id_venda TEXT NOT NULL,
    id_usuario TEXT NOT NULL,
    valor_total REAL NOT NULL,
    data_venda TEXT,
    ultima_atualizacao TEXT,
    deletado_logico INTEGER DEFAULT 0,
    status_sincronizacao TEXT DEFAULT 'SINCRONIZADO',
    PRIMARY KEY (id_venda),
    FOREIGN KEY (id_usuario) REFERENCES usuarios_local(id_usuario)
);
