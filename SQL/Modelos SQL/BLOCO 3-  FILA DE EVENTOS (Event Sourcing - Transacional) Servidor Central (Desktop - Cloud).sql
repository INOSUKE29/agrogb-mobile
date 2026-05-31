-- 1. Tabelas limpas (O histórico fica na fila)
CREATE TABLE produtos (
    id_produto VARCHAR(36) NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    estoque INT NOT NULL
);

-- 2. Fila do Servidor (Guarda o histórico de mutações recebidas)
CREATE TABLE fila_sincronizacao_servidor (
    id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_dispositivo VARCHAR(50) NOT NULL,
    tabela_alvo VARCHAR(50) NOT NULL,
    id_registro VARCHAR(36) NOT NULL,
    acao_tipo VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    dados_json TEXT NOT NULL,       -- Payload bruto modificado
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. API do Servidor processando Conflitos por Fila (Regra: Último que enviou vence)
-- A API lê o JSON enviado pelo mobile e aplica na tabela oficial usando comandos 'UPSERT'
INSERT INTO produtos (id_produto, nome, estoque) 
VALUES ('UUID-DO-MOBILE', 'Nome do Produto', 10)
ON DUPLICATE KEY UPDATE 
    nome = VALUES(nome), 
    estoque = VALUES(estoque); -- Atualiza independente do estado atual
