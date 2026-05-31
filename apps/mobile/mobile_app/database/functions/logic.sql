-- database/functions/all_logic.sql
-- AGROGB DIAMOND PRO - Camada de Lógica (Functions/RPC) V10.5 ⚙️
SET search_path TO public;

-- 1. FUNÇÃO: Aplicar Adubação (Atomica)
CREATE OR REPLACE FUNCTION public.apply_fertilization_v2(
  p_plano_uuid UUID,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE item RECORD;
BEGIN
    FOR item IN 
        SELECT produto_id, quantidade 
        FROM public.production_fertilization_items 
        WHERE plano_uuid = p_plano_uuid AND user_id = p_user_id 
    LOOP
        -- Baixa estoque
        UPDATE public.estoque 
        SET quantidade = quantidade - item.quantidade,
            last_updated = now()
        WHERE (produto_uuid::text = item.produto_id OR id::text = item.produto_id)
        AND user_id = p_user_id;

        -- Registra movimentação
        INSERT INTO public.v2_movimentacoes_estoque (user_id, produto_uuid, tipo, quantidade, origem, data)
        VALUES (p_user_id, NULL, 'SAÍDA', item.quantidade, 'ADUBAÇÃO', now());
    END LOOP;

    -- Conclui plano
    UPDATE public.planos_adubacao 
    SET status = 'CONCLUIDO', 
        data_aplicacao = now(),
        last_updated = now()
    WHERE uuid = p_plano_uuid AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. FUNÇÃO: Processar Venda (Atomica)
CREATE OR REPLACE FUNCTION public.process_sale_v2(
  p_user_id UUID,
  p_produto_uuid UUID,
  p_quantidade REAL,
  p_valor REAL
)
RETURNS UUID AS $$
DECLARE v_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.vendas (uuid, user_id, quantidade, valor, data_venda, last_updated)
    VALUES (v_uuid, p_user_id, p_quantidade, p_valor, now(), now());

    UPDATE public.estoque 
    SET quantidade = quantidade - p_quantidade,
        last_updated = now()
    WHERE produto_uuid = p_produto_uuid AND user_id = p_user_id;

    INSERT INTO public.v2_movimentacoes_estoque (user_id, produto_uuid, tipo, quantidade, origem, data)
    VALUES (p_user_id, p_produto_uuid, 'SAÍDA', p_quantidade, 'VENDA', now());

    RETURN v_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
