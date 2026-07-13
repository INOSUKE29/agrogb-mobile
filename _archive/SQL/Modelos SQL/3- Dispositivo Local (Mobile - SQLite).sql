CREATE TABLE produtos_local (
    id_produto TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    estoque INTEGER NOT NULL
);

-- Fila de auditoria local (Registra tudo o que foi feito offline)
CREATE TABLE fila_sincronizacao_local (
    id_evento_local INTEGER PRIMARY KEY AUTOINCREMENT,
    tabela_alvo TEXT NOT NULL,
    id_registro TEXT NOT NULL,
    acao_tipo TEXT NOT NULL,
    dados_json TEXT NOT NULL, -- Guarda o estado do registro em texto JSON
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    status_envio TEXT DEFAULT 'PENDENTE'
);

-- 4. Triggers locais para alimentar a fila automaticamente quando o app estiver offline
CREATE TRIGGER tg_produtos_local_insert AFTER INSERT ON produtos_local
BEGIN
    INSERT INTO fila_sincronizacao_local (tabela_alvo, id_registro, acao_tipo, dados_json)
    VALUES (
        'produtos', 
        NEW.id_produto, 
        'INSERT', 
        '{"nome": "' || NEW.nome || '", "estoque": ' || NEW.estoque || '}'
    );
END;

CREATE TRIGGER tg_produtos_local_delete AFTER DELETE ON produtos_local
BEGIN
    INSERT INTO fila_sincronizacao_local (tabela_alvo, id_registro, acao_tipo, dados_json)
    VALUES ('produtos', OLD.id_produto, 'DELETE', '{}');
END;
