-- Executar no Servidor Central
CREATE TABLE controle_versoes (
    versor_atual BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE clientes (
    id_cliente VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    versao_registro BIGINT NOT NULL
);

-- Exemplo de Trigger no Servidor para incrementar a versão automaticamente
CREATE TRIGGER tg_atualiza_versao_cliente
BEFORE UPDATE ON clientes
FOR EACH ROW
BEGIN
    UPDATE controle_versoes SET versor_atual = versor_atual + 1;
    SET NEW.versao_registro = (SELECT versor_atual FROM controle_versoes);
END;
