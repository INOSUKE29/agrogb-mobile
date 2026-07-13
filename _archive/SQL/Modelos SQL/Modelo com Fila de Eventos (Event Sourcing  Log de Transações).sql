-- ============================================================================
-- MODELO 3: FILA DE EVENTOS (SERVIDOR CENTRAL / DESKTOP)
-- ============================================================================

-- Tabelas de negócio limpas (Sem colunas extras de sincronização)
CREATE TABLE produtos (
    id_produto VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    estoque INT NOT NULL,
    CONSTRAINT pk_produtos PRIMARY KEY (id_produto)
);

-- Fila centralizadora onde o servidor recebe ou registra as alterações
CREATE TABLE fila_sincronizacao_servidor (
    id_evento BIGINT NOT NULL, -- Sequencial gerado no servidor
    id_dispositivo VARCHAR(50) NOT NULL, -- Identifica quem enviou
    tabela_alvo VARCHAR(50) NOT NULL, -- Ex: 'produtos'
    id_registro VARCHAR(36) NOT NULL, -- ID do UUID alterado
    acao_tipo VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    dados_json TEXT NOT NULL, -- Estado do objeto em formato JSON string
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_fila_servidor PRIMARY KEY (id_evento)
);

CREATE INDEX idx_fila_servidor_busca ON fila_sincronizacao_servidor (id_evento);


-- ============================================================================
-- MODELO 3: LOCAL (DISPOSITIVO MOBILE / SQLITE)
-- ============================================================================

CREATE TABLE produtos_local (
    id_produto TEXT NOT NULL,
    nome TEXT NOT NULL,
    estoque INTEGER NOT NULL,
    PRIMARY KEY (id_produto)
);

-- Fila local: Guarda o histórico do que foi feito em modo offline
CREATE TABLE fila_sincronizacao_local (
    id_evento_local INTEGER PRIMARY KEY AUTOINCREMENT,
    tabela_alvo TEXT NOT NULL,
    id_registro TEXT NOT NULL,
    acao_tipo TEXT NOT NULL,
    dados_json TEXT NOT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    status_envio TEXT DEFAULT 'PENDENTE' -- 'PENDENTE' ou 'ENVIADO'
);

CREATE INDEX idx_fila_local_pendente ON fila_sincronizacao_local (status_envio);
