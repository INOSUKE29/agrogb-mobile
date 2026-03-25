SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict losFts6lLJmE0zLwrELUUdySb4yO91twFVIyUdyfaE0vVuRhYFi3Kzh40aS44Ha

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

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', 'authenticated', 'authenticated', 'bruno.p.santos100@gmail.com', '$2a$10$0pKwOwvUwMrCSOzn7.K5ceXC3/.O.r.y19omd/qas7TA.bhY0LtJi', '2026-03-19 09:32:03.075716+00', NULL, '', '2026-03-19 09:10:25.833698+00', '', NULL, '', '', NULL, '2026-03-22 23:55:36.424018+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e047eead-4fa3-47cf-aafd-31a2062b11f5", "email": "bruno.p.santos100@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-18 01:41:43.513606+00', '2026-03-22 23:55:36.479715+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'df614ad3-40ec-44f1-86db-67f521042fdd', 'authenticated', 'authenticated', 'brunower2009@gmail.com', '$2a$10$S2J3f5/8ytXINd2ghbiY/.sjxaJC7EPYuecjq2q5/kZS6t/Q9IXc2', NULL, NULL, 'ed4665cd754f79ca9626540ccc23eeb9f5f3b26b824e41dfb0d8c175', '2026-03-18 01:42:32.32627+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "df614ad3-40ec-44f1-86db-67f521042fdd", "email": "brunower2009@gmail.com", "email_verified": false, "phone_verified": false}', NULL, '2026-03-18 01:42:32.317734+00', '2026-03-18 01:42:32.432208+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('df614ad3-40ec-44f1-86db-67f521042fdd', 'df614ad3-40ec-44f1-86db-67f521042fdd', '{"sub": "df614ad3-40ec-44f1-86db-67f521042fdd", "email": "brunower2009@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-18 01:42:32.324015+00', '2026-03-18 01:42:32.324068+00', '2026-03-18 01:42:32.324068+00', 'a037593b-6a71-4491-8f6a-6ce19bc3a08b'),
	('e047eead-4fa3-47cf-aafd-31a2062b11f5', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '{"sub": "e047eead-4fa3-47cf-aafd-31a2062b11f5", "email": "bruno.p.santos100@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-03-18 01:41:43.687558+00', '2026-03-18 01:41:43.687616+00', '2026-03-18 01:41:43.687616+00', 'bcc7f370-63b2-4e46-8efd-92f9aa3015c9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('ee9f98fd-ebb1-4ec8-9a19-50d37211b17a', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-19 09:32:03.1213+00', '2026-03-19 09:32:03.1213+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36', '189.96.227.95', NULL, NULL, NULL, NULL, NULL),
	('4015cce1-d3a8-4008-a18f-9f4c88b9cbbe', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-19 15:42:30.442475+00', '2026-03-19 17:43:39.528508+00', NULL, 'aal1', NULL, '2026-03-19 17:43:39.523253', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('6794b624-5f26-4978-9617-c5bfd99fe518', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-19 17:51:57.824996+00', '2026-03-19 17:51:57.824996+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('817ee74b-97fe-4329-b628-5f376c5a1b68', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-20 09:56:14.635492+00', '2026-03-20 09:56:14.635492+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('8facddfe-7b36-4812-85e3-fe8d05e2b03e', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-21 23:57:31.894013+00', '2026-03-21 23:57:31.894013+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('89a2600b-6b9e-4d59-ae46-357901cb2d59', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-21 23:58:36.532663+00', '2026-03-22 04:27:59.82601+00', NULL, 'aal1', NULL, '2026-03-22 04:27:59.825888', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('1270d314-7a2e-4a88-b188-a4f1d461c1c9', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 04:28:54.446561+00', '2026-03-22 10:54:05.806863+00', NULL, 'aal1', NULL, '2026-03-22 10:54:05.806046', 'okhttp/4.9.2', '179.84.155.12', NULL, NULL, NULL, NULL, NULL),
	('a49b169a-7320-4208-a7c7-7540e315491d', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 10:54:17.178299+00', '2026-03-22 10:54:17.178299+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '179.84.155.12', NULL, NULL, NULL, NULL, NULL),
	('3b077bd6-cece-45d9-8ed8-2346022c46d2', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 16:19:48.938673+00', '2026-03-22 16:19:48.938673+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '152.255.113.218', NULL, NULL, NULL, NULL, NULL),
	('97ddd573-ec56-48b1-bf18-49dc001a7630', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 16:40:48.636431+00', '2026-03-22 16:40:48.636431+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('37bcb228-e04a-4666-8062-24dca4fd6078', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 16:49:57.443601+00', '2026-03-22 16:49:57.443601+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('3978e34a-35cb-4a1d-9917-934797d324bd', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 17:22:23.354162+00', '2026-03-22 17:22:23.354162+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('355c0d0f-ce30-4b88-a6bf-bf69f205823f', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 18:59:43.416328+00', '2026-03-22 18:59:43.416328+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('916b7aee-d7b8-4156-ba29-3b96179434da', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 19:44:08.612591+00', '2026-03-22 19:44:08.612591+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('ca13ae8e-8c2a-4231-86c1-054fb959388e', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 20:54:48.948308+00', '2026-03-22 22:05:35.301715+00', NULL, 'aal1', NULL, '2026-03-22 22:05:35.301583', 'okhttp/4.9.2', '152.255.113.252', NULL, NULL, NULL, NULL, NULL),
	('a8329609-7aba-438a-8557-92e20ca34521', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', '2026-03-22 23:55:36.424128+00', '2026-03-22 23:55:36.424128+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '152.255.113.188', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('ee9f98fd-ebb1-4ec8-9a19-50d37211b17a', '2026-03-19 09:32:03.178536+00', '2026-03-19 09:32:03.178536+00', 'otp', '1b2880a9-47c6-4480-a3f5-74e41fe34665'),
	('4015cce1-d3a8-4008-a18f-9f4c88b9cbbe', '2026-03-19 15:42:30.538852+00', '2026-03-19 15:42:30.538852+00', 'password', '18389691-a06c-4cb6-9d58-f20bfffbb5c7'),
	('6794b624-5f26-4978-9617-c5bfd99fe518', '2026-03-19 17:51:57.836184+00', '2026-03-19 17:51:57.836184+00', 'password', 'a5cc7d5b-b57e-4f1c-a2a7-835930d74deb'),
	('817ee74b-97fe-4329-b628-5f376c5a1b68', '2026-03-20 09:56:14.73789+00', '2026-03-20 09:56:14.73789+00', 'password', '61842e4d-21cf-4f6b-8081-2990acdefd42'),
	('8facddfe-7b36-4812-85e3-fe8d05e2b03e', '2026-03-21 23:57:31.992096+00', '2026-03-21 23:57:31.992096+00', 'password', '3e9ed424-7910-4817-b8b3-704ff416cbab'),
	('89a2600b-6b9e-4d59-ae46-357901cb2d59', '2026-03-21 23:58:36.539157+00', '2026-03-21 23:58:36.539157+00', 'password', 'b3835926-00ac-432d-a294-e977411cab2f'),
	('1270d314-7a2e-4a88-b188-a4f1d461c1c9', '2026-03-22 04:28:54.459927+00', '2026-03-22 04:28:54.459927+00', 'password', '2b209f96-bde1-4ee9-951e-a0548187b43c'),
	('a49b169a-7320-4208-a7c7-7540e315491d', '2026-03-22 10:54:17.191674+00', '2026-03-22 10:54:17.191674+00', 'password', '59ad0a2b-605d-44f6-95fb-6b9841bbab70'),
	('3b077bd6-cece-45d9-8ed8-2346022c46d2', '2026-03-22 16:19:48.995161+00', '2026-03-22 16:19:48.995161+00', 'password', 'fd1bb04a-a2ff-4cdc-9c64-23cfabd8a27d'),
	('97ddd573-ec56-48b1-bf18-49dc001a7630', '2026-03-22 16:40:48.671144+00', '2026-03-22 16:40:48.671144+00', 'password', '1bdd6ae1-a3a2-4945-b586-dcebb39b54d0'),
	('37bcb228-e04a-4666-8062-24dca4fd6078', '2026-03-22 16:49:57.501518+00', '2026-03-22 16:49:57.501518+00', 'password', '8f5731b5-215b-4443-9dce-b4a948cf67fa'),
	('3978e34a-35cb-4a1d-9917-934797d324bd', '2026-03-22 17:22:23.401825+00', '2026-03-22 17:22:23.401825+00', 'password', 'd8578422-d2de-4973-a814-bc38ef1344a6'),
	('355c0d0f-ce30-4b88-a6bf-bf69f205823f', '2026-03-22 18:59:43.495224+00', '2026-03-22 18:59:43.495224+00', 'password', '565b4cae-53fc-4980-a0bd-330f9e800902'),
	('916b7aee-d7b8-4156-ba29-3b96179434da', '2026-03-22 19:44:08.688597+00', '2026-03-22 19:44:08.688597+00', 'password', '4054fa0d-8d2c-4dba-b6f4-7df3a517d360'),
	('ca13ae8e-8c2a-4231-86c1-054fb959388e', '2026-03-22 20:54:49.011901+00', '2026-03-22 20:54:49.011901+00', 'password', 'a49724d1-2810-4d8e-a85d-0ff821566ef0'),
	('a8329609-7aba-438a-8557-92e20ca34521', '2026-03-22 23:55:36.487247+00', '2026-03-22 23:55:36.487247+00', 'password', '2eb055bf-8830-4ff3-aa10-e2436d8d1c7f');


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

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('6b26110e-e634-4bb8-8551-9368f07ef22e', 'df614ad3-40ec-44f1-86db-67f521042fdd', 'confirmation_token', 'ed4665cd754f79ca9626540ccc23eeb9f5f3b26b824e41dfb0d8c175', 'brunower2009@gmail.com', '2026-03-18 01:42:32.433752', '2026-03-18 01:42:32.433752');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'y7ewawckao6s', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-19 09:32:03.148678+00', '2026-03-19 09:32:03.148678+00', NULL, 'ee9f98fd-ebb1-4ec8-9a19-50d37211b17a'),
	('00000000-0000-0000-0000-000000000000', 2, 'qpoh6sd5fdzb', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', true, '2026-03-19 15:42:30.495792+00', '2026-03-19 17:43:39.450385+00', NULL, '4015cce1-d3a8-4008-a18f-9f4c88b9cbbe'),
	('00000000-0000-0000-0000-000000000000', 3, 'xqvdxzvcyyre', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-19 17:43:39.483608+00', '2026-03-19 17:43:39.483608+00', 'qpoh6sd5fdzb', '4015cce1-d3a8-4008-a18f-9f4c88b9cbbe'),
	('00000000-0000-0000-0000-000000000000', 4, 'glwiqmtskym6', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-19 17:51:57.833165+00', '2026-03-19 17:51:57.833165+00', NULL, '6794b624-5f26-4978-9617-c5bfd99fe518'),
	('00000000-0000-0000-0000-000000000000', 5, '4go7thwwbihn', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-20 09:56:14.688898+00', '2026-03-20 09:56:14.688898+00', NULL, '817ee74b-97fe-4329-b628-5f376c5a1b68'),
	('00000000-0000-0000-0000-000000000000', 6, '3dutcpztksi7', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-21 23:57:31.945232+00', '2026-03-21 23:57:31.945232+00', NULL, '8facddfe-7b36-4812-85e3-fe8d05e2b03e'),
	('00000000-0000-0000-0000-000000000000', 7, '2qon52mzlrmt', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', true, '2026-03-21 23:58:36.535558+00', '2026-03-22 04:27:59.751215+00', NULL, '89a2600b-6b9e-4d59-ae46-357901cb2d59'),
	('00000000-0000-0000-0000-000000000000', 8, 'yes565a2daae', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 04:27:59.78152+00', '2026-03-22 04:27:59.78152+00', '2qon52mzlrmt', '89a2600b-6b9e-4d59-ae46-357901cb2d59'),
	('00000000-0000-0000-0000-000000000000', 9, 'rk6fndxuvb2i', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', true, '2026-03-22 04:28:54.457896+00', '2026-03-22 10:54:05.747682+00', NULL, '1270d314-7a2e-4a88-b188-a4f1d461c1c9'),
	('00000000-0000-0000-0000-000000000000', 10, 'kxtp4lkjkqbp', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 10:54:05.771002+00', '2026-03-22 10:54:05.771002+00', 'rk6fndxuvb2i', '1270d314-7a2e-4a88-b188-a4f1d461c1c9'),
	('00000000-0000-0000-0000-000000000000', 11, 'uo3fchq3kvug', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 10:54:17.188553+00', '2026-03-22 10:54:17.188553+00', NULL, 'a49b169a-7320-4208-a7c7-7540e315491d'),
	('00000000-0000-0000-0000-000000000000', 12, 'sgmm37y5srrs', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 16:19:48.977284+00', '2026-03-22 16:19:48.977284+00', NULL, '3b077bd6-cece-45d9-8ed8-2346022c46d2'),
	('00000000-0000-0000-0000-000000000000', 13, '3oo6zfszqyqn', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 16:40:48.662072+00', '2026-03-22 16:40:48.662072+00', NULL, '97ddd573-ec56-48b1-bf18-49dc001a7630'),
	('00000000-0000-0000-0000-000000000000', 14, 'hcofqngfxcdy', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 16:49:57.480375+00', '2026-03-22 16:49:57.480375+00', NULL, '37bcb228-e04a-4666-8062-24dca4fd6078'),
	('00000000-0000-0000-0000-000000000000', 15, 'kheqh7dt6jqo', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 17:22:23.386459+00', '2026-03-22 17:22:23.386459+00', NULL, '3978e34a-35cb-4a1d-9917-934797d324bd'),
	('00000000-0000-0000-0000-000000000000', 16, 'nefi7gjhkuoe', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 18:59:43.464402+00', '2026-03-22 18:59:43.464402+00', NULL, '355c0d0f-ce30-4b88-a6bf-bf69f205823f'),
	('00000000-0000-0000-0000-000000000000', 17, 'v5s6v64srgio', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 19:44:08.657762+00', '2026-03-22 19:44:08.657762+00', NULL, '916b7aee-d7b8-4156-ba29-3b96179434da'),
	('00000000-0000-0000-0000-000000000000', 18, 'sao3ycuymj7y', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', true, '2026-03-22 20:54:48.985663+00', '2026-03-22 22:05:35.228171+00', NULL, 'ca13ae8e-8c2a-4231-86c1-054fb959388e'),
	('00000000-0000-0000-0000-000000000000', 19, '6hrkacpvxzv6', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 22:05:35.262002+00', '2026-03-22 22:05:35.262002+00', 'sao3ycuymj7y', 'ca13ae8e-8c2a-4231-86c1-054fb959388e'),
	('00000000-0000-0000-0000-000000000000', 20, 'z5roirtzm5ug', 'e047eead-4fa3-47cf-aafd-31a2062b11f5', false, '2026-03-22 23:55:36.463199+00', '2026-03-22 23:55:36.463199+00', NULL, 'a8329609-7aba-438a-8557-92e20ca34521');


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
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
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
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: cadastro; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cadastro" ("uuid", "user_id", "nome", "unidade", "tipo", "observacao", "estocavel", "vendavel", "fator_conversao", "preco_venda", "last_updated", "is_deleted", "categoria") VALUES
	('d556b9df-2c78-4b50-8660-7aa40df99ece', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'INSUMO'),
	('a4da9694-a61f-41db-a26f-36472254c93c', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'INSUMO'),
	('2e66a0e7-6cea-444a-802f-0e892ac13a23', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'SEMENTE'),
	('497d7c68-0c2f-4620-bd29-fc9a28b179b8', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'INSUMO'),
	('0a9259c4-8de1-4ddc-a3a3-59f3941d60b5', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'INSUMO'),
	('65496cf6-c419-4841-8f82-07f9380a8bad', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'SEMENTE'),
	('9748d9a5-9292-4909-abba-228894b0f3d5', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'INSUMO'),
	('c901c8c4-b77f-415f-a6c5-b51ee4697d05', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'INSUMO'),
	('66e81b6b-fd96-4239-9252-b8a0053eab57', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'SEMENTE');


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

INSERT INTO "public"."users" ("id", "nome", "email", "tipo_usuario", "created_at", "last_updated", "uuid", "is_deleted", "usuario_id_bak_20260315145412", "is_deleted_bool", "usuario_id") VALUES
	('00ac01a0-5343-433f-a8ec-ee863d527767', NULL, NULL, NULL, '2026-03-08 13:04:50.815268', '2026-03-08 13:04:50.815268', '54ba3a8f-0f64-4135-9fc2-52375abd4912', 0, NULL, false, NULL);


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

INSERT INTO "public"."culturas" ("id", "uuid", "nome", "observacao", "created_at", "last_updated", "is_deleted", "usuario_id_bak_20260315145412", "is_deleted_bool", "usuario_id") VALUES
	('43d79ab6-b007-48c8-8bbe-971b435d1999', '1e455d23-c2f4-4c24-ba41-ffdc252c7b3d', 'MILHO', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL),
	('42289112-73a5-4060-8955-ff6823abd5b2', '25314468-574b-4c27-8498-fb5d67646240', 'SOJA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL),
	('9c39b74d-d843-48b4-8e55-c1f9f13e9dcf', 'eb7dd9b3-49fd-46d7-89e8-d24b23c3a66c', 'COVE', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL),
	('5677f411-faf2-486a-be2d-93e1790b2cce', '5012f28d-f38a-46e0-b7cd-d9fd69c45a75', 'CEBOLA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL),
	('7e5ef8cb-9c0a-4fdd-bc82-2f63a15f729e', 'c875b0d6-2487-4d6e-8677-92011275b0c2', 'CEBOLINHA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL),
	('6ad0bb3d-b733-41fc-89d9-ae88ed632e82', '48f7c9a3-65ac-4f3e-abf4-4d6ffffcd52b', 'SALSINHA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL);


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

INSERT INTO "public"."items" ("id", "codigo", "nome", "categoria", "unidade", "tipo", "descricao", "created_at", "last_updated", "uuid", "is_deleted", "unidade_id", "usuario_id_bak_20260315145412", "is_deleted_bool", "usuario_id") VALUES
	('5e263716-05bb-4a22-89d7-3a0f6659fc9b', NULL, NULL, NULL, NULL, NULL, NULL, '2026-03-08 13:05:54.200885', '2026-03-08 13:05:54.200885', 'e16fa8f2-c73c-4aa3-a03c-6b63b4b0d485', 0, NULL, NULL, false, NULL);


--
-- Data for Name: estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fertilization_recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fertilization_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: fertilization_items; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_entidade_usuario_id_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: planos_adubacao; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: plantio; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: production_fertilization_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "nome", "email", "avatar_url", "created_at", "uuid", "last_updated", "is_deleted", "usuario_id_bak_20260315145412", "is_deleted_bool", "usuario_id") VALUES
	('e047eead-4fa3-47cf-aafd-31a2062b11f5', NULL, 'bruno.p.santos100@gmail.com', NULL, '2026-03-18 01:41:43.510207+00', '5bfa70e0-925a-44fd-8e65-08c7e4d34e90', '2026-03-18 01:41:43.510207', 0, NULL, false, NULL),
	('df614ad3-40ec-44f1-86db-67f521042fdd', NULL, 'brunower2009@gmail.com', NULL, '2026-03-18 01:42:32.317255+00', 'a9152e02-ba89-4851-828f-667e7357190a', '2026-03-18 01:42:32.317255', 0, NULL, false, NULL);


--
-- Data for Name: receitas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schema_migrations" ("id", "run_ts", "description", "script") VALUES
	(1, '2026-03-15 15:27:52.136151+00', 'rollback_for_usuario_id_changes_20260315152752', '-- Restore usuario_id for table activity_log
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_usuario_id_fkey;\nUPDATE public.activity_log SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.activity_log RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.activity_log RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table activity_log_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.activity_log_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS activity_log_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.activity_log_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.activity_log_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.activity_log_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table analise_ia
ALTER TABLE public.analise_ia DROP CONSTRAINT IF EXISTS analise_ia_usuario_id_fkey;\nUPDATE public.analise_ia SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.analise_ia RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.analise_ia RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table analise_ia_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.analise_ia_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS analise_ia_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.analise_ia_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.analise_ia_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.analise_ia_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table app_settings
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_usuario_id_fkey;\nUPDATE public.app_settings SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.app_settings RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.app_settings RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table app_settings_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.app_settings_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS app_settings_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.app_settings_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.app_settings_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.app_settings_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table areas
ALTER TABLE public.areas DROP CONSTRAINT IF EXISTS areas_usuario_id_fkey;\nUPDATE public.areas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.areas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.areas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table areas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.areas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS areas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.areas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.areas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.areas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table caderno_notas
ALTER TABLE public.caderno_notas DROP CONSTRAINT IF EXISTS caderno_notas_usuario_id_fkey;\nUPDATE public.caderno_notas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.caderno_notas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.caderno_notas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table caderno_notas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.caderno_notas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS caderno_notas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.caderno_notas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.caderno_notas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.caderno_notas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table categorias_despesa
ALTER TABLE public.categorias_despesa DROP CONSTRAINT IF EXISTS categorias_despesa_usuario_id_fkey;\nUPDATE public.categorias_despesa SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.categorias_despesa RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.categorias_despesa RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table categorias_despesa_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.categorias_despesa_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS categorias_despesa_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.categorias_despesa_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.categorias_despesa_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.categorias_despesa_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table clientes
ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_usuario_id_fkey;\nUPDATE public.clientes SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.clientes RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.clientes RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table clientes_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.clientes_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS clientes_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.clientes_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.clientes_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.clientes_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table colheitas
ALTER TABLE public.colheitas DROP CONSTRAINT IF EXISTS colheitas_usuario_id_fkey;\nUPDATE public.colheitas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.colheitas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.colheitas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table colheitas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.colheitas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS colheitas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.colheitas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.colheitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.colheitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table compras
ALTER TABLE public.compras DROP CONSTRAINT IF EXISTS compras_usuario_id_fkey;\nUPDATE public.compras SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.compras RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.compras RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table compras_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.compras_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS compras_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.compras_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.compras_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.compras_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table cost_categories
ALTER TABLE public.cost_categories DROP CONSTRAINT IF EXISTS cost_categories_usuario_id_fkey;\nUPDATE public.cost_categories SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.cost_categories RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.cost_categories RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table cost_categories_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.cost_categories_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS cost_categories_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.cost_categories_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.cost_categories_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.cost_categories_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table costs
ALTER TABLE public.costs DROP CONSTRAINT IF EXISTS costs_usuario_id_fkey;\nUPDATE public.costs SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.costs RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.costs RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table costs_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.costs_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS costs_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.costs_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.costs_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.costs_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table culturas
ALTER TABLE public.culturas DROP CONSTRAINT IF EXISTS culturas_usuario_id_fkey;\nUPDATE public.culturas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.culturas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.culturas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table culturas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.culturas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS culturas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.culturas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.culturas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.culturas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table custos
ALTER TABLE public.custos DROP CONSTRAINT IF EXISTS custos_usuario_id_fkey;\nUPDATE public.custos SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.custos RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.custos RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table custos_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.custos_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS custos_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.custos_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.custos_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.custos_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table descarte
ALTER TABLE public.descarte DROP CONSTRAINT IF EXISTS descarte_usuario_id_fkey;\nUPDATE public.descarte SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.descarte RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.descarte RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table descarte_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.descarte_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS descarte_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.descarte_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.descarte_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.descarte_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table error_logs
ALTER TABLE public.error_logs DROP CONSTRAINT IF EXISTS error_logs_usuario_id_fkey;\nUPDATE public.error_logs SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.error_logs RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.error_logs RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table error_logs_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.error_logs_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS error_logs_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.error_logs_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.error_logs_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.error_logs_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table estoque
ALTER TABLE public.estoque DROP CONSTRAINT IF EXISTS estoque_usuario_id_fkey;\nUPDATE public.estoque SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.estoque RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.estoque RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table estoque_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.estoque_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS estoque_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.estoque_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.estoque_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.estoque_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table items
ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_usuario_id_fkey;\nUPDATE public.items SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.items RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.items RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table items_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.items_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS items_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.items_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.items_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.items_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table manutencao_frota
ALTER TABLE public.manutencao_frota DROP CONSTRAINT IF EXISTS manutencao_frota_usuario_id_fkey;\nUPDATE public.manutencao_frota SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.manutencao_frota RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.manutencao_frota RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table manutencao_frota_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.manutencao_frota_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS manutencao_frota_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.manutencao_frota_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.manutencao_frota_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.manutencao_frota_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table maquinas
ALTER TABLE public.maquinas DROP CONSTRAINT IF EXISTS maquinas_usuario_id_fkey;\nUPDATE public.maquinas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.maquinas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.maquinas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table maquinas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.maquinas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS maquinas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.maquinas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.maquinas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.maquinas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade
ALTER TABLE public.monitoramento_entidade DROP CONSTRAINT IF EXISTS monitoramento_entidade_usuario_id_fkey;\nUPDATE public.monitoramento_entidade SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade_audit
ALTER TABLE public.monitoramento_entidade_audit DROP CONSTRAINT IF EXISTS monitoramento_entidade_audit_usuario_id_fkey;\nUPDATE public.monitoramento_entidade_audit SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade_audit RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade_audit RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145
ALTER TABLE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 DROP CONSTRAINT IF EXISTS monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_usuario_id_fkey;\nUPDATE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade_usuario_id_backup
ALTER TABLE public.monitoramento_entidade_usuario_id_backup DROP CONSTRAINT IF EXISTS monitoramento_entidade_usuario_id_backup_usuario_id_fkey;\nUPDATE public.monitoramento_entidade_usuario_id_backup SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade_usuario_id_backup RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade_usuario_id_backup RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak
ALTER TABLE public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak DROP CONSTRAINT IF EXISTS monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_usuario_id_fkey;\nUPDATE public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_entidade_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS monitoramento_entidade_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_media
ALTER TABLE public.monitoramento_media DROP CONSTRAINT IF EXISTS monitoramento_media_usuario_id_fkey;\nUPDATE public.monitoramento_media SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_media RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_media RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table monitoramento_media_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.monitoramento_media_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS monitoramento_media_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.monitoramento_media_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.monitoramento_media_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.monitoramento_media_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table movimentacoes_financeiras
ALTER TABLE public.movimentacoes_financeiras DROP CONSTRAINT IF EXISTS movimentacoes_financeiras_usuario_id_fkey;\nUPDATE public.movimentacoes_financeiras SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.movimentacoes_financeiras RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.movimentacoes_financeiras RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table movimentos_estoque
ALTER TABLE public.movimentos_estoque DROP CONSTRAINT IF EXISTS movimentos_estoque_usuario_id_fkey;\nUPDATE public.movimentos_estoque SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.movimentos_estoque RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.movimentos_estoque RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table movimentos_estoque_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.movimentos_estoque_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS movimentos_estoque_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.movimentos_estoque_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.movimentos_estoque_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.movimentos_estoque_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table planos_adubacao
ALTER TABLE public.planos_adubacao DROP CONSTRAINT IF EXISTS planos_adubacao_usuario_id_fkey;\nUPDATE public.planos_adubacao SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.planos_adubacao RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.planos_adubacao RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table planos_adubacao_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.planos_adubacao_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS planos_adubacao_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.planos_adubacao_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.planos_adubacao_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.planos_adubacao_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table plantio
ALTER TABLE public.plantio DROP CONSTRAINT IF EXISTS plantio_usuario_id_fkey;\nUPDATE public.plantio SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.plantio RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.plantio RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table plantio_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.plantio_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS plantio_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.plantio_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.plantio_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.plantio_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_usuario_id_fkey;\nUPDATE public.profiles SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.profiles RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.profiles RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table profiles_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.profiles_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS profiles_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.profiles_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.profiles_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.profiles_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table receitas
ALTER TABLE public.receitas DROP CONSTRAINT IF EXISTS receitas_usuario_id_fkey;\nUPDATE public.receitas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.receitas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.receitas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table receitas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.receitas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS receitas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.receitas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.receitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.receitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table unidades_medida
ALTER TABLE public.unidades_medida DROP CONSTRAINT IF EXISTS unidades_medida_usuario_id_fkey;\nUPDATE public.unidades_medida SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.unidades_medida RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.unidades_medida RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table unidades_medida_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.unidades_medida_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS unidades_medida_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.unidades_medida_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.unidades_medida_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.unidades_medida_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_usuario_id_fkey;\nUPDATE public.users SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.users RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.users RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table users_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.users_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS users_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.users_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.users_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.users_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_colheitas
ALTER TABLE public.v2_colheitas DROP CONSTRAINT IF EXISTS v2_colheitas_usuario_id_fkey;\nUPDATE public.v2_colheitas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_colheitas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_colheitas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_colheitas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.v2_colheitas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS v2_colheitas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.v2_colheitas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_colheitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_colheitas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_fazendas
ALTER TABLE public.v2_fazendas DROP CONSTRAINT IF EXISTS v2_fazendas_usuario_id_fkey;\nUPDATE public.v2_fazendas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_fazendas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_fazendas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_fazendas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.v2_fazendas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS v2_fazendas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.v2_fazendas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_fazendas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_fazendas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_produtores
ALTER TABLE public.v2_produtores DROP CONSTRAINT IF EXISTS v2_produtores_usuario_id_fkey;\nUPDATE public.v2_produtores SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_produtores RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_produtores RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_produtores_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.v2_produtores_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS v2_produtores_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.v2_produtores_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_produtores_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_produtores_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_talhoes
ALTER TABLE public.v2_talhoes DROP CONSTRAINT IF EXISTS v2_talhoes_usuario_id_fkey;\nUPDATE public.v2_talhoes SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_talhoes RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_talhoes RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table v2_talhoes_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.v2_talhoes_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS v2_talhoes_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.v2_talhoes_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.v2_talhoes_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.v2_talhoes_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table vendas
ALTER TABLE public.vendas DROP CONSTRAINT IF EXISTS vendas_usuario_id_fkey;\nUPDATE public.vendas SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.vendas RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.vendas RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore usuario_id for table vendas_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.vendas_usuario_id_invalid_bak_20260315145520 DROP CONSTRAINT IF EXISTS vendas_usuario_id_invalid_bak_20260315145520_usuario_id_fkey;\nUPDATE public.vendas_usuario_id_invalid_bak_20260315145520 SET usuario_id = usuario_id_bak_20260315152752 WHERE usuario_id IS NULL AND usuario_id_bak_20260315152752 IS NOT NULL;\nALTER TABLE public.vendas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id TO usuario_id_new_20260315152752;\nALTER TABLE public.vendas_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_bak_20260315152752 TO usuario_id;\n-- Restore dropped column name usuario_id_to_drop_bak_20260315145412 on monitoramento_entidade_usuario_id_invalid_bak_20260315145520
ALTER TABLE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520 RENAME COLUMN usuario_id_to_drop_bak_20260315145412 TO usuario_id_to_drop;\n-- Restore dropped column name usuario_id_to_drop_bak_20260315145412 on monitoramento_entidade
ALTER TABLE public.monitoramento_entidade RENAME COLUMN usuario_id_to_drop_bak_20260315145412 TO usuario_id_to_drop;\nDROP POLICY IF EXISTS movimentos_estoque_owner_full_access ON public.movimentos_estoque;\nDROP POLICY IF EXISTS movimentos_estoque_owner_full_access_userid ON public.movimentos_estoque;\nDROP POLICY IF EXISTS movimentos_estoque_admin_read ON public.movimentos_estoque;\nDROP POLICY IF EXISTS users_owner_full_access ON public.users;\nDROP POLICY IF EXISTS users_owner_full_access_userid ON public.users;\nDROP POLICY IF EXISTS users_admin_read ON public.users;\nDROP POLICY IF EXISTS areas_owner_full_access ON public.areas;\nDROP POLICY IF EXISTS areas_owner_full_access_userid ON public.areas;\nDROP POLICY IF EXISTS areas_admin_read ON public.areas;\nDROP POLICY IF EXISTS clientes_owner_full_access ON public.clientes;\nDROP POLICY IF EXISTS clientes_owner_full_access_userid ON public.clientes;\nDROP POLICY IF EXISTS clientes_admin_read ON public.clientes;\nDROP POLICY IF EXISTS colheitas_owner_full_access ON public.colheitas;\nDROP POLICY IF EXISTS colheitas_owner_full_access_userid ON public.colheitas;\nDROP POLICY IF EXISTS colheitas_admin_read ON public.colheitas;\nDROP POLICY IF EXISTS vendas_owner_full_access ON public.vendas;\nDROP POLICY IF EXISTS vendas_owner_full_access_userid ON public.vendas;\nDROP POLICY IF EXISTS vendas_admin_read ON public.vendas;\nDROP POLICY IF EXISTS items_owner_full_access ON public.items;\nDROP POLICY IF EXISTS items_owner_full_access_userid ON public.items;\nDROP POLICY IF EXISTS items_admin_read ON public.items;\nDROP POLICY IF EXISTS analise_ia_owner_full_access ON public.analise_ia;\nDROP POLICY IF EXISTS analise_ia_owner_full_access_userid ON public.analise_ia;\nDROP POLICY IF EXISTS analise_ia_admin_read ON public.analise_ia;\nDROP POLICY IF EXISTS compras_owner_full_access ON public.compras;\nDROP POLICY IF EXISTS compras_owner_full_access_userid ON public.compras;\nDROP POLICY IF EXISTS compras_admin_read ON public.compras;\nDROP POLICY IF EXISTS plantio_owner_full_access ON public.plantio;\nDROP POLICY IF EXISTS plantio_owner_full_access_userid ON public.plantio;\nDROP POLICY IF EXISTS plantio_admin_read ON public.plantio;\nDROP POLICY IF EXISTS custos_owner_full_access ON public.custos;\nDROP POLICY IF EXISTS custos_owner_full_access_userid ON public.custos;\nDROP POLICY IF EXISTS custos_admin_read ON public.custos;\nDROP POLICY IF EXISTS planos_adubacao_owner_full_access ON public.planos_adubacao;\nDROP POLICY IF EXISTS planos_adubacao_owner_full_access_userid ON public.planos_adubacao;\nDROP POLICY IF EXISTS planos_adubacao_admin_read ON public.planos_adubacao;\nDROP POLICY IF EXISTS error_logs_owner_full_access ON public.error_logs;\nDROP POLICY IF EXISTS error_logs_owner_full_access_userid ON public.error_logs;\nDROP POLICY IF EXISTS error_logs_admin_read ON public.error_logs;\nDROP POLICY IF EXISTS profiles_owner_full_access ON public.profiles;\nDROP POLICY IF EXISTS profiles_owner_full_access_userid ON public.profiles;\nDROP POLICY IF EXISTS profiles_admin_read ON public.profiles;\nDROP POLICY IF EXISTS maquinas_owner_full_access ON public.maquinas;\nDROP POLICY IF EXISTS maquinas_owner_full_access_userid ON public.maquinas;\nDROP POLICY IF EXISTS maquinas_admin_read ON public.maquinas;\nDROP POLICY IF EXISTS estoque_owner_full_access ON public.estoque;\nDROP POLICY IF EXISTS estoque_owner_full_access_userid ON public.estoque;\nDROP POLICY IF EXISTS estoque_admin_read ON public.estoque;\nDROP POLICY IF EXISTS unidades_medida_owner_full_access ON public.unidades_medida;\nDROP POLICY IF EXISTS unidades_medida_owner_full_access_userid ON public.unidades_medida;\nDROP POLICY IF EXISTS unidades_medida_admin_read ON public.unidades_medida;\nDROP POLICY IF EXISTS monitoramento_media_owner_full_access ON public.monitoramento_media;\nDROP POLICY IF EXISTS monitoramento_media_owner_full_access_userid ON public.monitoramento_media;\nDROP POLICY IF EXISTS monitoramento_media_admin_read ON public.monitoramento_media;\nDROP POLICY IF EXISTS receitas_owner_full_access ON public.receitas;\nDROP POLICY IF EXISTS receitas_owner_full_access_userid ON public.receitas;\nDROP POLICY IF EXISTS receitas_admin_read ON public.receitas;\nDROP POLICY IF EXISTS areas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.areas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS areas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.areas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS areas_usuario_id_invalid_bak_20260315145520_admin_read ON public.areas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentos_estoque_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.movimentos_estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentos_estoque_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.movimentos_estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentos_estoque_usuario_id_invalid_bak_20260315145520_admin_read ON public.movimentos_estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS users_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.users_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS users_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.users_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS users_usuario_id_invalid_bak_20260315145520_admin_read ON public.users_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS clientes_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.clientes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS clientes_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.clientes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS clientes_usuario_id_invalid_bak_20260315145520_admin_read ON public.clientes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS items_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.items_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS items_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.items_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS items_usuario_id_invalid_bak_20260315145520_admin_read ON public.items_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS analise_ia_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.analise_ia_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS analise_ia_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.analise_ia_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS analise_ia_usuario_id_invalid_bak_20260315145520_admin_read ON public.analise_ia_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS colheitas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS colheitas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS colheitas_usuario_id_invalid_bak_20260315145520_admin_read ON public.colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS vendas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.vendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS vendas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.vendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS vendas_usuario_id_invalid_bak_20260315145520_admin_read ON public.vendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS compras_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.compras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS compras_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.compras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS compras_usuario_id_invalid_bak_20260315145520_admin_read ON public.compras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS plantio_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.plantio_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS plantio_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.plantio_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS plantio_usuario_id_invalid_bak_20260315145520_admin_read ON public.plantio_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS profiles_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.profiles_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS profiles_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.profiles_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS profiles_usuario_id_invalid_bak_20260315145520_admin_read ON public.profiles_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS maquinas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.maquinas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS maquinas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.maquinas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS maquinas_usuario_id_invalid_bak_20260315145520_admin_read ON public.maquinas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS custos_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.custos_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS custos_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.custos_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS custos_usuario_id_invalid_bak_20260315145520_admin_read ON public.custos_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS planos_adubacao_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.planos_adubacao_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS planos_adubacao_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.planos_adubacao_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS planos_adubacao_usuario_id_invalid_bak_20260315145520_admin_read ON public.planos_adubacao_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS error_logs_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.error_logs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS error_logs_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.error_logs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS error_logs_usuario_id_invalid_bak_20260315145520_admin_read ON public.error_logs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS estoque_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS estoque_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS estoque_usuario_id_invalid_bak_20260315145520_admin_read ON public.estoque_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_produtores_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.v2_produtores_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_produtores_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.v2_produtores_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_produtores_usuario_id_invalid_bak_20260315145520_admin_read ON public.v2_produtores_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_fazendas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.v2_fazendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_fazendas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.v2_fazendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_fazendas_usuario_id_invalid_bak_20260315145520_admin_read ON public.v2_fazendas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS unidades_medida_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.unidades_medida_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS unidades_medida_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.unidades_medida_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS unidades_medida_usuario_id_invalid_bak_20260315145520_admin_read ON public.unidades_medida_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_media_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.monitoramento_media_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_media_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.monitoramento_media_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_media_usuario_id_invalid_bak_20260315145520_admin_read ON public.monitoramento_media_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS receitas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.receitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS receitas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.receitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS receitas_usuario_id_invalid_bak_20260315145520_admin_read ON public.receitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_talhoes_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.v2_talhoes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_talhoes_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.v2_talhoes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_talhoes_usuario_id_invalid_bak_20260315145520_admin_read ON public.v2_talhoes_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_colheitas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.v2_colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_colheitas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.v2_colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_colheitas_usuario_id_invalid_bak_20260315145520_admin_read ON public.v2_colheitas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS culturas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.culturas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS culturas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.culturas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS culturas_usuario_id_invalid_bak_20260315145520_admin_read ON public.culturas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS manutencao_frota_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.manutencao_frota_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS manutencao_frota_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.manutencao_frota_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS manutencao_frota_usuario_id_invalid_bak_20260315145520_admin_read ON public.manutencao_frota_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS app_settings_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.app_settings_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS app_settings_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.app_settings_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS app_settings_usuario_id_invalid_bak_20260315145520_admin_read ON public.app_settings_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS activity_log_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.activity_log_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS activity_log_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.activity_log_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS activity_log_usuario_id_invalid_bak_20260315145520_admin_read ON public.activity_log_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS descarte_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.descarte_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS descarte_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.descarte_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS descarte_usuario_id_invalid_bak_20260315145520_admin_read ON public.descarte_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520_admin_read ON public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS cost_categories_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.cost_categories_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS cost_categories_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.cost_categories_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS cost_categories_usuario_id_invalid_bak_20260315145520_admin_read ON public.cost_categories_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS caderno_notas_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.caderno_notas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS caderno_notas_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.caderno_notas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS caderno_notas_usuario_id_invalid_bak_20260315145520_admin_read ON public.caderno_notas_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_owner_full_access ON public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_owner_full_access_userid ON public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_admin_read ON public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak;\nDROP POLICY IF EXISTS costs_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.costs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS costs_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.costs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS costs_usuario_id_invalid_bak_20260315145520_admin_read ON public.costs_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS v2_produtores_owner_full_access ON public.v2_produtores;\nDROP POLICY IF EXISTS v2_produtores_owner_full_access_userid ON public.v2_produtores;\nDROP POLICY IF EXISTS v2_produtores_admin_read ON public.v2_produtores;\nDROP POLICY IF EXISTS v2_fazendas_owner_full_access ON public.v2_fazendas;\nDROP POLICY IF EXISTS v2_fazendas_owner_full_access_userid ON public.v2_fazendas;\nDROP POLICY IF EXISTS v2_fazendas_admin_read ON public.v2_fazendas;\nDROP POLICY IF EXISTS v2_talhoes_owner_full_access ON public.v2_talhoes;\nDROP POLICY IF EXISTS v2_talhoes_owner_full_access_userid ON public.v2_talhoes;\nDROP POLICY IF EXISTS v2_talhoes_admin_read ON public.v2_talhoes;\nDROP POLICY IF EXISTS v2_colheitas_owner_full_access ON public.v2_colheitas;\nDROP POLICY IF EXISTS v2_colheitas_owner_full_access_userid ON public.v2_colheitas;\nDROP POLICY IF EXISTS v2_colheitas_admin_read ON public.v2_colheitas;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_owner_full_access ON public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_owner_full_access_userid ON public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_admin_read ON public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_invalid_bak_20260315145520_admin_read ON public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS categorias_despesa_usuario_id_invalid_bak_20260315145520_owner_full_access ON public.categorias_despesa_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS categorias_despesa_usuario_id_invalid_bak_20260315145520_owner_full_access_userid ON public.categorias_despesa_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS categorias_despesa_usuario_id_invalid_bak_20260315145520_admin_read ON public.categorias_despesa_usuario_id_invalid_bak_20260315145520;\nDROP POLICY IF EXISTS app_settings_owner_full_access ON public.app_settings;\nDROP POLICY IF EXISTS app_settings_owner_full_access_userid ON public.app_settings;\nDROP POLICY IF EXISTS app_settings_admin_read ON public.app_settings;\nDROP POLICY IF EXISTS activity_log_owner_full_access ON public.activity_log;\nDROP POLICY IF EXISTS activity_log_owner_full_access_userid ON public.activity_log;\nDROP POLICY IF EXISTS activity_log_admin_read ON public.activity_log;\nDROP POLICY IF EXISTS culturas_owner_full_access ON public.culturas;\nDROP POLICY IF EXISTS culturas_owner_full_access_userid ON public.culturas;\nDROP POLICY IF EXISTS culturas_admin_read ON public.culturas;\nDROP POLICY IF EXISTS manutencao_frota_owner_full_access ON public.manutencao_frota;\nDROP POLICY IF EXISTS manutencao_frota_owner_full_access_userid ON public.manutencao_frota;\nDROP POLICY IF EXISTS manutencao_frota_admin_read ON public.manutencao_frota;\nDROP POLICY IF EXISTS descarte_owner_full_access ON public.descarte;\nDROP POLICY IF EXISTS descarte_owner_full_access_userid ON public.descarte;\nDROP POLICY IF EXISTS descarte_admin_read ON public.descarte;\nDROP POLICY IF EXISTS caderno_notas_owner_full_access ON public.caderno_notas;\nDROP POLICY IF EXISTS caderno_notas_owner_full_access_userid ON public.caderno_notas;\nDROP POLICY IF EXISTS caderno_notas_admin_read ON public.caderno_notas;\nDROP POLICY IF EXISTS movimentacoes_financeiras_owner_full_access ON public.movimentacoes_financeiras;\nDROP POLICY IF EXISTS movimentacoes_financeiras_owner_full_access_userid ON public.movimentacoes_financeiras;\nDROP POLICY IF EXISTS movimentacoes_financeiras_admin_read ON public.movimentacoes_financeiras;\nDROP POLICY IF EXISTS schema_migrations_owner_full_access ON public.schema_migrations;\nDROP POLICY IF EXISTS schema_migrations_owner_full_access_userid ON public.schema_migrations;\nDROP POLICY IF EXISTS schema_migrations_admin_read ON public.schema_migrations;\nDROP POLICY IF EXISTS cost_categories_owner_full_access ON public.cost_categories;\nDROP POLICY IF EXISTS cost_categories_owner_full_access_userid ON public.cost_categories;\nDROP POLICY IF EXISTS cost_categories_admin_read ON public.cost_categories;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_owner_full_access ON public.monitoramento_entidade_usuario_id_backup;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_owner_full_access_userid ON public.monitoramento_entidade_usuario_id_backup;\nDROP POLICY IF EXISTS monitoramento_entidade_usuario_id_backup_admin_read ON public.monitoramento_entidade_usuario_id_backup;\nDROP POLICY IF EXISTS costs_owner_full_access ON public.costs;\nDROP POLICY IF EXISTS costs_owner_full_access_userid ON public.costs;\nDROP POLICY IF EXISTS costs_admin_read ON public.costs;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_owner_full_access ON public.monitoramento_entidade_audit;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_owner_full_access_userid ON public.monitoramento_entidade_audit;\nDROP POLICY IF EXISTS monitoramento_entidade_audit_admin_read ON public.monitoramento_entidade_audit;\nDROP POLICY IF EXISTS monitoramento_entidade_owner_full_access ON public.monitoramento_entidade;\nDROP POLICY IF EXISTS monitoramento_entidade_owner_full_access_userid ON public.monitoramento_entidade;\nDROP POLICY IF EXISTS monitoramento_entidade_admin_read ON public.monitoramento_entidade;\nDROP POLICY IF EXISTS categorias_despesa_owner_full_access ON public.categorias_despesa;\nDROP POLICY IF EXISTS categorias_despesa_owner_full_access_userid ON public.categorias_despesa;\nDROP POLICY IF EXISTS categorias_despesa_admin_read ON public.categorias_despesa;\nCREATE TABLE IF NOT EXISTS public.users_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.users_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.users_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.movimentos_estoque_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.movimentos_estoque_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.movimentos_estoque_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.areas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.areas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.areas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.clientes_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.clientes_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.clientes_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.items_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.items_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.items_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.analise_ia_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.analise_ia_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.analise_ia_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.colheitas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.colheitas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.colheitas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.vendas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.vendas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.vendas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.compras_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.compras_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.compras_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.plantio_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.plantio_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.plantio_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.error_logs_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.error_logs_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.error_logs_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.profiles_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.profiles_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.profiles_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.custos_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.custos_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.custos_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.planos_adubacao_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.planos_adubacao_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.planos_adubacao_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.maquinas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.maquinas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.maquinas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.estoque_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.estoque_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.estoque_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.v2_produtores_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.v2_produtores_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.v2_produtores_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.v2_fazendas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.v2_fazendas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.v2_fazendas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.unidades_medida_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.unidades_medida_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.unidades_medida_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.monitoramento_media_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.monitoramento_media_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.monitoramento_media_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.receitas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.receitas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.receitas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.v2_talhoes_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.v2_talhoes_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.v2_talhoes_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.v2_colheitas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.v2_colheitas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.v2_colheitas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.activity_log_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.activity_log_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.activity_log_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.culturas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.culturas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.culturas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.app_settings_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.app_settings_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.app_settings_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.manutencao_frota_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.manutencao_frota_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.manutencao_frota_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.descarte_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.descarte_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.descarte_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.movimentacoes_financeiras_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.cost_categories_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.cost_categories_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.cost_categories_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.caderno_notas_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.caderno_notas_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.caderno_notas_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.costs_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.costs_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.costs_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_backup_copy_restore AS TABLE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145;\nDROP TABLE IF EXISTS public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145;\nCREATE TABLE IF NOT EXISTS public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.monitoramento_entidade_usuario_id_invalid_bak_20260315145520;\nCREATE TABLE IF NOT EXISTS public.categorias_despesa_usuario_id_invalid_bak_20260315145520_backup_copy_restore AS TABLE public.categorias_despesa_usuario_id_invalid_bak_20260315145520;\nDROP TABLE IF EXISTS public.categorias_despesa_usuario_id_invalid_bak_20260315145520;\n'),
	(2, '2026-03-15 15:28:35.65658+00', 'dropped_backup_tables_and_columns_20260315145520', 'dropped specific backup artifacts from run'),
	(6, '2026-03-16 01:17:14.871724+00', 'Error processing table activity_log: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(8, '2026-03-16 01:17:14.871724+00', 'Error processing table analise_ia: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(10, '2026-03-16 01:17:14.871724+00', 'Error processing table app_settings: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(12, '2026-03-16 01:17:14.871724+00', 'Error processing table areas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(14, '2026-03-16 01:17:14.871724+00', 'Error processing table caderno_notas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(16, '2026-03-16 01:17:14.871724+00', 'Error processing table categorias_despesa: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(18, '2026-03-16 01:17:14.871724+00', 'Error processing table clientes: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(20, '2026-03-16 01:17:14.871724+00', 'Error processing table colheitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(22, '2026-03-16 01:17:14.871724+00', 'Error processing table compras: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(24, '2026-03-16 01:17:14.871724+00', 'Error processing table cost_categories: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(26, '2026-03-16 01:17:14.871724+00', 'Error processing table costs: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(28, '2026-03-16 01:17:14.871724+00', 'Error processing table culturas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(30, '2026-03-16 01:17:14.871724+00', 'Error processing table custos: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(32, '2026-03-16 01:17:14.871724+00', 'Error processing table descarte: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(34, '2026-03-16 01:17:14.871724+00', 'Error processing table error_logs: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(36, '2026-03-16 01:17:14.871724+00', 'Error processing table estoque: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(38, '2026-03-16 01:17:14.871724+00', 'Error processing table items: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(40, '2026-03-16 01:17:14.871724+00', 'Error processing table manutencao_frota: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(42, '2026-03-16 01:17:14.871724+00', 'Error processing table maquinas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(44, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_entidade: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(46, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_entidade_audit: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(47, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145: relation "public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" does not exist', 'relation "public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" does not exist'),
	(49, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_entidade_usuario_id_backup: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(50, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak: relation "public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" does not exist', 'relation "public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" does not exist'),
	(52, '2026-03-16 01:17:14.871724+00', 'Error processing table monitoramento_media: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(54, '2026-03-16 01:17:14.871724+00', 'Error processing table movimentacoes_financeiras: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(56, '2026-03-16 01:17:14.871724+00', 'Error processing table movimentos_estoque: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(58, '2026-03-16 01:17:14.871724+00', 'Error processing table planos_adubacao: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(60, '2026-03-16 01:17:14.871724+00', 'Error processing table plantio: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(62, '2026-03-16 01:17:14.871724+00', 'Error processing table profiles: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(64, '2026-03-16 01:17:14.871724+00', 'Error processing table receitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(66, '2026-03-16 01:17:14.871724+00', 'Error processing table unidades_medida: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(68, '2026-03-16 01:17:14.871724+00', 'Error processing table users: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(70, '2026-03-16 01:17:14.871724+00', 'Error processing table usuario_id_quarantine: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(72, '2026-03-16 01:17:14.871724+00', 'Error processing table v2_colheitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(74, '2026-03-16 01:17:14.871724+00', 'Error processing table v2_fazendas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(76, '2026-03-16 01:17:14.871724+00', 'Error processing table v2_produtores: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(78, '2026-03-16 01:17:14.871724+00', 'Error processing table v2_talhoes: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(80, '2026-03-16 01:17:14.871724+00', 'Error processing table vendas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(81, '2026-03-16 01:17:14.871724+00', 'FK already exists activity_log_usuario_id_fkey on activity_log - skipped', 'skipped'),
	(82, '2026-03-16 01:17:14.871724+00', 'FK already exists analise_ia_usuario_id_fkey on analise_ia - skipped', 'skipped'),
	(83, '2026-03-16 01:17:14.871724+00', 'FK already exists app_settings_usuario_id_fkey on app_settings - skipped', 'skipped'),
	(84, '2026-03-16 01:17:14.871724+00', 'FK already exists areas_usuario_id_fkey on areas - skipped', 'skipped'),
	(85, '2026-03-16 01:17:14.871724+00', 'FK already exists caderno_notas_usuario_id_fkey on caderno_notas - skipped', 'skipped'),
	(86, '2026-03-16 01:17:14.871724+00', 'FK already exists categorias_despesa_usuario_id_fkey on categorias_despesa - skipped', 'skipped'),
	(87, '2026-03-16 01:17:14.871724+00', 'FK already exists clientes_usuario_id_fkey on clientes - skipped', 'skipped'),
	(88, '2026-03-16 01:17:14.871724+00', 'FK already exists colheitas_usuario_id_fkey on colheitas - skipped', 'skipped'),
	(89, '2026-03-16 01:17:14.871724+00', 'FK already exists compras_usuario_id_fkey on compras - skipped', 'skipped'),
	(90, '2026-03-16 01:17:14.871724+00', 'FK already exists cost_categories_usuario_id_fkey on cost_categories - skipped', 'skipped'),
	(91, '2026-03-16 01:17:14.871724+00', 'FK already exists costs_usuario_id_fkey on costs - skipped', 'skipped'),
	(92, '2026-03-16 01:17:14.871724+00', 'FK already exists culturas_usuario_id_fkey on culturas - skipped', 'skipped'),
	(93, '2026-03-16 01:17:14.871724+00', 'FK already exists custos_usuario_id_fkey on custos - skipped', 'skipped'),
	(94, '2026-03-16 01:17:14.871724+00', 'FK already exists descarte_usuario_id_fkey on descarte - skipped', 'skipped'),
	(95, '2026-03-16 01:17:14.871724+00', 'FK already exists error_logs_usuario_id_fkey on error_logs - skipped', 'skipped'),
	(96, '2026-03-16 01:17:14.871724+00', 'FK already exists estoque_usuario_id_fkey on estoque - skipped', 'skipped'),
	(97, '2026-03-16 01:17:14.871724+00', 'FK already exists items_usuario_id_fkey on items - skipped', 'skipped'),
	(98, '2026-03-16 01:17:14.871724+00', 'FK already exists manutencao_frota_usuario_id_fkey on manutencao_frota - skipped', 'skipped'),
	(99, '2026-03-16 01:17:14.871724+00', 'FK already exists maquinas_usuario_id_fkey on maquinas - skipped', 'skipped'),
	(100, '2026-03-16 01:17:14.871724+00', 'FK already exists monitoramento_entidade_usuario_id_fkey on monitoramento_entidade - skipped', 'skipped'),
	(101, '2026-03-16 01:17:14.871724+00', 'FK already exists monitoramento_entidade_audit_usuario_id_fkey on monitoramento_entidade_audit - skipped', 'skipped'),
	(102, '2026-03-16 01:17:14.871724+00', 'FK created monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_usuario_id_fkey for table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145', 'ALTER TABLE public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 ADD CONSTRAINT monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL;'),
	(103, '2026-03-16 01:17:14.871724+00', 'FK already exists monitoramento_entidade_usuario_id_backup_usuario_id_fkey on monitoramento_entidade_usuario_id_backup - skipped', 'skipped'),
	(104, '2026-03-16 01:17:14.871724+00', 'FK created monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_usuario_id_fkey for table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak', 'ALTER TABLE public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak ADD CONSTRAINT monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL;'),
	(105, '2026-03-16 01:17:14.871724+00', 'FK already exists monitoramento_media_usuario_id_fkey on monitoramento_media - skipped', 'skipped'),
	(106, '2026-03-16 01:17:14.871724+00', 'FK already exists movimentacoes_financeiras_usuario_id_fkey on movimentacoes_financeiras - skipped', 'skipped'),
	(107, '2026-03-16 01:17:14.871724+00', 'FK already exists movimentos_estoque_usuario_id_fkey on movimentos_estoque - skipped', 'skipped'),
	(108, '2026-03-16 01:17:14.871724+00', 'FK already exists planos_adubacao_usuario_id_fkey on planos_adubacao - skipped', 'skipped'),
	(109, '2026-03-16 01:17:14.871724+00', 'FK already exists plantio_usuario_id_fkey on plantio - skipped', 'skipped'),
	(110, '2026-03-16 01:17:14.871724+00', 'FK already exists profiles_usuario_id_fkey on profiles - skipped', 'skipped'),
	(111, '2026-03-16 01:17:14.871724+00', 'FK already exists receitas_usuario_id_fkey on receitas - skipped', 'skipped'),
	(112, '2026-03-16 01:17:14.871724+00', 'FK already exists unidades_medida_usuario_id_fkey on unidades_medida - skipped', 'skipped'),
	(113, '2026-03-16 01:17:14.871724+00', 'FK already exists users_usuario_id_fkey on users - skipped', 'skipped'),
	(114, '2026-03-16 01:17:14.871724+00', 'FK created usuario_id_quarantine_usuario_id_fkey for table usuario_id_quarantine', 'ALTER TABLE public.usuario_id_quarantine ADD CONSTRAINT usuario_id_quarantine_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE SET NULL;'),
	(115, '2026-03-16 01:17:14.871724+00', 'FK already exists v2_colheitas_usuario_id_fkey on v2_colheitas - skipped', 'skipped'),
	(116, '2026-03-16 01:17:14.871724+00', 'FK already exists v2_fazendas_usuario_id_fkey on v2_fazendas - skipped', 'skipped'),
	(117, '2026-03-16 01:17:14.871724+00', 'FK already exists v2_produtores_usuario_id_fkey on v2_produtores - skipped', 'skipped'),
	(118, '2026-03-16 01:17:14.871724+00', 'FK already exists v2_talhoes_usuario_id_fkey on v2_talhoes - skipped', 'skipped'),
	(119, '2026-03-16 01:17:14.871724+00', 'FK already exists vendas_usuario_id_fkey on vendas - skipped', 'skipped'),
	(120, '2026-03-16 01:17:14.871724+00', 'Created/updated admin_usuario_integrity_report after cleanup and FK creation', '
        SELECT
          ''activity_log''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.activity_log
       UNION ALL

        SELECT
          ''analise_ia''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.analise_ia
       UNION ALL

        SELECT
          ''app_settings''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.app_settings
       UNION ALL

        SELECT
          ''areas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.areas
       UNION ALL

        SELECT
          ''caderno_notas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.caderno_notas
       UNION ALL

        SELECT
          ''categorias_despesa''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.categorias_despesa
       UNION ALL

        SELECT
          ''clientes''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.clientes
       UNION ALL

        SELECT
          ''colheitas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.colheitas
       UNION ALL

        SELECT
          ''compras''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.compras
       UNION ALL

        SELECT
          ''cost_categories''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.cost_categories
       UNION ALL

        SELECT
          ''costs''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.costs
       UNION ALL

        SELECT
          ''culturas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.culturas
       UNION ALL

        SELECT
          ''custos''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.custos
       UNION ALL

        SELECT
          ''descarte''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.descarte
       UNION ALL

        SELECT
          ''error_logs''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.error_logs
       UNION ALL

        SELECT
          ''estoque''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.estoque
       UNION ALL

        SELECT
          ''items''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.items
       UNION ALL

        SELECT
          ''manutencao_frota''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.manutencao_frota
       UNION ALL

        SELECT
          ''maquinas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.maquinas
       UNION ALL

        SELECT
          ''monitoramento_entidade''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade
       UNION ALL

        SELECT
          ''monitoramento_entidade_audit''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_audit
       UNION ALL

        SELECT
          ''monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145
       UNION ALL

        SELECT
          ''monitoramento_entidade_usuario_id_backup''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_usuario_id_backup
       UNION ALL

        SELECT
          ''monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak
       UNION ALL

        SELECT
          ''monitoramento_media''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_media
       UNION ALL

        SELECT
          ''movimentacoes_financeiras''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.movimentacoes_financeiras
       UNION ALL

        SELECT
          ''movimentos_estoque''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.movimentos_estoque
       UNION ALL

        SELECT
          ''planos_adubacao''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.planos_adubacao
       UNION ALL

        SELECT
          ''plantio''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.plantio
       UNION ALL

        SELECT
          ''profiles''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.profiles
       UNION ALL

        SELECT
          ''receitas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.receitas
       UNION ALL

        SELECT
          ''unidades_medida''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.unidades_medida
       UNION ALL

        SELECT
          ''users''::text AS tab'),
	(121, '2026-03-16 01:17:14.871724+00', 'Process complete: backup, quarantine, cleanup and attempted FK creation finished', 'see previous schema_migrations entries for details'),
	(123, '2026-03-16 01:34:20.473825+00', 'Error processing table activity_log: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(125, '2026-03-16 01:34:20.473825+00', 'Error processing table analise_ia: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(127, '2026-03-16 01:34:20.473825+00', 'Error processing table app_settings: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(129, '2026-03-16 01:34:20.473825+00', 'Error processing table areas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(131, '2026-03-16 01:34:20.473825+00', 'Error processing table caderno_notas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(133, '2026-03-16 01:34:20.473825+00', 'Error processing table categorias_despesa: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(135, '2026-03-16 01:34:20.473825+00', 'Error processing table clientes: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(137, '2026-03-16 01:34:20.473825+00', 'Error processing table colheitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(139, '2026-03-16 01:34:20.473825+00', 'Error processing table compras: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(141, '2026-03-16 01:34:20.473825+00', 'Error processing table cost_categories: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(143, '2026-03-16 01:34:20.473825+00', 'Error processing table costs: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(145, '2026-03-16 01:34:20.473825+00', 'Error processing table culturas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(147, '2026-03-16 01:34:20.473825+00', 'Error processing table custos: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(149, '2026-03-16 01:34:20.473825+00', 'Error processing table descarte: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(151, '2026-03-16 01:34:20.473825+00', 'Error processing table error_logs: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(153, '2026-03-16 01:34:20.473825+00', 'Error processing table estoque: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(155, '2026-03-16 01:34:20.473825+00', 'Error processing table items: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(157, '2026-03-16 01:34:20.473825+00', 'Error processing table manutencao_frota: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(159, '2026-03-16 01:34:20.473825+00', 'Error processing table maquinas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(161, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_entidade: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(163, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_entidade_audit: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(164, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145: cannot drop table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 because other objects depend on it', 'cannot drop table monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145 because other objects depend on it'),
	(166, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_entidade_usuario_id_backup: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(167, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak: cannot drop table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak because other objects depend on it', 'cannot drop table monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak because other objects depend on it'),
	(169, '2026-03-16 01:34:20.473825+00', 'Error processing table monitoramento_media: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(171, '2026-03-16 01:34:20.473825+00', 'Error processing table movimentacoes_financeiras: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(173, '2026-03-16 01:34:20.473825+00', 'Error processing table movimentos_estoque: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(175, '2026-03-16 01:34:20.473825+00', 'Error processing table planos_adubacao: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(177, '2026-03-16 01:34:20.473825+00', 'Error processing table plantio: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(179, '2026-03-16 01:34:20.473825+00', 'Error processing table profiles: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(181, '2026-03-16 01:34:20.473825+00', 'Error processing table receitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(183, '2026-03-16 01:34:20.473825+00', 'Error processing table unidades_medida: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(185, '2026-03-16 01:34:20.473825+00', 'Error processing table users: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(187, '2026-03-16 01:34:20.473825+00', 'Error processing table usuario_id_quarantine: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(189, '2026-03-16 01:34:20.473825+00', 'Error processing table v2_colheitas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(191, '2026-03-16 01:34:20.473825+00', 'Error processing table v2_fazendas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(193, '2026-03-16 01:34:20.473825+00', 'Error processing table v2_produtores: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(195, '2026-03-16 01:34:20.473825+00', 'Error processing table v2_talhoes: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(197, '2026-03-16 01:34:20.473825+00', 'Error processing table vendas: unrecognized format() type specifier " "', 'unrecognized format() type specifier " "'),
	(198, '2026-03-16 01:34:20.473825+00', 'FK already exists activity_log_usuario_id_fkey on activity_log - skipped', 'skipped'),
	(199, '2026-03-16 01:34:20.473825+00', 'FK already exists analise_ia_usuario_id_fkey on analise_ia - skipped', 'skipped'),
	(200, '2026-03-16 01:34:20.473825+00', 'FK already exists app_settings_usuario_id_fkey on app_settings - skipped', 'skipped'),
	(201, '2026-03-16 01:34:20.473825+00', 'FK already exists areas_usuario_id_fkey on areas - skipped', 'skipped'),
	(202, '2026-03-16 01:34:20.473825+00', 'FK already exists caderno_notas_usuario_id_fkey on caderno_notas - skipped', 'skipped'),
	(203, '2026-03-16 01:34:20.473825+00', 'FK already exists categorias_despesa_usuario_id_fkey on categorias_despesa - skipped', 'skipped'),
	(204, '2026-03-16 01:34:20.473825+00', 'FK already exists clientes_usuario_id_fkey on clientes - skipped', 'skipped'),
	(205, '2026-03-16 01:34:20.473825+00', 'FK already exists colheitas_usuario_id_fkey on colheitas - skipped', 'skipped'),
	(206, '2026-03-16 01:34:20.473825+00', 'FK already exists compras_usuario_id_fkey on compras - skipped', 'skipped'),
	(207, '2026-03-16 01:34:20.473825+00', 'FK already exists cost_categories_usuario_id_fkey on cost_categories - skipped', 'skipped'),
	(208, '2026-03-16 01:34:20.473825+00', 'FK already exists costs_usuario_id_fkey on costs - skipped', 'skipped'),
	(209, '2026-03-16 01:34:20.473825+00', 'FK already exists culturas_usuario_id_fkey on culturas - skipped', 'skipped'),
	(210, '2026-03-16 01:34:20.473825+00', 'FK already exists custos_usuario_id_fkey on custos - skipped', 'skipped'),
	(211, '2026-03-16 01:34:20.473825+00', 'FK already exists descarte_usuario_id_fkey on descarte - skipped', 'skipped'),
	(212, '2026-03-16 01:34:20.473825+00', 'FK already exists error_logs_usuario_id_fkey on error_logs - skipped', 'skipped'),
	(213, '2026-03-16 01:34:20.473825+00', 'FK already exists estoque_usuario_id_fkey on estoque - skipped', 'skipped'),
	(214, '2026-03-16 01:34:20.473825+00', 'FK already exists items_usuario_id_fkey on items - skipped', 'skipped'),
	(215, '2026-03-16 01:34:20.473825+00', 'FK already exists manutencao_frota_usuario_id_fkey on manutencao_frota - skipped', 'skipped'),
	(216, '2026-03-16 01:34:20.473825+00', 'FK already exists maquinas_usuario_id_fkey on maquinas - skipped', 'skipped'),
	(217, '2026-03-16 01:34:20.473825+00', 'FK already exists monitoramento_entidade_usuario_id_fkey on monitoramento_entidade - skipped', 'skipped'),
	(218, '2026-03-16 01:34:20.473825+00', 'FK already exists monitoramento_entidade_audit_usuario_id_fkey on monitoramento_entidade_audit - skipped', 'skipped'),
	(219, '2026-03-16 01:34:20.473825+00', 'Error creating FK monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145_usuario_id_fkey on monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145: constraint "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" for relation "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" already exists', 'constraint "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" for relation "monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145" already exists'),
	(220, '2026-03-16 01:34:20.473825+00', 'FK already exists monitoramento_entidade_usuario_id_backup_usuario_id_fkey on monitoramento_entidade_usuario_id_backup - skipped', 'skipped'),
	(221, '2026-03-16 01:34:20.473825+00', 'Error creating FK monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak_usuario_id_fkey on monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak: constraint "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" for relation "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" already exists', 'constraint "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" for relation "monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak" already exists'),
	(222, '2026-03-16 01:34:20.473825+00', 'FK already exists monitoramento_media_usuario_id_fkey on monitoramento_media - skipped', 'skipped'),
	(223, '2026-03-16 01:34:20.473825+00', 'FK already exists movimentacoes_financeiras_usuario_id_fkey on movimentacoes_financeiras - skipped', 'skipped'),
	(224, '2026-03-16 01:34:20.473825+00', 'FK already exists movimentos_estoque_usuario_id_fkey on movimentos_estoque - skipped', 'skipped'),
	(225, '2026-03-16 01:34:20.473825+00', 'FK already exists planos_adubacao_usuario_id_fkey on planos_adubacao - skipped', 'skipped'),
	(226, '2026-03-16 01:34:20.473825+00', 'FK already exists plantio_usuario_id_fkey on plantio - skipped', 'skipped'),
	(227, '2026-03-16 01:34:20.473825+00', 'FK already exists profiles_usuario_id_fkey on profiles - skipped', 'skipped'),
	(228, '2026-03-16 01:34:20.473825+00', 'FK already exists receitas_usuario_id_fkey on receitas - skipped', 'skipped'),
	(229, '2026-03-16 01:34:20.473825+00', 'FK already exists unidades_medida_usuario_id_fkey on unidades_medida - skipped', 'skipped'),
	(230, '2026-03-16 01:34:20.473825+00', 'FK already exists users_usuario_id_fkey on users - skipped', 'skipped'),
	(231, '2026-03-16 01:34:20.473825+00', 'FK already exists usuario_id_quarantine_usuario_id_fkey on usuario_id_quarantine - skipped', 'skipped'),
	(232, '2026-03-16 01:34:20.473825+00', 'FK already exists v2_colheitas_usuario_id_fkey on v2_colheitas - skipped', 'skipped'),
	(233, '2026-03-16 01:34:20.473825+00', 'FK already exists v2_fazendas_usuario_id_fkey on v2_fazendas - skipped', 'skipped'),
	(234, '2026-03-16 01:34:20.473825+00', 'FK already exists v2_produtores_usuario_id_fkey on v2_produtores - skipped', 'skipped'),
	(235, '2026-03-16 01:34:20.473825+00', 'FK already exists v2_talhoes_usuario_id_fkey on v2_talhoes - skipped', 'skipped'),
	(236, '2026-03-16 01:34:20.473825+00', 'FK already exists vendas_usuario_id_fkey on vendas - skipped', 'skipped'),
	(237, '2026-03-16 01:34:20.473825+00', 'Created/updated admin_usuario_integrity_report after cleanup and FK creation', '
        SELECT
          ''activity_log''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.activity_log
       UNION ALL

        SELECT
          ''analise_ia''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.analise_ia
       UNION ALL

        SELECT
          ''app_settings''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.app_settings
       UNION ALL

        SELECT
          ''areas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.areas
       UNION ALL

        SELECT
          ''caderno_notas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.caderno_notas
       UNION ALL

        SELECT
          ''categorias_despesa''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.categorias_despesa
       UNION ALL

        SELECT
          ''clientes''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.clientes
       UNION ALL

        SELECT
          ''colheitas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.colheitas
       UNION ALL

        SELECT
          ''compras''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.compras
       UNION ALL

        SELECT
          ''cost_categories''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.cost_categories
       UNION ALL

        SELECT
          ''costs''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.costs
       UNION ALL

        SELECT
          ''culturas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.culturas
       UNION ALL

        SELECT
          ''custos''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.custos
       UNION ALL

        SELECT
          ''descarte''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.descarte
       UNION ALL

        SELECT
          ''error_logs''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.error_logs
       UNION ALL

        SELECT
          ''estoque''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.estoque
       UNION ALL

        SELECT
          ''items''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.items
       UNION ALL

        SELECT
          ''manutencao_frota''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.manutencao_frota
       UNION ALL

        SELECT
          ''maquinas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.maquinas
       UNION ALL

        SELECT
          ''monitoramento_entidade''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade
       UNION ALL

        SELECT
          ''monitoramento_entidade_audit''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_audit
       UNION ALL

        SELECT
          ''monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_audit_usuario_id_invalid_bak_20260315145
       UNION ALL

        SELECT
          ''monitoramento_entidade_usuario_id_backup''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_usuario_id_backup
       UNION ALL

        SELECT
          ''monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_entidade_usuario_id_backup_usuario_id_invalid_bak
       UNION ALL

        SELECT
          ''monitoramento_media''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.monitoramento_media
       UNION ALL

        SELECT
          ''movimentacoes_financeiras''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.movimentacoes_financeiras
       UNION ALL

        SELECT
          ''movimentos_estoque''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.movimentos_estoque
       UNION ALL

        SELECT
          ''planos_adubacao''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.planos_adubacao
       UNION ALL

        SELECT
          ''plantio''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.plantio
       UNION ALL

        SELECT
          ''profiles''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.profiles
       UNION ALL

        SELECT
          ''receitas''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
        FROM public.receitas
       UNION ALL

        SELECT
          ''unidades_medida''::text AS table_name,
          COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
          COUNT(*) FILTER (WHERE'),
	(238, '2026-03-16 01:34:20.473825+00', 'Process complete: backup, quarantine, cleanup and attempted FK creation finished', 'see previous schema_migrations entries for details');


--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: usuario_id_quarantine; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_produtores; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_fazendas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_talhoes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_analise_solo; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_colheitas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_custos; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_movimentacoes_estoque; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_plantios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_recomendacoes_tecnicas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_sync_conflicts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: v2_vendas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: vendas; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('agrogb-backups', 'agrogb-backups', NULL, '2026-03-07 10:28:42.527075+00', '2026-03-07 10:28:42.527075+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('backups do agrogb', 'backups do agrogb', NULL, '2026-03-09 02:04:47.964389+00', '2026-03-09 02:04:47.964389+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('agro-media', 'agro-media', NULL, '2026-03-15 12:03:52.601509+00', '2026-03-15 12:03:52.601509+00', false, false, NULL, NULL, NULL, 'STANDARD');


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 20, true);


--
-- Name: movimentacoes_financeiras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."movimentacoes_financeiras_id_seq"', 1, false);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."schema_migrations_id_seq"', 238, true);


--
-- Name: usuario_id_quarantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."usuario_id_quarantine_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict losFts6lLJmE0zLwrELUUdySb4yO91twFVIyUdyfaE0vVuRhYFi3Kzh40aS44Ha

RESET ALL;
