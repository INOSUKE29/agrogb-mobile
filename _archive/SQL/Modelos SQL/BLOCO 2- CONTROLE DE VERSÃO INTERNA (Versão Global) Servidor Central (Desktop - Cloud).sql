-- 1. Controle de Versão Central
CREATE TABLE controle_versoes (
    id_controle INT NOT NULL PRIMARY KEY,
    versao_atual BIGINT NOT NULL DEFAULT 1
);
INSERT INTO controle_versoes (id_controle, versao_atual) VALUES (1, 1);

-- 2. Tabelas de Negócio
CREATE TABLE clientes (
    id_cliente VARCHAR(36) NOT NULL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    versao_registro BIGINT NOT NULL DEFAULT 1,
    deletado_logico TINYINT(1) DEFAULT 0
);

CREATE INDEX idx_clientes_versao ON clientes (versao_registro);

-- 3. Trigger do Servidor: Incrementa a versão global a cada alteração automaticamente
CREATE TRIGGER tg_clientes_incrementa_versao
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
    -- Atualiza a versão global do sistema
    UPDATE controle_versoes SET versao_atual = versao_atual + 1 WHERE id_controle = 1;
    -- Atribui a nova versão ao registro modificado
    SET NEW.versao_registro = (SELECT versao_atual FROM controle_versoes WHERE id_controle = 1);
END;

-- 4. Exemplo de Payload JSON simulado por consulta SQL
-- O Mobile diz: "Estou na versão 45". O servidor responde com tudo superior a 45:
SELECT id_cliente, nome, versao_registro, deletado_logico 
FROM clientes 
WHERE versao_registro > 45;
