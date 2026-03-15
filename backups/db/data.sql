SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict S9Q9vXNePLRDJf29sKkI9BRavAI0NLFgUsPYufEcuqV5RwLR0pofpgsFMdpxGnL

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_entidade; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: analise_ia; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: areas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: caderno_notas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: categorias_despesa; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "nome", "email", "tipo_usuario", "created_at", "last_updated", "uuid", "is_deleted") VALUES
	('00ac01a0-5343-433f-a8ec-ee863d527767', NULL, NULL, NULL, '2026-03-08 13:04:50.815268', '2026-03-08 13:04:50.815268', '54ba3a8f-0f64-4135-9fc2-52375abd4912', 0);


--
-- Data for Name: colheitas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: compras; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cost_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: costs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: culturas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: custos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: descarte; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."items" ("id", "codigo", "nome", "categoria", "unidade", "tipo", "descricao", "created_at", "last_updated", "uuid", "is_deleted", "unidade_id") VALUES
	('5e263716-05bb-4a22-89d7-3a0f6659fc9b', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-08 13:05:54.200885', '2026-03-08 13:05:54.200885', 'e16fa8f2-c73c-4aa3-a03c-6b63b4b0d485', 0, NULL);


--
-- Data for Name: estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: maquinas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: manutencao_frota; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_entidade_audit; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_entidade_usuario_id_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: movimentacoes_financeiras; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: movimentos_estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: planos_adubacao; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: plantio; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: receitas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vendas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('agrogb-backups', 'agrogb-backups', NULL, '2026-03-07 10:28:42.527075+00', '2026-03-07 10:28:42.527075+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('backups do agrogb', 'backups do agrogb', NULL, '2026-03-09 02:04:47.964389+00', '2026-03-09 02:04:47.964389+00', false, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: movimentacoes_financeiras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."movimentacoes_financeiras_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict S9Q9vXNePLRDJf29sKkI9BRavAI0NLFgUsPYufEcuqV5RwLR0pofpgsFMdpxGnL

RESET ALL;
