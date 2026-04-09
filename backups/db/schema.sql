


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "agro_admin";


ALTER SCHEMA "agro_admin" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."apply_fertilization_v2"("p_plano_uuid" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."apply_fertilization_v2"("p_plano_uuid" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_financial_summary"() RETURNS TABLE("faturamento" numeric, "custos" numeric, "resultado_liquido" numeric, "margem_percentual" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT 
    faturamento,
    custos,
    resultado_liquido,
    margem_percentual
  FROM financial_summary
  WHERE user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_financial_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_pkey_cols"("p_table" "text") RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  SELECT string_agg(attname, ',') FROM (
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE i.indrelid = format('public.%s', p_table)::regclass
      AND i.indisprimary
    ORDER BY a.attnum
  ) s;
$$;


ALTER FUNCTION "public"."get_table_pkey_cols"("p_table" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'PRODUTOR');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."monitoramento_entidade_run_checks"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  cnt bigint := 0;
  sample jsonb := '[]'::jsonb;
  fks jsonb := '[]'::jsonb;
  idxs jsonb := '[]'::jsonb;
  trgs jsonb := '[]'::jsonb;
  report jsonb;
BEGIN
  -- Count flagged rows if table and column exist
  PERFORM 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='monitoramento_entidade';
  IF FOUND THEN
    -- check column
    PERFORM 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='monitoramento_entidade' AND column_name='usuario_id_to_drop';
    IF FOUND THEN
      EXECUTE 'SELECT COUNT(*) FROM public.monitoramento_entidade WHERE usuario_id_to_drop IS NOT NULL' INTO cnt;

      EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (SELECT id, usuario_id_to_drop, user_id, updated_at FROM public.monitoramento_entidade WHERE usuario_id_to_drop IS NOT NULL LIMIT 10) t' INTO sample;
    END IF;

    -- foreign keys referencing the table
    SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) INTO fks FROM (
      SELECT tc.table_schema, tc.table_name, kcu.column_name, ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND (ccu.table_name = 'monitoramento_entidade' OR kcu.table_name = 'monitoramento_entidade')
    ) r;

    -- indexes
    SELECT coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) INTO idxs FROM (
      SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='monitoramento_entidade'
    ) i;

    -- triggers
    SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO trgs FROM (
      SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'public.monitoramento_entidade'::regclass
    ) t;
  END IF;

  report := jsonb_build_object(
    'run_at', now(),
    'target_table', 'public.monitoramento_entidade',
    'total_flagged', cnt,
    'sample', sample,
    'dependencies', jsonb_build_object('foreign_keys', fks, 'indexes', idxs, 'triggers', trgs)
  );

  -- insert into audit table (create if not exists)
  PERFORM 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='monitoramento_entidade_audit';
  IF NOT FOUND THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.monitoramento_entidade_audit(id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), target_table text, total_flagged bigint, sample jsonb, dependencies jsonb, report_path text, created_at timestamp DEFAULT now())';
  END IF;

  INSERT INTO public.monitoramento_entidade_audit(target_table, total_flagged, sample, dependencies, report_path)
    VALUES ('public.monitoramento_entidade', cnt, sample, jsonb_build_object('foreign_keys', fks, 'indexes', idxs, 'triggers', trgs), NULL);

END;
$$;


ALTER FUNCTION "public"."monitoramento_entidade_run_checks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_sale_v2"("p_usuario_id" "uuid", "p_produto_uuid" "uuid", "p_quantidade" real, "p_valor" real) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE v_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO public.v2_vendas (uuid, usuario_id, quantidade, valor, data_venda, last_updated)
    VALUES (v_uuid, p_usuario_id, p_quantidade, p_valor, now(), now());

    UPDATE public.v2_estoque_atual 
    SET quantidade = quantidade - p_quantidade, last_updated = now()
    WHERE (produto_uuid = p_produto_uuid OR uuid = p_produto_uuid) AND usuario_id = p_usuario_id;

    INSERT INTO public.v2_estoque_movimentacoes (uuid, usuario_id, produto_uuid, tipo, quantidade, origem, data)
    VALUES (gen_random_uuid(), p_usuario_id, p_produto_uuid, 'SAÍDA', p_quantidade, 'VENDA: ' || v_uuid::text, now());

    RETURN v_uuid;
END;
$$;


ALTER FUNCTION "public"."process_sale_v2"("p_usuario_id" "uuid", "p_produto_uuid" "uuid", "p_quantidade" real, "p_valor" real) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."try_text_to_uuid"("text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'pg_catalog', 'public'
    AS $_$
DECLARE v uuid;
BEGIN
  BEGIN v := $1::uuid; RETURN v; EXCEPTION WHEN others THEN RETURN NULL; END;
END;
$_$;


ALTER FUNCTION "public"."try_text_to_uuid"("text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_last_updated_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_last_updated_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."v2_fazendas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "produtor_id" "uuid",
    "nome" "text" NOT NULL,
    "area_total" numeric,
    "cidade" "text",
    "estado" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."v2_fazendas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_talhoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "fazenda_id" "uuid",
    "nome" "text" NOT NULL,
    "area" numeric,
    "tipo_solo" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."v2_talhoes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "agro_admin"."admin_usuario_integrity_report" AS
 SELECT 'v2_fazendas'::"text" AS "table_name",
    "count"(*) FILTER (WHERE ("v2_fazendas"."usuario_id" IS NULL)) AS "null_count"
   FROM "public"."v2_fazendas"
UNION ALL
 SELECT 'v2_talhoes'::"text" AS "table_name",
    "count"(*) FILTER (WHERE ("v2_talhoes"."usuario_id" IS NULL)) AS "null_count"
   FROM "public"."v2_talhoes";


ALTER VIEW "agro_admin"."admin_usuario_integrity_report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "data" "text",
    "usuario" "text",
    "acao" "text",
    "entidade" "text",
    "descricao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analise_ia" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "monitoramento_uuid" "uuid",
    "classificacao_principal" "text",
    "classificacoes_secundarias" "text",
    "sintomas" "text",
    "causa_provavel" "text",
    "tipo_problema" "text",
    "nutriente" "text",
    "sugestao_controle" "text",
    "produtos_citados" "text",
    "dosagem" "text",
    "forma_aplicacao" "text",
    "observacoes_tecnicas" "text",
    "fonte_informacao" "text",
    "criado_em" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."analise_ia" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" integer NOT NULL,
    "uuid" "text" DEFAULT ("extensions"."uuid_generate_v4"())::"text",
    "primary_color" "text",
    "theme_mode" "text",
    "fazenda_nome" "text",
    "fazenda_produtor" "text",
    "fazenda_documento" "text",
    "fazenda_telefone" "text",
    "fazenda_email" "text",
    "fazenda_logo" "text",
    "fin_moeda" "text",
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cadastro" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nome" "text" NOT NULL,
    "unidade" "text" DEFAULT 'UN'::"text",
    "categoria" "text" DEFAULT 'INSUMO'::"text",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text",
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."cadastro" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categorias_despesa" (
    "id" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "uuid" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."categorias_despesa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "text" DEFAULT ("extensions"."uuid_generate_v4"())::"text",
    "name" "text",
    "type" "text",
    "is_default" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid",
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text"
);


ALTER TABLE "public"."cost_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."costs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "category_id" "uuid",
    "culture_id" "uuid",
    "fleet_id" "uuid",
    "quantity" numeric,
    "unit_value" numeric,
    "total_value" numeric,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid",
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text"
);


ALTER TABLE "public"."costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."descarte" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "produto" "text",
    "quantidade_kg" numeric,
    "motivo" "text",
    "data" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid",
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text"
);


ALTER TABLE "public"."descarte" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "data" "text",
    "tela" "text",
    "erro" "text",
    "stack" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fertilization_applications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "farm_id" "text",
    "recipe_id" "uuid",
    "date" "text" NOT NULL,
    "culture" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "sync_status" integer DEFAULT 0
);


ALTER TABLE "public"."fertilization_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fertilization_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "recipe_id" "uuid",
    "product_name" "text" NOT NULL,
    "quantity" numeric DEFAULT 0,
    "unit" "text",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text"
);


ALTER TABLE "public"."fertilization_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fertilization_recipes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "farm_id" "text",
    "name" "text" NOT NULL,
    "type" "text",
    "culture" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "sync_status" integer DEFAULT 0
);


ALTER TABLE "public"."fertilization_recipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text",
    "description" "text" NOT NULL,
    "category" "text",
    "total_amount" numeric(15,2) DEFAULT 0,
    "due_date" "date",
    "status" "text" DEFAULT 'pendente'::"text",
    "payment_method" "text",
    "origin_uuid" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false,
    CONSTRAINT "financial_accounts_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'pago'::"text", 'vencido'::"text"]))),
    CONSTRAINT "financial_accounts_type_check" CHECK (("type" = ANY (ARRAY['PAGAR'::"text", 'RECEBER'::"text"])))
);


ALTER TABLE "public"."financial_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_installments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_id" "uuid",
    "installment_number" integer NOT NULL,
    "value" numeric(15,2) NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."financial_installments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."movimentacoes_financeiras" (
    "id" bigint NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "tipo" "text" NOT NULL,
    "categoria" "text" NOT NULL,
    "descricao" "text",
    "valor" numeric DEFAULT 0 NOT NULL,
    "data" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid",
    CONSTRAINT "movimentacoes_financeiras_tipo_check" CHECK (("tipo" = ANY (ARRAY['receita'::"text", 'custo'::"text"])))
);


ALTER TABLE "public"."movimentacoes_financeiras" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."financial_summary" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "sum"(
        CASE
            WHEN ("tipo" = 'receita'::"text") THEN "valor"
            ELSE (0)::numeric
        END) AS "faturamento",
    "sum"(
        CASE
            WHEN ("tipo" = 'custo'::"text") THEN "valor"
            ELSE (0)::numeric
        END) AS "custos",
    ("sum"(
        CASE
            WHEN ("tipo" = 'receita'::"text") THEN "valor"
            ELSE (0)::numeric
        END) - "sum"(
        CASE
            WHEN ("tipo" = 'custo'::"text") THEN "valor"
            ELSE (0)::numeric
        END)) AS "resultado_liquido",
        CASE
            WHEN ("sum"(
            CASE
                WHEN ("tipo" = 'receita'::"text") THEN "valor"
                ELSE (0)::numeric
            END) = (0)::numeric) THEN (0)::numeric
            ELSE "round"(((("sum"(
            CASE
                WHEN ("tipo" = 'receita'::"text") THEN "valor"
                ELSE (0)::numeric
            END) - "sum"(
            CASE
                WHEN ("tipo" = 'custo'::"text") THEN "valor"
                ELSE (0)::numeric
            END)) / "sum"(
            CASE
                WHEN ("tipo" = 'receita'::"text") THEN "valor"
                ELSE (0)::numeric
            END)) * (100)::numeric), 2)
        END AS "margem_percentual"
   FROM "public"."movimentacoes_financeiras"
  GROUP BY "user_id";


ALTER VIEW "public"."financial_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "area_id" "text",
    "cultura_id" "text",
    "data" "text",
    "observacao_usuario" "text",
    "status" "text" DEFAULT 'RASCUNHO'::"text",
    "nivel_confianca" "text" DEFAULT 'TÉCNICO'::"text",
    "severidade" "text" DEFAULT 'BAIXA'::"text",
    "categoria" "text" DEFAULT 'OUTROS'::"text",
    "criado_em" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "user_id" "uuid",
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_table" "text" NOT NULL,
    "total_flagged" bigint,
    "sample" "jsonb",
    "dependencies" "jsonb",
    "report_path" "text",
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" (
    "id" "uuid",
    "run_at" timestamp with time zone,
    "target_table" "text",
    "total_flagged" bigint,
    "sample" "jsonb",
    "dependencies" "jsonb",
    "report_path" "text",
    "is_deleted_bool" boolean,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_usuario_id_backup" (
    "monitoramento_entidade_id" "uuid",
    "usuario_id_bak_20260315145412" "text",
    "user_id" "uuid",
    "backed_up_at" timestamp with time zone,
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" (
    "monitoramento_entidade_id" "uuid",
    "user_id" "uuid",
    "backed_up_at" timestamp with time zone,
    "is_deleted_bool" boolean,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "monitoramento_uuid" "uuid",
    "tipo" "text",
    "caminho_arquivo" "text",
    "criado_em" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_media" OWNER TO "postgres";


ALTER TABLE "public"."movimentacoes_financeiras" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."movimentacoes_financeiras_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."movimentos_estoque" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item_id" "uuid",
    "tipo_movimento" "text",
    "quantidade" numeric,
    "referencia" "text",
    "data_movimento" timestamp without time zone,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "text" DEFAULT ("extensions"."uuid_generate_v4"())::"text",
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."movimentos_estoque" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "cliente_id" "uuid",
    "produto_id" "uuid",
    "unidade" "text" NOT NULL,
    "quantidade_total" numeric NOT NULL,
    "quantidade_restante" numeric NOT NULL,
    "valor_unitario" numeric,
    "data_prevista" "text",
    "status" "text" DEFAULT 'PENDENTE'::"text",
    "observacao" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_fertilization_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plano_uuid" "uuid",
    "produto_id" "text",
    "quantidade" real
);


ALTER TABLE "public"."production_fertilization_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nome" "text",
    "email" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receitas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "produto_pai_uuid" "uuid",
    "item_filho_uuid" "uuid",
    "quantidade" numeric,
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."receitas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schema_migrations" (
    "id" integer NOT NULL,
    "run_ts" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "script" "text"
);


ALTER TABLE "public"."schema_migrations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."schema_migrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schema_migrations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schema_migrations_id_seq" OWNED BY "public"."schema_migrations"."id";



CREATE TABLE IF NOT EXISTS "public"."unidades_medida" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "nome" "text",
    "sigla" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."unidades_medida" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text",
    "email" "text",
    "tipo_usuario" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "text" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id_bak_20260315145412" "uuid",
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id" "uuid",
    CONSTRAINT "users_uuid_check" CHECK (("uuid" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuario_id_quarantine" (
    "id" integer NOT NULL,
    "run_ts" timestamp with time zone DEFAULT "now"(),
    "source_table" "text" NOT NULL,
    "source_primary_key" "jsonb",
    "usuario_id" "uuid",
    "row_data" "jsonb",
    "note" "text"
);


ALTER TABLE "public"."usuario_id_quarantine" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."usuario_id_quarantine_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."usuario_id_quarantine_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."usuario_id_quarantine_id_seq" OWNED BY "public"."usuario_id_quarantine"."id";



CREATE TABLE IF NOT EXISTS "public"."v2_analise_solo" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "talhao_id" "uuid",
    "ph" numeric,
    "fosforo" numeric,
    "potassio" numeric,
    "usuario_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."v2_analise_solo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_custos" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "valor_total" numeric,
    "descricao" "text",
    "data" "date" DEFAULT CURRENT_DATE,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text",
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."v2_custos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_estoque_atual" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "produto_uuid" "uuid",
    "quantidade" numeric DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text",
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."v2_estoque_atual" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_estoque_movimentacoes" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "produto_uuid" "uuid",
    "tipo" "text" NOT NULL,
    "quantidade" numeric NOT NULL,
    "origem" "text",
    "data" timestamp with time zone DEFAULT "now"(),
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text",
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."v2_estoque_movimentacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_plantios" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "usuario_id" "uuid",
    "cultura" "text",
    "quantidade_pes" integer,
    "data" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."v2_plantios" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_produtores" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text",
    "telefone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone,
    "device_id" "text",
    "is_deleted" integer DEFAULT 0,
    "is_deleted_bool" boolean DEFAULT false,
    "usuario_id_bak_20260315145412" "uuid",
    "usuario_id" "uuid"
);


ALTER TABLE "public"."v2_produtores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_recomendacoes_tecnicas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "talhao_id" "uuid",
    "tipo" "text",
    "titulo" "text",
    "descricao" "text",
    "usuario_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."v2_recomendacoes_tecnicas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_sync_conflicts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "table_name" "text" NOT NULL,
    "record_uuid" "uuid" NOT NULL,
    "local_data" "jsonb",
    "remote_data" "jsonb",
    "status" "text" DEFAULT 'Pendente'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."v2_sync_conflicts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."v2_vendas" (
    "uuid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "usuario_id" "uuid",
    "quantidade" numeric,
    "valor" numeric,
    "data_venda" "date" DEFAULT CURRENT_DATE,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "farm_id" "text" DEFAULT 'fazenda_padrao'::"text",
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "public"."v2_vendas" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."view_financeiro_resumo" WITH ("security_invoker"='true') AS
 SELECT "usuario_id",
    COALESCE("sum"("valor"), (0)::numeric) AS "total_vendas",
    ( SELECT COALESCE("sum"("c"."valor_total"), (0)::numeric) AS "coalesce"
           FROM "public"."v2_custos" "c"
          WHERE ("c"."usuario_id" = "v"."usuario_id")) AS "total_custos",
    (COALESCE("sum"("valor"), (0)::numeric) - ( SELECT COALESCE("sum"("c"."valor_total"), (0)::numeric) AS "coalesce"
           FROM "public"."v2_custos" "c"
          WHERE ("c"."usuario_id" = "v"."usuario_id"))) AS "lucro_liquido"
   FROM "public"."v2_vendas" "v"
  GROUP BY "usuario_id";


ALTER VIEW "public"."view_financeiro_resumo" OWNER TO "postgres";


ALTER TABLE ONLY "public"."schema_migrations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schema_migrations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."usuario_id_quarantine" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."usuario_id_quarantine_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."cadastro"
    ADD CONSTRAINT "cadastro_nome_unique" UNIQUE ("nome");



ALTER TABLE ONLY "public"."cadastro"
    ADD CONSTRAINT "cadastro_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."categorias_despesa"
    ADD CONSTRAINT "categorias_despesa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_categories"
    ADD CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_categories"
    ADD CONSTRAINT "cost_categories_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."costs"
    ADD CONSTRAINT "costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."costs"
    ADD CONSTRAINT "costs_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."descarte"
    ADD CONSTRAINT "descarte_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."descarte"
    ADD CONSTRAINT "descarte_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."fertilization_applications"
    ADD CONSTRAINT "fertilization_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fertilization_items"
    ADD CONSTRAINT "fertilization_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fertilization_recipes"
    ADD CONSTRAINT "fertilization_recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_accounts"
    ADD CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."financial_installments"
    ADD CONSTRAINT "financial_installments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoramento_entidade_audit"
    ADD CONSTRAINT "monitoramento_entidade_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoramento_entidade"
    ADD CONSTRAINT "monitoramento_entidade_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoramento_entidade"
    ADD CONSTRAINT "monitoramento_entidade_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."monitoramento_media"
    ADD CONSTRAINT "monitoramento_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoramento_media"
    ADD CONSTRAINT "monitoramento_media_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."movimentacoes_financeiras"
    ADD CONSTRAINT "movimentacoes_financeiras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_fertilization_items"
    ADD CONSTRAINT "production_fertilization_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receitas"
    ADD CONSTRAINT "receitas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receitas"
    ADD CONSTRAINT "receitas_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unidades_medida"
    ADD CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unidades_medida"
    ADD CONSTRAINT "unidades_medida_sigla_key" UNIQUE ("sigla");



ALTER TABLE ONLY "public"."unidades_medida"
    ADD CONSTRAINT "unidades_medida_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."usuario_id_quarantine"
    ADD CONSTRAINT "usuario_id_quarantine_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_analise_solo"
    ADD CONSTRAINT "v2_analise_solo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_custos"
    ADD CONSTRAINT "v2_custos_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."v2_estoque_atual"
    ADD CONSTRAINT "v2_estoque_atual_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."v2_estoque_movimentacoes"
    ADD CONSTRAINT "v2_estoque_movimentacoes_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."v2_fazendas"
    ADD CONSTRAINT "v2_fazendas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_plantios"
    ADD CONSTRAINT "v2_plantios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_produtores"
    ADD CONSTRAINT "v2_produtores_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."v2_produtores"
    ADD CONSTRAINT "v2_produtores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_recomendacoes_tecnicas"
    ADD CONSTRAINT "v2_recomendacoes_tecnicas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_sync_conflicts"
    ADD CONSTRAINT "v2_sync_conflicts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_talhoes"
    ADD CONSTRAINT "v2_talhoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."v2_vendas"
    ADD CONSTRAINT "v2_vendas_pkey" PRIMARY KEY ("uuid");



CREATE INDEX "activity_log_usuario_id_idx" ON "public"."activity_log" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "analise_ia_usuario_id_idx" ON "public"."analise_ia" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "app_settings_usuario_id_idx" ON "public"."app_settings" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "categorias_despesa_usuario_id_idx" ON "public"."categorias_despesa" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "cost_categories_usuario_id_idx" ON "public"."cost_categories" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "costs_usuario_id_idx" ON "public"."costs" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "descarte_usuario_id_idx" ON "public"."descarte" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "error_logs_usuario_id_idx" ON "public"."error_logs" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "idx_backup_monitoramento_entidade_id" ON "public"."monitoramento_entidade_usuario_id_backup" USING "btree" ("monitoramento_entidade_id");



CREATE INDEX "idx_fin_acc_date" ON "public"."financial_accounts" USING "btree" ("due_date");



CREATE INDEX "idx_fin_acc_user" ON "public"."financial_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_fin_inst_acc" ON "public"."financial_installments" USING "btree" ("account_id");



CREATE INDEX "idx_monitoramento_entidade_user_id" ON "public"."monitoramento_entidade" USING "btree" ("user_id");



CREATE INDEX "idx_movimentestoque_item_id" ON "public"."movimentos_estoque" USING "btree" ("item_id");



CREATE INDEX "idx_users_updated" ON "public"."users" USING "btree" ("last_updated");



CREATE INDEX "monitoramento_entidade_audit_usuario_id_idx" ON "public"."monitoramento_entidade_audit" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "monitoramento_entidade_user_id_idx" ON "public"."monitoramento_entidade" USING "btree" ("user_id");



CREATE INDEX "monitoramento_entidade_usuario_id_backup_user_id_idx" ON "public"."monitoramento_entidade_usuario_id_backup" USING "btree" ("user_id");



CREATE INDEX "monitoramento_entidade_usuario_id_backup_usuario_id_idx" ON "public"."monitoramento_entidade_usuario_id_backup" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "monitoramento_entidade_usuario_id_idx" ON "public"."monitoramento_entidade" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "monitoramento_media_usuario_id_idx" ON "public"."monitoramento_media" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "movimentacoes_financeiras_user_id_idx" ON "public"."movimentacoes_financeiras" USING "btree" ("user_id");



CREATE INDEX "movimentacoes_financeiras_usuario_id_idx" ON "public"."movimentacoes_financeiras" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "movimentos_estoque_usuario_id_idx" ON "public"."movimentos_estoque" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "profiles_usuario_id_idx" ON "public"."profiles" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "receitas_usuario_id_idx" ON "public"."receitas" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "unidades_medida_usuario_id_idx" ON "public"."unidades_medida" USING "btree" ("usuario_id_bak_20260315145412");



CREATE UNIQUE INDEX "uq_activity_log_uuid" ON "public"."activity_log" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_analise_ia_uuid" ON "public"."analise_ia" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_costs_uuid" ON "public"."costs" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_descarte_uuid" ON "public"."descarte" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_error_logs_uuid" ON "public"."error_logs" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_monitoramento_entidade_uuid" ON "public"."monitoramento_entidade" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_monitoramento_media_uuid" ON "public"."monitoramento_media" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_movimentacoes_financeiras_uuid" ON "public"."movimentacoes_financeiras" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_profiles_uuid" ON "public"."profiles" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_receitas_uuid" ON "public"."receitas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_unidades_medida_uuid" ON "public"."unidades_medida" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_users_uuid" ON "public"."users" USING "btree" ("uuid");



CREATE INDEX "users_usuario_id_idx" ON "public"."users" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "v2_fazendas_usuario_id_idx" ON "public"."v2_fazendas" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "v2_produtores_usuario_id_idx" ON "public"."v2_produtores" USING "btree" ("usuario_id_bak_20260315145412");



CREATE INDEX "v2_talhoes_usuario_id_idx" ON "public"."v2_talhoes" USING "btree" ("usuario_id_bak_20260315145412");



CREATE OR REPLACE TRIGGER "tr_update_last_updated_cadastro" BEFORE UPDATE ON "public"."cadastro" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated_column"();



CREATE OR REPLACE TRIGGER "tr_update_last_updated_v2_custos" BEFORE UPDATE ON "public"."v2_custos" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated_column"();



CREATE OR REPLACE TRIGGER "tr_update_last_updated_v2_estoque_atual" BEFORE UPDATE ON "public"."v2_estoque_atual" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated_column"();



CREATE OR REPLACE TRIGGER "tr_update_last_updated_v2_estoque_movimentacoes" BEFORE UPDATE ON "public"."v2_estoque_movimentacoes" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated_column"();



CREATE OR REPLACE TRIGGER "tr_update_last_updated_v2_vendas" BEFORE UPDATE ON "public"."v2_vendas" FOR EACH ROW EXECUTE FUNCTION "public"."update_last_updated_column"();



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_monitoramento_uuid_fkey" FOREIGN KEY ("monitoramento_uuid") REFERENCES "public"."monitoramento_entidade"("id");



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."categorias_despesa"
    ADD CONSTRAINT "categorias_despesa_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cost_categories"
    ADD CONSTRAINT "cost_categories_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."costs"
    ADD CONSTRAINT "costs_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."descarte"
    ADD CONSTRAINT "descarte_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fertilization_applications"
    ADD CONSTRAINT "fertilization_applications_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."fertilization_recipes"("id");



ALTER TABLE ONLY "public"."fertilization_applications"
    ADD CONSTRAINT "fertilization_applications_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."fertilization_items"
    ADD CONSTRAINT "fertilization_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."fertilization_recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fertilization_recipes"
    ADD CONSTRAINT "fertilization_recipes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."financial_accounts"
    ADD CONSTRAINT "financial_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_installments"
    ADD CONSTRAINT "financial_installments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoramento_entidade_audit"
    ADD CONSTRAINT "monitoramento_entidade_audit_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145"
    ADD CONSTRAINT "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_entidade"
    ADD CONSTRAINT "monitoramento_entidade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_entidade_usuario_id_backup"
    ADD CONSTRAINT "monitoramento_entidade_usuario_id_backup_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak"
    ADD CONSTRAINT "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_entidade"
    ADD CONSTRAINT "monitoramento_entidade_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_media"
    ADD CONSTRAINT "monitoramento_media_monitoramento_uuid_fkey" FOREIGN KEY ("monitoramento_uuid") REFERENCES "public"."monitoramento_entidade"("id");



ALTER TABLE ONLY "public"."monitoramento_media"
    ADD CONSTRAINT "monitoramento_media_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentacoes_financeiras"
    ADD CONSTRAINT "movimentacoes_financeiras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."movimentacoes_financeiras"
    ADD CONSTRAINT "movimentacoes_financeiras_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receitas"
    ADD CONSTRAINT "receitas_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."unidades_medida"
    ADD CONSTRAINT "unidades_medida_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."usuario_id_quarantine"
    ADD CONSTRAINT "usuario_id_quarantine_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v2_analise_solo"
    ADD CONSTRAINT "v2_analise_solo_talhao_id_fkey" FOREIGN KEY ("talhao_id") REFERENCES "public"."v2_talhoes"("id");



ALTER TABLE ONLY "public"."v2_analise_solo"
    ADD CONSTRAINT "v2_analise_solo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."v2_produtores"("id");



ALTER TABLE ONLY "public"."v2_estoque_atual"
    ADD CONSTRAINT "v2_estoque_atual_produto_uuid_fkey" FOREIGN KEY ("produto_uuid") REFERENCES "public"."cadastro"("uuid");



ALTER TABLE ONLY "public"."v2_estoque_atual"
    ADD CONSTRAINT "v2_estoque_atual_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."v2_estoque_movimentacoes"
    ADD CONSTRAINT "v2_estoque_movimentacoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."v2_fazendas"
    ADD CONSTRAINT "v2_fazendas_produtor_id_fkey" FOREIGN KEY ("produtor_id") REFERENCES "public"."v2_produtores"("id");



ALTER TABLE ONLY "public"."v2_fazendas"
    ADD CONSTRAINT "v2_fazendas_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v2_plantios"
    ADD CONSTRAINT "v2_plantios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."v2_produtores"("id");



ALTER TABLE ONLY "public"."v2_produtores"
    ADD CONSTRAINT "v2_produtores_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."v2_recomendacoes_tecnicas"
    ADD CONSTRAINT "v2_recomendacoes_tecnicas_talhao_id_fkey" FOREIGN KEY ("talhao_id") REFERENCES "public"."v2_talhoes"("id");



ALTER TABLE ONLY "public"."v2_recomendacoes_tecnicas"
    ADD CONSTRAINT "v2_recomendacoes_tecnicas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."v2_produtores"("id");



ALTER TABLE ONLY "public"."v2_talhoes"
    ADD CONSTRAINT "v2_talhoes_fazenda_id_fkey" FOREIGN KEY ("fazenda_id") REFERENCES "public"."v2_fazendas"("id");



ALTER TABLE ONLY "public"."v2_talhoes"
    ADD CONSTRAINT "v2_talhoes_usuario_id_fkey" FOREIGN KEY ("usuario_id_bak_20260315145412") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



CREATE POLICY "Atualização para autenticados" ON "public"."activity_log" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."analise_ia" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."cost_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."costs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."monitoramento_media" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."movimentacoes_financeiras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."movimentos_estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."receitas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."unidades_medida" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."cost_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."costs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."monitoramento_media" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."movimentacoes_financeiras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."movimentos_estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."receitas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."unidades_medida" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."analise_ia" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."cost_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."costs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."monitoramento_media" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."movimentacoes_financeiras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."movimentos_estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."receitas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."unidades_medida" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Manage own app_settings" ON "public"."app_settings" USING (false);



CREATE POLICY "Manage own descarte" ON "public"."descarte" USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own fertilization_applications" ON "public"."fertilization_applications" USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own fertilization_recipes" ON "public"."fertilization_recipes" USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own orders" ON "public"."orders" USING (("auth"."uid"() = "usuario_id")) WITH CHECK (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own production_fertilization_items" ON "public"."production_fertilization_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own v2_custos" ON "public"."v2_custos" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own v2_estoque_atual" ON "public"."v2_estoque_atual" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own v2_estoque_movimentacoes" ON "public"."v2_estoque_movimentacoes" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Manage own v2_vendas" ON "public"."v2_vendas" USING (("auth"."uid"() = "usuario_id"));



CREATE POLICY "Owner Access" ON "public"."analise_ia" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."cost_categories" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."costs" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."descarte" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."error_logs" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."fertilization_applications" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."fertilization_recipes" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."monitoramento_entidade" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."monitoramento_media" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."orders" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."v2_analise_solo" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."v2_fazendas" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."v2_produtores" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."v2_sync_conflicts" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Owner Access" ON "public"."v2_talhoes" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "Public access for authenticated users" ON "public"."fertilization_items" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Usuários acessam apenas seus próprios dados financeiros" ON "public"."financial_accounts" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Usuários acessam parcelas de suas próprias contas" ON "public"."financial_installments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."financial_accounts"
  WHERE (("financial_accounts"."id" = "financial_installments"."account_id") AND ("financial_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."financial_accounts"
  WHERE (("financial_accounts"."id" = "financial_installments"."account_id") AND ("financial_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analise_ia" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analise_ia_admin_read" ON "public"."analise_ia" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete" ON "public"."monitoramento_entidade_audit" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_insert" ON "public"."monitoramento_entidade_audit" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_select" ON "public"."monitoramento_entidade_audit" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."categorias_despesa" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."cost_categories" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."descarte" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."unidades_medida" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update" ON "public"."monitoramento_entidade_audit" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."cadastro" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorias_despesa" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categorias_despesa_admin_read" ON "public"."categorias_despesa" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "categorias_despesa_owner_full_access" ON "public"."categorias_despesa" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."cost_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cost_categories_admin_read" ON "public"."cost_categories" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "cost_categories_owner_full_access" ON "public"."cost_categories" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."costs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "costs_admin_read" ON "public"."costs" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "costs_owner_full_access" ON "public"."costs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."descarte" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "descarte_admin_read" ON "public"."descarte" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "descarte_owner_full_access" ON "public"."descarte" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "error_logs_admin_read" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "error_logs_owner_full_access" ON "public"."error_logs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."fertilization_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fertilization_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fertilization_recipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."financial_installments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoramento_entidade" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_admin_read" ON "public"."monitoramento_entidade" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."monitoramento_entidade_audit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_audit_admin_read" ON "public"."monitoramento_entidade_audit" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "monitoramento_entidade_audit_owner_full_access" ON "public"."monitoramento_entidade_audit" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" ON "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id"));



CREATE POLICY "monitoramento_entidade_delete" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_insert" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_owner_full_access" ON "public"."monitoramento_entidade" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



CREATE POLICY "monitoramento_entidade_select" ON "public"."monitoramento_entidade" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_update" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_usuario_id_backup_admin_read" ON "public"."monitoramento_entidade_usuario_id_backup" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "monitoramento_entidade_usuario_id_backup_owner_full_access" ON "public"."monitoramento_entidade_usuario_id_backup" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id"));



ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" ON "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id"));



ALTER TABLE "public"."monitoramento_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_media_admin_read" ON "public"."monitoramento_media" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "monitoramento_media_owner_full_access" ON "public"."monitoramento_media" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."movimentacoes_financeiras" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimentacoes_financeiras_admin_read" ON "public"."movimentacoes_financeiras" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "movimentacoes_financeiras_owner_full_access" ON "public"."movimentacoes_financeiras" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."movimentos_estoque" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "movimentos_estoque_admin_read" ON "public"."movimentos_estoque" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "movimentos_estoque_owner_full_access" ON "public"."movimentos_estoque" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_delete" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."monitoramento_entidade_usuario_id_backup" FOR DELETE TO "authenticated" USING (("usuario_id_bak_20260315145412" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_delete" ON "public"."monitoramento_media" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."movimentacoes_financeiras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."movimentos_estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."receitas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."users" FOR DELETE TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_full_access" ON "public"."activity_log" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."analise_ia" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."costs" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."error_logs" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade_audit" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade_usuario_id_backup" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_media" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."movimentacoes_financeiras" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."movimentos_estoque" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."profiles" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."receitas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."users" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."usuario_id_quarantine" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."v2_analise_solo" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."v2_fazendas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."v2_plantios" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."v2_produtores" TO "authenticated" USING (("usuario_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("usuario_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "owner_full_access" ON "public"."v2_recomendacoes_tecnicas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."v2_talhoes" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_insert" ON "public"."analise_ia" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."monitoramento_entidade_usuario_id_backup" FOR INSERT TO "authenticated" WITH CHECK (("usuario_id_bak_20260315145412" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_insert" ON "public"."monitoramento_media" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."movimentacoes_financeiras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."movimentos_estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."receitas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_produtor_access" ON "public"."v2_produtores" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "owner_select" ON "public"."analise_ia" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."monitoramento_entidade" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."monitoramento_entidade_usuario_id_backup" FOR SELECT TO "authenticated" USING (("usuario_id_bak_20260315145412" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_select" ON "public"."monitoramento_media" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."movimentacoes_financeiras" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."movimentos_estoque" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."receitas" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."users" FOR SELECT TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_update" ON "public"."activity_log" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."analise_ia" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."monitoramento_entidade_usuario_id_backup" FOR UPDATE TO "authenticated" USING (("usuario_id_bak_20260315145412" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK (("usuario_id_bak_20260315145412" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_update" ON "public"."monitoramento_media" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."movimentacoes_financeiras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."movimentos_estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."receitas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



ALTER TABLE "public"."production_fertilization_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_read" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "profiles_owner_full_access" ON "public"."profiles" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



CREATE POLICY "public_delete" ON "public"."cost_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."costs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."unidades_medida" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."cost_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."costs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."unidades_medida" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."cost_categories" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."costs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."unidades_medida" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."categorias_despesa" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."cost_categories" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."costs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."descarte" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."unidades_medida" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."cost_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."costs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."unidades_medida" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."receitas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "receitas_admin_read" ON "public"."receitas" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "receitas_owner_full_access" ON "public"."receitas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."schema_migrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "schema_migrations_admin_read" ON "public"."schema_migrations" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



ALTER TABLE "public"."unidades_medida" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "unidades_medida_admin_read" ON "public"."unidades_medida" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "unidades_medida_owner_full_access" ON "public"."unidades_medida" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_admin_read" ON "public"."users" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "users_owner_full_access" ON "public"."users" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."usuario_id_quarantine" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_analise_solo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_custos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_estoque_atual" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_estoque_movimentacoes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_fazendas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "v2_fazendas_admin_read" ON "public"."v2_fazendas" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "v2_fazendas_owner_full_access" ON "public"."v2_fazendas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."v2_plantios" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_produtores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "v2_produtores_admin_read" ON "public"."v2_produtores" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "v2_produtores_owner" ON "public"."v2_produtores" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "v2_produtores_owner_full_access" ON "public"."v2_produtores" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."v2_recomendacoes_tecnicas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_sync_conflicts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."v2_talhoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "v2_talhoes_admin_read" ON "public"."v2_talhoes" FOR SELECT TO "authenticated" USING ((("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"));



CREATE POLICY "v2_talhoes_owner_full_access" ON "public"."v2_talhoes" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "usuario_id_bak_20260315145412"));



ALTER TABLE "public"."v2_vendas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fertilization_applications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fertilization_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."fertilization_recipes";



GRANT USAGE ON SCHEMA "agro_admin" TO "service_role";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."apply_fertilization_v2"("p_plano_uuid" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."apply_fertilization_v2"("p_plano_uuid" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_fertilization_v2"("p_plano_uuid" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_pkey_cols"("p_table" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_pkey_cols"("p_table" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_pkey_cols"("p_table" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_sale_v2"("p_usuario_id" "uuid", "p_produto_uuid" "uuid", "p_quantidade" real, "p_valor" real) TO "anon";
GRANT ALL ON FUNCTION "public"."process_sale_v2"("p_usuario_id" "uuid", "p_produto_uuid" "uuid", "p_quantidade" real, "p_valor" real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_sale_v2"("p_usuario_id" "uuid", "p_produto_uuid" "uuid", "p_quantidade" real, "p_valor" real) TO "service_role";



GRANT ALL ON FUNCTION "public"."try_text_to_uuid"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_last_updated_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_last_updated_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_last_updated_column"() TO "service_role";












GRANT ALL ON TABLE "public"."v2_fazendas" TO "anon";
GRANT ALL ON TABLE "public"."v2_fazendas" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_fazendas" TO "service_role";



GRANT ALL ON TABLE "public"."v2_talhoes" TO "anon";
GRANT ALL ON TABLE "public"."v2_talhoes" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_talhoes" TO "service_role";



GRANT SELECT ON TABLE "agro_admin"."admin_usuario_integrity_report" TO "service_role";















GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."analise_ia" TO "anon";
GRANT ALL ON TABLE "public"."analise_ia" TO "authenticated";
GRANT ALL ON TABLE "public"."analise_ia" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."cadastro" TO "anon";
GRANT ALL ON TABLE "public"."cadastro" TO "authenticated";
GRANT ALL ON TABLE "public"."cadastro" TO "service_role";



GRANT ALL ON TABLE "public"."categorias_despesa" TO "anon";
GRANT ALL ON TABLE "public"."categorias_despesa" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias_despesa" TO "service_role";



GRANT ALL ON TABLE "public"."cost_categories" TO "anon";
GRANT ALL ON TABLE "public"."cost_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_categories" TO "service_role";



GRANT ALL ON TABLE "public"."costs" TO "anon";
GRANT ALL ON TABLE "public"."costs" TO "authenticated";
GRANT ALL ON TABLE "public"."costs" TO "service_role";



GRANT ALL ON TABLE "public"."descarte" TO "anon";
GRANT ALL ON TABLE "public"."descarte" TO "authenticated";
GRANT ALL ON TABLE "public"."descarte" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."fertilization_applications" TO "anon";
GRANT ALL ON TABLE "public"."fertilization_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."fertilization_applications" TO "service_role";



GRANT ALL ON TABLE "public"."fertilization_items" TO "anon";
GRANT ALL ON TABLE "public"."fertilization_items" TO "authenticated";
GRANT ALL ON TABLE "public"."fertilization_items" TO "service_role";



GRANT ALL ON TABLE "public"."fertilization_recipes" TO "anon";
GRANT ALL ON TABLE "public"."fertilization_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."fertilization_recipes" TO "service_role";



GRANT ALL ON TABLE "public"."financial_accounts" TO "anon";
GRANT ALL ON TABLE "public"."financial_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."financial_installments" TO "anon";
GRANT ALL ON TABLE "public"."financial_installments" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_installments" TO "service_role";



GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "anon";
GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "authenticated";
GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "service_role";



GRANT ALL ON TABLE "public"."financial_summary" TO "anon";
GRANT ALL ON TABLE "public"."financial_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_summary" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_media" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_media" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_media" TO "service_role";



GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."movimentos_estoque" TO "anon";
GRANT ALL ON TABLE "public"."movimentos_estoque" TO "authenticated";
GRANT ALL ON TABLE "public"."movimentos_estoque" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."production_fertilization_items" TO "anon";
GRANT ALL ON TABLE "public"."production_fertilization_items" TO "authenticated";
GRANT ALL ON TABLE "public"."production_fertilization_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."receitas" TO "anon";
GRANT ALL ON TABLE "public"."receitas" TO "authenticated";
GRANT ALL ON TABLE "public"."receitas" TO "service_role";



GRANT ALL ON TABLE "public"."schema_migrations" TO "anon";
GRANT ALL ON TABLE "public"."schema_migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."schema_migrations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schema_migrations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schema_migrations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schema_migrations_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."unidades_medida" TO "anon";
GRANT ALL ON TABLE "public"."unidades_medida" TO "authenticated";
GRANT ALL ON TABLE "public"."unidades_medida" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."usuario_id_quarantine" TO "anon";
GRANT ALL ON TABLE "public"."usuario_id_quarantine" TO "authenticated";
GRANT ALL ON TABLE "public"."usuario_id_quarantine" TO "service_role";



GRANT ALL ON SEQUENCE "public"."usuario_id_quarantine_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."usuario_id_quarantine_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."usuario_id_quarantine_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."v2_analise_solo" TO "anon";
GRANT ALL ON TABLE "public"."v2_analise_solo" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_analise_solo" TO "service_role";



GRANT ALL ON TABLE "public"."v2_custos" TO "anon";
GRANT ALL ON TABLE "public"."v2_custos" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_custos" TO "service_role";



GRANT ALL ON TABLE "public"."v2_estoque_atual" TO "anon";
GRANT ALL ON TABLE "public"."v2_estoque_atual" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_estoque_atual" TO "service_role";



GRANT ALL ON TABLE "public"."v2_estoque_movimentacoes" TO "anon";
GRANT ALL ON TABLE "public"."v2_estoque_movimentacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_estoque_movimentacoes" TO "service_role";



GRANT ALL ON TABLE "public"."v2_plantios" TO "anon";
GRANT ALL ON TABLE "public"."v2_plantios" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_plantios" TO "service_role";



GRANT ALL ON TABLE "public"."v2_produtores" TO "anon";
GRANT ALL ON TABLE "public"."v2_produtores" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_produtores" TO "service_role";



GRANT ALL ON TABLE "public"."v2_recomendacoes_tecnicas" TO "anon";
GRANT ALL ON TABLE "public"."v2_recomendacoes_tecnicas" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_recomendacoes_tecnicas" TO "service_role";



GRANT ALL ON TABLE "public"."v2_sync_conflicts" TO "anon";
GRANT ALL ON TABLE "public"."v2_sync_conflicts" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_sync_conflicts" TO "service_role";



GRANT ALL ON TABLE "public"."v2_vendas" TO "anon";
GRANT ALL ON TABLE "public"."v2_vendas" TO "authenticated";
GRANT ALL ON TABLE "public"."v2_vendas" TO "service_role";



GRANT ALL ON TABLE "public"."view_financeiro_resumo" TO "anon";
GRANT ALL ON TABLE "public"."view_financeiro_resumo" TO "authenticated";
GRANT ALL ON TABLE "public"."view_financeiro_resumo" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































