-- 1. Tabelas Base com UUID e Exclusão Lógica
CREATE TABLE usuarios (
    id_usuario VARCHAR(36) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_usuarios PRIMARY KEY (id_usuario)
);

CREATE TABLE vendas (
    id_venda VARCHAR(36) NOT NULL,
    id_usuario VARCHAR(36) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deletado_logico TINYINT(1) DEFAULT 0,
    CONSTRAINT pk_vendas PRIMARY KEY (id_venda),
    CONSTRAINT fk_vendas_usuarios FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE INDEX idx_usuarios_sinc ON usuarios (ultima_atualizacao, deletado_logico);
CREATE INDEX idx_vendas_sinc ON vendas (ultima_atualizacao, deletado_logico);

-- 2. Exemplo de Consulta para a API (O que o Mobile vai requisitar)
-- O Mobile envia a data da sua última sincronização com sucesso (ex: '2026-05-20 10:00:00')
SELECT id_usuario, nome, email, deletado_logico 
FROM usuarios 
WHERE ultima_atualizacao > '2026-05-20 10:00:00';

-- 3. Resolução de Conflito na API (Regra: Servidor Sempre Vence)
-- Se o mobile tentar atualizar um dado que mudou no servidor antes, o servidor rejeita ou força o dele.
UPDATE usuarios 
SET nome = 'Nome Mobile', email = 'email@mobile.com', ultima_atualizacao = CURRENT_TIMESTAMP
WHERE id_usuario = 'UUID-EXEMPLO' 
  AND ultima_atualizacao <= 'DATA_QUE_O_MOBILE_ACHAVA_QUE_ERA_A_ULTIMA'; 
-- Se der 0 linhas afetadas, houve conflito (o servidor tinha um dado mais novo).
