-- Executar no Servidor Central
CREATE TABLE fila_sincronizacao (
    id_evento BIGINT AUTO_INCREMENT PRIMARY KEY,
    tabela_alvo VARCHAR(50) NOT NULL,
    id_registro VARCHAR(36) NOT NULL,
    acao_tipo ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    dados_json JSON, -- Contém o estado do objeto alterado
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
