


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."fill_text_uuid"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.uuid IS NULL OR NEW.uuid = '' THEN
      NEW.uuid := (public.uuid_generate_v4())::text;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fill_text_uuid"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
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


CREATE OR REPLACE FUNCTION "public"."try_text_to_uuid"("text") RETURNS "uuid"
    LANGUAGE "plpgsql" IMMUTABLE
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  v uuid;
BEGIN
  BEGIN
    v := $1::uuid;
    RETURN v;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$_$;


ALTER FUNCTION "public"."try_text_to_uuid"("text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."areas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text",
    "descricao" "text",
    "metragem" numeric,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."areas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."caderno_notas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "observacao" "text",
    "data" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."caderno_notas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categorias_despesa" (
    "id" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "uuid" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."categorias_despesa" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clientes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text",
    "telefone" "text",
    "cidade" "text",
    "estado" "text",
    "observacoes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."clientes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."colheitas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "area_id" "uuid",
    "produto" "text",
    "quantidade" numeric,
    "tipo" "text",
    "data_colheita" "date",
    "usuario_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."colheitas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."compras" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "item" "text",
    "quantidade" numeric,
    "valor" numeric,
    "cultura" "text",
    "data" "text",
    "observacao" "text",
    "detalhes" "text",
    "anexo" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."compras" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cost_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "text" DEFAULT ("extensions"."uuid_generate_v4"())::"text",
    "name" "text",
    "type" "text",
    "is_default" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
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
    "usuario_id" "uuid"
);


ALTER TABLE "public"."costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."culturas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "nome" "text" NOT NULL,
    "observacao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."culturas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "produto" "text",
    "tipo" "text",
    "quantidade" numeric,
    "valor_total" numeric,
    "data" "text",
    "observacao" "text",
    "anexo" "text",
    "categoria_id" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."custos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."descarte" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "produto" "text",
    "quantidade_kg" numeric,
    "motivo" "text",
    "data" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
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
    "usuario_id" "uuid"
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estoque" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "item_id" "uuid",
    "quantidade" numeric,
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."estoque" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "codigo" "text",
    "nome" "text",
    "categoria" "text",
    "unidade" "text",
    "tipo" "text",
    "descricao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "text" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0,
    "unidade_id" integer,
    CONSTRAINT "items_uuid_check" CHECK (("uuid" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manutencao_frota" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "text",
    "maquina_uuid" "uuid",
    "data" "text",
    "descricao" "text",
    "valor" numeric,
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."manutencao_frota" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maquinas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "nome" "text",
    "tipo" "text",
    "placa" "text",
    "horimetro_atual" numeric DEFAULT 0,
    "intervalo_revisao" numeric DEFAULT 10000,
    "status" "text" DEFAULT 'OK'::"text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
);


ALTER TABLE "public"."maquinas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "usuario_id_to_drop" "text",
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
    "usuario_id" "uuid"
);


ALTER TABLE "public"."monitoramento_entidade" OWNER TO "postgres";


COMMENT ON COLUMN "public"."monitoramento_entidade"."usuario_id_to_drop" IS 'Marked for removal; original column usuario_id. Backup at public.monitoramento_entidade_usuario_id_backup.';



CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "target_table" "text" NOT NULL,
    "total_flagged" bigint,
    "sample" "jsonb",
    "dependencies" "jsonb",
    "report_path" "text"
);


ALTER TABLE "public"."monitoramento_entidade_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_entidade_usuario_id_backup" (
    "monitoramento_entidade_id" "uuid",
    "usuario_id" "text",
    "user_id" "uuid",
    "backed_up_at" timestamp with time zone
);


ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoramento_media" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "monitoramento_uuid" "uuid",
    "tipo" "text",
    "caminho_arquivo" "text",
    "criado_em" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
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
    "usuario_id" "uuid"
);


ALTER TABLE "public"."movimentos_estoque" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planos_adubacao" (
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome_plano" "text",
    "cultura" "text",
    "tipo_aplicacao" "text",
    "area_local" "text",
    "descricao_tecnica" "text",
    "status" "text",
    "data_criacao" timestamp without time zone DEFAULT "now"(),
    "data_aplicacao" timestamp without time zone,
    "anexos_uri" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "id" "uuid"
);


ALTER TABLE "public"."planos_adubacao" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plantio" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "cultura" "text",
    "quantidade_pes" integer,
    "tipo_plantio" "text",
    "data" "text",
    "observacao" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."plantio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nome" "text",
    "email" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0,
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
    "usuario_id" "uuid"
);


ALTER TABLE "public"."receitas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unidades_medida" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "nome" "text",
    "sigla" "text",
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "is_deleted" integer DEFAULT 0
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
    CONSTRAINT "users_uuid_check" CHECK (("uuid" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'::"text"))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendas" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "cliente_id" "uuid",
    "produto_id" "uuid",
    "quantidade" numeric,
    "valor" numeric,
    "status_pagamento" "text",
    "data_venda" "date",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "last_updated" timestamp without time zone DEFAULT "now"(),
    "uuid" "uuid" DEFAULT "extensions"."uuid_generate_v4"(),
    "is_deleted" integer DEFAULT 0,
    "usuario_id" "uuid"
);


ALTER TABLE "public"."vendas" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."areas"
    ADD CONSTRAINT "areas_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."caderno_notas"
    ADD CONSTRAINT "caderno_notas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caderno_notas"
    ADD CONSTRAINT "caderno_notas_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."categorias_despesa"
    ADD CONSTRAINT "categorias_despesa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clientes"
    ADD CONSTRAINT "clientes_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."colheitas"
    ADD CONSTRAINT "colheitas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."colheitas"
    ADD CONSTRAINT "colheitas_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compras"
    ADD CONSTRAINT "compras_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."cost_categories"
    ADD CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cost_categories"
    ADD CONSTRAINT "cost_categories_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."costs"
    ADD CONSTRAINT "costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."costs"
    ADD CONSTRAINT "costs_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."culturas"
    ADD CONSTRAINT "culturas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."culturas"
    ADD CONSTRAINT "culturas_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."custos"
    ADD CONSTRAINT "custos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custos"
    ADD CONSTRAINT "custos_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."descarte"
    ADD CONSTRAINT "descarte_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."descarte"
    ADD CONSTRAINT "descarte_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_logs"
    ADD CONSTRAINT "error_logs_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."estoque"
    ADD CONSTRAINT "estoque_item_id_key" UNIQUE ("item_id");



ALTER TABLE ONLY "public"."estoque"
    ADD CONSTRAINT "estoque_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estoque"
    ADD CONSTRAINT "estoque_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_codigo_key" UNIQUE ("codigo");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_uuid_unique" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."manutencao_frota"
    ADD CONSTRAINT "manutencao_frota_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manutencao_frota"
    ADD CONSTRAINT "manutencao_frota_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."maquinas"
    ADD CONSTRAINT "maquinas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maquinas"
    ADD CONSTRAINT "maquinas_uuid_key" UNIQUE ("uuid");



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



ALTER TABLE ONLY "public"."planos_adubacao"
    ADD CONSTRAINT "planos_adubacao_pkey" PRIMARY KEY ("uuid");



ALTER TABLE ONLY "public"."plantio"
    ADD CONSTRAINT "plantio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plantio"
    ADD CONSTRAINT "plantio_uuid_key" UNIQUE ("uuid");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receitas"
    ADD CONSTRAINT "receitas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receitas"
    ADD CONSTRAINT "receitas_uuid_key" UNIQUE ("uuid");



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



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_uuid_unique" UNIQUE ("uuid");



CREATE INDEX "idx_areas_updated" ON "public"."areas" USING "btree" ("last_updated");



CREATE INDEX "idx_areas_uuid" ON "public"."areas" USING "btree" ("uuid");



CREATE INDEX "idx_backup_monitoramento_entidade_id" ON "public"."monitoramento_entidade_usuario_id_backup" USING "btree" ("monitoramento_entidade_id");



CREATE INDEX "idx_clientes_uuid" ON "public"."clientes" USING "btree" ("uuid");



CREATE INDEX "idx_colheitas_area_id" ON "public"."colheitas" USING "btree" ("area_id");



CREATE INDEX "idx_colheitas_usuario_id" ON "public"."colheitas" USING "btree" ("usuario_id");



CREATE INDEX "idx_colheitas_uuid" ON "public"."colheitas" USING "btree" ("uuid");



CREATE INDEX "idx_culturas_uuid" ON "public"."culturas" USING "btree" ("uuid");



CREATE INDEX "idx_estoque_updated" ON "public"."estoque" USING "btree" ("last_updated");



CREATE INDEX "idx_items_last_updated" ON "public"."items" USING "btree" ("last_updated");



CREATE INDEX "idx_items_updated" ON "public"."items" USING "btree" ("last_updated");



CREATE INDEX "idx_items_uuid" ON "public"."items" USING "btree" ("uuid");



CREATE INDEX "idx_monitoramento_entidade_user_id" ON "public"."monitoramento_entidade" USING "btree" ("user_id");



CREATE INDEX "idx_movimentestoque_item_id" ON "public"."movimentos_estoque" USING "btree" ("item_id");



CREATE INDEX "idx_planos_adubacao_status" ON "public"."planos_adubacao" USING "btree" ("status");



CREATE INDEX "idx_sync_updated" ON "public"."items" USING "btree" ("last_updated");



CREATE INDEX "idx_sync_updated_items" ON "public"."items" USING "btree" ("last_updated");



CREATE INDEX "idx_users_updated" ON "public"."users" USING "btree" ("last_updated");



CREATE INDEX "idx_vendas_cliente_id" ON "public"."vendas" USING "btree" ("cliente_id");



CREATE INDEX "idx_vendas_produto_id" ON "public"."vendas" USING "btree" ("produto_id");



CREATE INDEX "idx_vendas_updated" ON "public"."vendas" USING "btree" ("last_updated");



CREATE INDEX "idx_vendas_usuario_id" ON "public"."vendas" USING "btree" ("usuario_id");



CREATE INDEX "idx_vendas_uuid" ON "public"."vendas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_activity_log_uuid" ON "public"."activity_log" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_analise_ia_uuid" ON "public"."analise_ia" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_areas_uuid" ON "public"."areas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_caderno_notas_uuid" ON "public"."caderno_notas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_clientes_uuid" ON "public"."clientes" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_colheitas_uuid" ON "public"."colheitas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_compras_uuid" ON "public"."compras" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_costs_uuid" ON "public"."costs" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_culturas_uuid" ON "public"."culturas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_custos_uuid" ON "public"."custos" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_descarte_uuid" ON "public"."descarte" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_error_logs_uuid" ON "public"."error_logs" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_estoque_item_id" ON "public"."estoque" USING "btree" ("item_id");



CREATE UNIQUE INDEX "uq_estoque_uuid" ON "public"."estoque" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_items_uuid" ON "public"."items" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_maquinas_uuid" ON "public"."maquinas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_monitoramento_entidade_uuid" ON "public"."monitoramento_entidade" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_monitoramento_media_uuid" ON "public"."monitoramento_media" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_movimentacoes_financeiras_uuid" ON "public"."movimentacoes_financeiras" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_planos_adubacao_uuid" ON "public"."planos_adubacao" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_plantio_uuid" ON "public"."plantio" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_profiles_uuid" ON "public"."profiles" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_receitas_uuid" ON "public"."receitas" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_unidades_medida_uuid" ON "public"."unidades_medida" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_users_uuid" ON "public"."users" USING "btree" ("uuid");



CREATE UNIQUE INDEX "uq_vendas_uuid" ON "public"."vendas" USING "btree" ("uuid");



CREATE OR REPLACE TRIGGER "activity_log_set_uuid" BEFORE INSERT ON "public"."activity_log" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "analise_ia_set_uuid" BEFORE INSERT ON "public"."analise_ia" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "app_settings_set_uuid" BEFORE INSERT ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "areas_set_uuid" BEFORE INSERT ON "public"."areas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "caderno_notas_set_uuid" BEFORE INSERT ON "public"."caderno_notas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "clientes_set_uuid" BEFORE INSERT ON "public"."clientes" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "colheitas_set_uuid" BEFORE INSERT ON "public"."colheitas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "compras_set_uuid" BEFORE INSERT ON "public"."compras" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "cost_categories_set_uuid" BEFORE INSERT ON "public"."cost_categories" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "costs_set_uuid" BEFORE INSERT ON "public"."costs" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "custos_set_uuid" BEFORE INSERT ON "public"."custos" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "error_logs_set_uuid" BEFORE INSERT ON "public"."error_logs" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "estoque_set_uuid" BEFORE INSERT ON "public"."estoque" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "items_set_uuid" BEFORE INSERT ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "maquinas_set_uuid" BEFORE INSERT ON "public"."maquinas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "monitoramento_entidade_set_uuid" BEFORE INSERT ON "public"."monitoramento_entidade" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "monitoramento_media_set_uuid" BEFORE INSERT ON "public"."monitoramento_media" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "movimentos_estoque_set_uuid" BEFORE INSERT ON "public"."movimentos_estoque" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "plantio_set_uuid" BEFORE INSERT ON "public"."plantio" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "receitas_set_uuid" BEFORE INSERT ON "public"."receitas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "unidades_medida_set_uuid" BEFORE INSERT ON "public"."unidades_medida" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "users_set_uuid" BEFORE INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



CREATE OR REPLACE TRIGGER "vendas_set_uuid" BEFORE INSERT ON "public"."vendas" FOR EACH ROW EXECUTE FUNCTION "public"."fill_text_uuid"();



ALTER TABLE ONLY "public"."analise_ia"
    ADD CONSTRAINT "analise_ia_monitoramento_uuid_fkey" FOREIGN KEY ("monitoramento_uuid") REFERENCES "public"."monitoramento_entidade"("id");



ALTER TABLE ONLY "public"."colheitas"
    ADD CONSTRAINT "colheitas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id");



ALTER TABLE ONLY "public"."colheitas"
    ADD CONSTRAINT "colheitas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."estoque"
    ADD CONSTRAINT "estoque_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."manutencao_frota"
    ADD CONSTRAINT "manutencao_frota_maquina_uuid_fkey" FOREIGN KEY ("maquina_uuid") REFERENCES "public"."maquinas"("id");



ALTER TABLE ONLY "public"."monitoramento_entidade"
    ADD CONSTRAINT "monitoramento_entidade_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."monitoramento_media"
    ADD CONSTRAINT "monitoramento_media_monitoramento_uuid_fkey" FOREIGN KEY ("monitoramento_uuid") REFERENCES "public"."monitoramento_entidade"("id");



ALTER TABLE ONLY "public"."movimentacoes_financeiras"
    ADD CONSTRAINT "movimentacoes_financeiras_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."movimentos_estoque"
    ADD CONSTRAINT "movimentos_estoque_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "public"."items"("id");



ALTER TABLE ONLY "public"."vendas"
    ADD CONSTRAINT "vendas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id");



CREATE POLICY "Atualização para autenticados" ON "public"."activity_log" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."analise_ia" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."app_settings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."areas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."caderno_notas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."clientes" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."colheitas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."compras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."cost_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."costs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."custos" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."items" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."maquinas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."monitoramento_media" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."movimentacoes_financeiras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."movimentos_estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."planos_adubacao" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."plantio" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."receitas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."unidades_medida" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Atualização para autenticados" ON "public"."vendas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."activity_log" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."analise_ia" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."app_settings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."areas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."caderno_notas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."clientes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."colheitas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."compras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."cost_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."costs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."custos" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."items" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."maquinas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."monitoramento_media" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."movimentacoes_financeiras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."movimentos_estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."planos_adubacao" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."plantio" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."receitas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."unidades_medida" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Exclusão para autenticados" ON "public"."vendas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."activity_log" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."analise_ia" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."app_settings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."areas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."caderno_notas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."clientes" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."colheitas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."compras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."cost_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."costs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."custos" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."maquinas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."monitoramento_media" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."movimentacoes_financeiras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."movimentos_estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."planos_adubacao" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."plantio" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."receitas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."unidades_medida" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Inserção para autenticados" ON "public"."vendas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analise_ia" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."areas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete" ON "public"."monitoramento_entidade_audit" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_insert" ON "public"."monitoramento_entidade_audit" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_select" ON "public"."monitoramento_entidade_audit" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."app_settings" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."areas" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."categorias_despesa" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."clientes" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."cost_categories" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."culturas" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."descarte" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."estoque" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."items" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."manutencao_frota" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."maquinas" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."planos_adubacao" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_shared_access" ON "public"."unidades_medida" TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update" ON "public"."monitoramento_entidade_audit" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."caderno_notas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categorias_despesa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clientes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."colheitas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cost_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."culturas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."descarte" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."estoque" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manutencao_frota" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."maquinas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoramento_entidade" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoramento_entidade_audit" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "monitoramento_entidade_delete" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_insert" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_select" ON "public"."monitoramento_entidade" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "monitoramento_entidade_update" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



ALTER TABLE "public"."monitoramento_entidade_usuario_id_backup" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoramento_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movimentacoes_financeiras" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."movimentos_estoque" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_access_colheitas" ON "public"."colheitas" TO "authenticated" USING (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"))) WITH CHECK (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "owner_access_vendas" ON "public"."vendas" TO "authenticated" USING (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"))) WITH CHECK (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "owner_delete" ON "public"."activity_log" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."analise_ia" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."colheitas" FOR DELETE TO "authenticated" USING ((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_delete" ON "public"."error_logs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."monitoramento_entidade" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."monitoramento_entidade_usuario_id_backup" FOR DELETE TO "authenticated" USING (("usuario_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_delete" ON "public"."monitoramento_media" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."movimentacoes_financeiras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."movimentos_estoque" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."receitas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_delete" ON "public"."users" FOR DELETE TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_delete" ON "public"."vendas" FOR DELETE TO "authenticated" USING (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "owner_full_access" ON "public"."activity_log" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."analise_ia" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."caderno_notas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."colheitas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."compras" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."costs" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."custos" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."error_logs" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_entidade" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."monitoramento_media" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."movimentacoes_financeiras" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."movimentos_estoque" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."plantio" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."profiles" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."receitas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."users" TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "owner_full_access" ON "public"."vendas" TO "authenticated" USING (("usuario_id" = "auth"."uid"())) WITH CHECK (("usuario_id" = "auth"."uid"()));



CREATE POLICY "owner_insert" ON "public"."activity_log" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."analise_ia" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."colheitas" FOR INSERT TO "authenticated" WITH CHECK ((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_insert" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."monitoramento_entidade" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."monitoramento_entidade_usuario_id_backup" FOR INSERT TO "authenticated" WITH CHECK (("usuario_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_insert" ON "public"."monitoramento_media" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."movimentacoes_financeiras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."movimentos_estoque" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."receitas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_insert" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_insert" ON "public"."vendas" FOR INSERT TO "authenticated" WITH CHECK (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "owner_select" ON "public"."activity_log" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."analise_ia" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."colheitas" FOR SELECT TO "authenticated" USING ((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_select" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."estoque" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."monitoramento_entidade" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."monitoramento_entidade_usuario_id_backup" FOR SELECT TO "authenticated" USING (("usuario_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_select" ON "public"."monitoramento_media" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."movimentacoes_financeiras" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."movimentos_estoque" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."receitas" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_select" ON "public"."users" FOR SELECT TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_select" ON "public"."vendas" FOR SELECT TO "authenticated" USING (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



CREATE POLICY "owner_update" ON "public"."activity_log" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."analise_ia" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."colheitas" FOR UPDATE TO "authenticated" USING ((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK ((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_update" ON "public"."error_logs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."monitoramento_entidade" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."monitoramento_entidade_usuario_id_backup" FOR UPDATE TO "authenticated" USING (("usuario_id" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK (("usuario_id" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_update" ON "public"."monitoramento_media" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."movimentacoes_financeiras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."movimentos_estoque" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."receitas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "owner_update" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text")) WITH CHECK ((("id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text"));



CREATE POLICY "owner_update" ON "public"."vendas" FOR UPDATE TO "authenticated" USING (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"))) WITH CHECK (((("usuario_id")::"text" = (( SELECT "auth"."uid"() AS "uid"))::"text") OR (("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")));



ALTER TABLE "public"."planos_adubacao" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plantio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_delete" ON "public"."app_settings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."areas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."clientes" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."compras" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."cost_categories" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."costs" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."custos" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."items" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."maquinas" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."planos_adubacao" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."plantio" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_delete" ON "public"."unidades_medida" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."app_settings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."areas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."clientes" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."compras" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."cost_categories" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."costs" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."custos" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."maquinas" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."planos_adubacao" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."plantio" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_insert" ON "public"."unidades_medida" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."app_settings" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."areas" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."clientes" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."compras" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."cost_categories" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."costs" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."custos" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."items" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."maquinas" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."planos_adubacao" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."plantio" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_select" ON "public"."unidades_medida" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."app_settings" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."areas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."categorias_despesa" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."clientes" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."cost_categories" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."costs" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."descarte" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."items" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."manutencao_frota" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."maquinas" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."planos_adubacao" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_standard_access" ON "public"."unidades_medida" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."app_settings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."areas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."clientes" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."compras" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."cost_categories" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."costs" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."custos" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."items" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."maquinas" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."planos_adubacao" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."plantio" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "public_update" ON "public"."unidades_medida" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."receitas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unidades_medida" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendas" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."fill_text_uuid"() TO "anon";
GRANT ALL ON FUNCTION "public"."fill_text_uuid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fill_text_uuid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_financial_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "anon";
GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."monitoramento_entidade_run_checks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."try_text_to_uuid"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."try_text_to_uuid"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."try_text_to_uuid"("text") TO "service_role";
























GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."analise_ia" TO "anon";
GRANT ALL ON TABLE "public"."analise_ia" TO "authenticated";
GRANT ALL ON TABLE "public"."analise_ia" TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."areas" TO "anon";
GRANT ALL ON TABLE "public"."areas" TO "authenticated";
GRANT ALL ON TABLE "public"."areas" TO "service_role";



GRANT ALL ON TABLE "public"."caderno_notas" TO "anon";
GRANT ALL ON TABLE "public"."caderno_notas" TO "authenticated";
GRANT ALL ON TABLE "public"."caderno_notas" TO "service_role";



GRANT ALL ON TABLE "public"."categorias_despesa" TO "anon";
GRANT ALL ON TABLE "public"."categorias_despesa" TO "authenticated";
GRANT ALL ON TABLE "public"."categorias_despesa" TO "service_role";



GRANT ALL ON TABLE "public"."clientes" TO "anon";
GRANT ALL ON TABLE "public"."clientes" TO "authenticated";
GRANT ALL ON TABLE "public"."clientes" TO "service_role";



GRANT ALL ON TABLE "public"."colheitas" TO "anon";
GRANT ALL ON TABLE "public"."colheitas" TO "authenticated";
GRANT ALL ON TABLE "public"."colheitas" TO "service_role";



GRANT ALL ON TABLE "public"."compras" TO "anon";
GRANT ALL ON TABLE "public"."compras" TO "authenticated";
GRANT ALL ON TABLE "public"."compras" TO "service_role";



GRANT ALL ON TABLE "public"."cost_categories" TO "anon";
GRANT ALL ON TABLE "public"."cost_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."cost_categories" TO "service_role";



GRANT ALL ON TABLE "public"."costs" TO "anon";
GRANT ALL ON TABLE "public"."costs" TO "authenticated";
GRANT ALL ON TABLE "public"."costs" TO "service_role";



GRANT ALL ON TABLE "public"."culturas" TO "anon";
GRANT ALL ON TABLE "public"."culturas" TO "authenticated";
GRANT ALL ON TABLE "public"."culturas" TO "service_role";



GRANT ALL ON TABLE "public"."custos" TO "anon";
GRANT ALL ON TABLE "public"."custos" TO "authenticated";
GRANT ALL ON TABLE "public"."custos" TO "service_role";



GRANT ALL ON TABLE "public"."descarte" TO "anon";
GRANT ALL ON TABLE "public"."descarte" TO "authenticated";
GRANT ALL ON TABLE "public"."descarte" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."estoque" TO "anon";
GRANT ALL ON TABLE "public"."estoque" TO "authenticated";
GRANT ALL ON TABLE "public"."estoque" TO "service_role";



GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "anon";
GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "authenticated";
GRANT ALL ON TABLE "public"."movimentacoes_financeiras" TO "service_role";



GRANT ALL ON TABLE "public"."financial_summary" TO "anon";
GRANT ALL ON TABLE "public"."financial_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_summary" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."manutencao_frota" TO "anon";
GRANT ALL ON TABLE "public"."manutencao_frota" TO "authenticated";
GRANT ALL ON TABLE "public"."manutencao_frota" TO "service_role";



GRANT ALL ON TABLE "public"."maquinas" TO "anon";
GRANT ALL ON TABLE "public"."maquinas" TO "authenticated";
GRANT ALL ON TABLE "public"."maquinas" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_audit" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_entidade_usuario_id_backup" TO "service_role";



GRANT ALL ON TABLE "public"."monitoramento_media" TO "anon";
GRANT ALL ON TABLE "public"."monitoramento_media" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoramento_media" TO "service_role";



GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."movimentacoes_financeiras_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."movimentos_estoque" TO "anon";
GRANT ALL ON TABLE "public"."movimentos_estoque" TO "authenticated";
GRANT ALL ON TABLE "public"."movimentos_estoque" TO "service_role";



GRANT ALL ON TABLE "public"."planos_adubacao" TO "anon";
GRANT ALL ON TABLE "public"."planos_adubacao" TO "authenticated";
GRANT ALL ON TABLE "public"."planos_adubacao" TO "service_role";



GRANT ALL ON TABLE "public"."plantio" TO "anon";
GRANT ALL ON TABLE "public"."plantio" TO "authenticated";
GRANT ALL ON TABLE "public"."plantio" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."receitas" TO "anon";
GRANT ALL ON TABLE "public"."receitas" TO "authenticated";
GRANT ALL ON TABLE "public"."receitas" TO "service_role";



GRANT ALL ON TABLE "public"."unidades_medida" TO "anon";
GRANT ALL ON TABLE "public"."unidades_medida" TO "authenticated";
GRANT ALL ON TABLE "public"."unidades_medida" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."vendas" TO "anon";
GRANT ALL ON TABLE "public"."vendas" TO "authenticated";
GRANT ALL ON TABLE "public"."vendas" TO "service_role";









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































