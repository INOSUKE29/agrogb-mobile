CREATE TABLE usuarios_local (
    id_usuario TEXT NOT NULL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    ultima_atualizacao TEXT,
    deletado_logico INTEGER DEFAULT 0,
    status_sincronizacao TEXT DEFAULT 'SINCRONIZADO' -- 'PENDENTE' ou 'SINCRONIZADO'
);

-- Trigger Mobile: Se o usuário editar localmente, marca como PENDENTE para a API saber que deve enviar
CREATE TRIGGER tg_usuarios_local_update AFTER UPDATE ON usuarios_local
BEGIN
    UPDATE usuarios_local 
    SET status_sincronizacao = 'PENDENTE', 
        ultima_atualizacao = datetime('now')
    WHERE id_usuario = NEW.id_usuario AND status_sincronizacao != 'PENDENTE';
END;
