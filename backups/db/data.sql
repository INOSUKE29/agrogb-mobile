SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict bqWsDmyW5Rxyhf8dt4yhm2njtbu6y4TEwnn2WuFhclETk87meCaKYHKPLdtlu5m

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
	('00000000-0000-0000-0000-000000000000', '405ea0d8-d937-4973-b6ae-23aac96f1b87', 'authenticated', 'authenticated', 'brunower2009@gmail.com', '$2a$10$2pLOkir68K.G9gZBkV3tR.Wwoc4kdm8iPF7WP/RtceaqxiIZDwrBm', '2026-03-25 23:33:17.828827+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-06 20:59:09.54381+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "405ea0d8-d937-4973-b6ae-23aac96f1b87", "email": "brunower2009@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-03-25 23:33:17.824022+00', '2026-04-07 06:17:36.403987+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('405ea0d8-d937-4973-b6ae-23aac96f1b87', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '{"sub": "405ea0d8-d937-4973-b6ae-23aac96f1b87", "email": "brunower2009@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2026-03-25 23:33:17.826685+00', '2026-03-25 23:33:17.82673+00', '2026-03-25 23:33:17.82673+00', 'd0ffb25f-7e47-4ff9-b6eb-efb1e3dd4635');


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
	('4879ce3d-26e6-4aaf-9302-529fa0163d9b', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-03 17:26:19.559288+00', '2026-04-04 00:53:50.572554+00', NULL, 'aal1', NULL, '2026-04-04 00:53:50.572443', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('8050fafb-0975-4069-afc0-8ee28c0c0cbd', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-25 23:33:17.83129+00', '2026-03-25 23:33:17.83129+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('d9c97caf-7765-4fb5-a8c1-301c4ea3e627', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-25 23:33:32.586322+00', '2026-03-25 23:33:32.586322+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('38aa64b0-bd39-461e-959c-e00fe2b9f3e8', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-25 23:51:32.165642+00', '2026-03-25 23:51:32.165642+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('c42ac845-22c6-4c49-b3aa-8a4d57e0e992', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-25 23:55:24.497769+00', '2026-03-26 23:24:26.066436+00', NULL, 'aal1', NULL, '2026-03-26 23:24:26.064681', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('400c2cb6-111d-4272-a54d-59336dc1c2d7', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-26 23:24:41.04498+00', '2026-03-26 23:24:41.04498+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('63889278-501e-4f5c-831c-fafacdb0fb92', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 00:09:05.119456+00', '2026-03-27 00:09:05.119456+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('d3ddaa96-55e9-4c51-b5b2-ee9f004dce84', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 00:10:21.803263+00', '2026-03-27 00:10:21.803263+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('155a7327-fcde-4fb6-bd5c-096c3d16f2b5', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 07:32:45.120733+00', '2026-03-27 07:32:45.120733+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('4e885970-bafc-468f-a9ea-b1b765ef49cd', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 08:54:13.245144+00', '2026-03-27 08:54:13.245144+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('20fb76bc-cfe7-42b3-8690-dc85297c3e00', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 10:58:22.167303+00', '2026-03-27 10:58:22.167303+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.212.133', NULL, NULL, NULL, NULL, NULL),
	('06b22165-5a28-4f18-a493-60e98ff5afb8', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-27 11:05:33.553541+00', '2026-03-27 13:06:36.821005+00', NULL, 'aal1', NULL, '2026-03-27 13:06:36.820884', 'okhttp/4.9.2', '186.193.212.133', NULL, NULL, NULL, NULL, NULL),
	('07fcdbd3-ccf9-4885-a6de-239f47bb8365', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-28 22:31:13.119596+00', '2026-03-28 22:31:13.119596+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('a7738ef9-a7b0-4e58-be14-f10c4516e9e0', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-28 22:59:47.642375+00', '2026-03-28 22:59:47.642375+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('caf3321b-1608-4b7c-ba1f-9d4d0e831e38', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-28 23:11:51.281776+00', '2026-03-29 08:40:53.468052+00', NULL, 'aal1', NULL, '2026-03-29 08:40:53.467938', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('5b85ffba-49c7-4c36-8d3c-721a945da8f6', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-29 20:40:31.338442+00', '2026-03-29 21:50:24.420232+00', NULL, 'aal1', NULL, '2026-03-29 21:50:24.420123', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('35927dac-7fa5-4e78-9ba4-8f48a47c588e', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-29 21:57:27.226597+00', '2026-03-29 21:57:27.226597+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('5a87a8d6-caf9-439d-b4bc-6d941e81b418', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-29 22:46:12.050832+00', '2026-03-29 22:46:12.050832+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('a1840fd2-cec7-4d01-ae46-2aa339781efc', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-29 23:35:37.725993+00', '2026-03-29 23:35:37.725993+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('80998024-b8d9-4fe9-8313-11e168c76090', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-04 19:00:38.824694+00', '2026-04-04 21:06:31.216407+00', NULL, 'aal1', NULL, '2026-04-04 21:06:31.216298', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('a424edb3-de92-42bf-896a-e2e6b089781c', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-03-30 16:55:19.66004+00', '2026-04-01 09:32:01.043847+00', NULL, 'aal1', NULL, '2026-04-01 09:32:01.043205', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('77973c34-5e8b-4c11-98ad-352dd4496e31', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-01 12:19:36.198704+00', '2026-04-01 12:19:36.198704+00', NULL, 'aal1', NULL, NULL, 'okhttp/4.9.2', '186.193.212.133', NULL, NULL, NULL, NULL, NULL),
	('4c6e61bc-85e1-49f5-bbb4-0548c19f2c62', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-05 17:25:19.261821+00', '2026-04-05 20:43:28.616743+00', NULL, 'aal1', NULL, '2026-04-05 20:43:28.616652', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('9deb1527-968c-4a7d-bb5c-536bde0c1efa', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-06 09:59:45.49392+00', '2026-04-06 10:58:29.017575+00', NULL, 'aal1', NULL, '2026-04-06 10:58:29.017471', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('08365e96-de84-443f-ae41-4887f62b13d5', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-06 11:35:30.909671+00', '2026-04-06 11:35:30.909671+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('399cafc5-b50b-47a0-946d-a878b740cbb1', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-06 20:59:09.543936+00', '2026-04-06 22:51:44.206062+00', NULL, 'aal1', NULL, '2026-04-06 22:51:44.205952', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('49381fc3-53d5-4cac-a86d-df678a34d983', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-05 11:55:23.303649+00', '2026-04-07 06:17:36.425539+00', NULL, 'aal1', NULL, '2026-04-07 06:17:36.425428', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL),
	('eb9938c2-3bf7-4da3-890f-fb5f46243ac0', '405ea0d8-d937-4973-b6ae-23aac96f1b87', '2026-04-02 09:46:20.915402+00', '2026-04-07 19:51:34.638795+00', NULL, 'aal1', NULL, '2026-04-07 19:51:34.638679', 'okhttp/4.9.2', '186.193.211.229', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('8050fafb-0975-4069-afc0-8ee28c0c0cbd', '2026-03-25 23:33:17.833738+00', '2026-03-25 23:33:17.833738+00', 'password', '2ad15dac-bccf-491c-88fb-79752b139e6d'),
	('d9c97caf-7765-4fb5-a8c1-301c4ea3e627', '2026-03-25 23:33:32.58888+00', '2026-03-25 23:33:32.58888+00', 'password', '5a28d1bb-52a3-4f60-856d-3b36d30f155c'),
	('38aa64b0-bd39-461e-959c-e00fe2b9f3e8', '2026-03-25 23:51:32.228586+00', '2026-03-25 23:51:32.228586+00', 'password', 'a908e624-1754-454d-8dcc-bc26dacc601d'),
	('c42ac845-22c6-4c49-b3aa-8a4d57e0e992', '2026-03-25 23:55:24.538269+00', '2026-03-25 23:55:24.538269+00', 'password', '5b2ba24a-3996-4434-b931-73dc1e8c6737'),
	('400c2cb6-111d-4272-a54d-59336dc1c2d7', '2026-03-26 23:24:41.066794+00', '2026-03-26 23:24:41.066794+00', 'password', '3f3ab4a2-943f-4eb1-a941-35a6ead6bc0b'),
	('63889278-501e-4f5c-831c-fafacdb0fb92', '2026-03-27 00:09:05.184973+00', '2026-03-27 00:09:05.184973+00', 'password', 'fef00214-3e9d-415e-9150-4ba5dc0d1a05'),
	('d3ddaa96-55e9-4c51-b5b2-ee9f004dce84', '2026-03-27 00:10:21.81325+00', '2026-03-27 00:10:21.81325+00', 'password', '930f39fc-9304-4a7f-9b0b-df819df09ed9'),
	('155a7327-fcde-4fb6-bd5c-096c3d16f2b5', '2026-03-27 07:32:45.207691+00', '2026-03-27 07:32:45.207691+00', 'password', '77e40d77-29c5-43ba-aa59-5d54541a7374'),
	('4e885970-bafc-468f-a9ea-b1b765ef49cd', '2026-03-27 08:54:13.331411+00', '2026-03-27 08:54:13.331411+00', 'password', '6b5a0b66-5250-4ff0-97b3-4fdd42287884'),
	('20fb76bc-cfe7-42b3-8690-dc85297c3e00', '2026-03-27 10:58:22.262488+00', '2026-03-27 10:58:22.262488+00', 'password', 'b0f92850-5ac4-4512-88fa-964c95c0cad3'),
	('06b22165-5a28-4f18-a493-60e98ff5afb8', '2026-03-27 11:05:33.600866+00', '2026-03-27 11:05:33.600866+00', 'password', '469c1a75-1677-4935-be09-289b4a6d0593'),
	('07fcdbd3-ccf9-4885-a6de-239f47bb8365', '2026-03-28 22:31:13.230423+00', '2026-03-28 22:31:13.230423+00', 'password', '02f69c11-15fa-4b2d-ac0f-f94db1256d73'),
	('a7738ef9-a7b0-4e58-be14-f10c4516e9e0', '2026-03-28 22:59:47.712582+00', '2026-03-28 22:59:47.712582+00', 'password', 'a530285f-64c5-44f4-a5ef-6a88e1a8fff3'),
	('caf3321b-1608-4b7c-ba1f-9d4d0e831e38', '2026-03-28 23:11:51.317476+00', '2026-03-28 23:11:51.317476+00', 'password', '1f780a19-7a73-4d16-86a4-f7f786b3f354'),
	('5b85ffba-49c7-4c36-8d3c-721a945da8f6', '2026-03-29 20:40:31.44669+00', '2026-03-29 20:40:31.44669+00', 'password', '3233a3dd-50f3-456c-ae99-4bfd5adcbac5'),
	('35927dac-7fa5-4e78-9ba4-8f48a47c588e', '2026-03-29 21:57:27.286023+00', '2026-03-29 21:57:27.286023+00', 'password', '3139740c-c0e8-4ed9-85ef-19206a16e0b3'),
	('5a87a8d6-caf9-439d-b4bc-6d941e81b418', '2026-03-29 22:46:12.099643+00', '2026-03-29 22:46:12.099643+00', 'password', '9c6f835d-df54-46b3-acea-41768844fa25'),
	('a1840fd2-cec7-4d01-ae46-2aa339781efc', '2026-03-29 23:35:37.780853+00', '2026-03-29 23:35:37.780853+00', 'password', 'f65c7d26-abc2-481a-aa11-6cb17ab2247e'),
	('a424edb3-de92-42bf-896a-e2e6b089781c', '2026-03-30 16:55:19.766139+00', '2026-03-30 16:55:19.766139+00', 'password', '7bc6c9b4-0575-4c07-b64b-a2af9b6d4c92'),
	('77973c34-5e8b-4c11-98ad-352dd4496e31', '2026-04-01 12:19:36.272172+00', '2026-04-01 12:19:36.272172+00', 'password', '4d710228-b2ad-4f5a-8c88-800ce67f9ed2'),
	('eb9938c2-3bf7-4da3-890f-fb5f46243ac0', '2026-04-02 09:46:20.965065+00', '2026-04-02 09:46:20.965065+00', 'password', '90970b8f-2fef-4414-982c-944c8f0ad985'),
	('4879ce3d-26e6-4aaf-9302-529fa0163d9b', '2026-04-03 17:26:19.65947+00', '2026-04-03 17:26:19.65947+00', 'password', '401c2048-9ed3-4ac9-bd3e-1b3553304715'),
	('80998024-b8d9-4fe9-8313-11e168c76090', '2026-04-04 19:00:38.84152+00', '2026-04-04 19:00:38.84152+00', 'password', '9d1d1704-1a57-46d1-83b6-f3bd9172b0c3'),
	('49381fc3-53d5-4cac-a86d-df678a34d983', '2026-04-05 11:55:23.401441+00', '2026-04-05 11:55:23.401441+00', 'password', 'a769230e-dfa8-4553-8a8a-7f02d467a7e7'),
	('4c6e61bc-85e1-49f5-bbb4-0548c19f2c62', '2026-04-05 17:25:19.310781+00', '2026-04-05 17:25:19.310781+00', 'password', '5e1e7ef0-d6b5-4b97-88bf-e76c2d1fc090'),
	('9deb1527-968c-4a7d-bb5c-536bde0c1efa', '2026-04-06 09:59:45.590602+00', '2026-04-06 09:59:45.590602+00', 'password', 'fe75c1c2-4e9f-4ae5-9f4e-a603e8ce42a2'),
	('08365e96-de84-443f-ae41-4887f62b13d5', '2026-04-06 11:35:30.97508+00', '2026-04-06 11:35:30.97508+00', 'password', '1889d6fb-0633-40ba-a8df-b13a731eeccd'),
	('399cafc5-b50b-47a0-946d-a878b740cbb1', '2026-04-06 20:59:09.599413+00', '2026-04-06 20:59:09.599413+00', 'password', 'e21adbd7-1b5f-463c-abeb-d31b2ee438a1');


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

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 29, 'zi3c24suxgop', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-25 23:33:17.832301+00', '2026-03-25 23:33:17.832301+00', NULL, '8050fafb-0975-4069-afc0-8ee28c0c0cbd'),
	('00000000-0000-0000-0000-000000000000', 30, 'kyk5w3zei2v7', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-25 23:33:32.587565+00', '2026-03-25 23:33:32.587565+00', NULL, 'd9c97caf-7765-4fb5-a8c1-301c4ea3e627'),
	('00000000-0000-0000-0000-000000000000', 31, 'a4vvcxuuagqf', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-25 23:51:32.199618+00', '2026-03-25 23:51:32.199618+00', NULL, '38aa64b0-bd39-461e-959c-e00fe2b9f3e8'),
	('00000000-0000-0000-0000-000000000000', 32, 'tvh2vw2mfuf6', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-25 23:55:24.522219+00', '2026-03-26 08:33:29.563607+00', NULL, 'c42ac845-22c6-4c49-b3aa-8a4d57e0e992'),
	('00000000-0000-0000-0000-000000000000', 33, '4b2ehtebcrb2', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-26 08:33:29.604139+00', '2026-03-26 23:24:26.028374+00', 'tvh2vw2mfuf6', 'c42ac845-22c6-4c49-b3aa-8a4d57e0e992'),
	('00000000-0000-0000-0000-000000000000', 34, 'a56rzuo7yiea', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-26 23:24:26.041335+00', '2026-03-26 23:24:26.041335+00', '4b2ehtebcrb2', 'c42ac845-22c6-4c49-b3aa-8a4d57e0e992'),
	('00000000-0000-0000-0000-000000000000', 35, 'wbidwz5m4ml4', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-26 23:24:41.060405+00', '2026-03-26 23:24:41.060405+00', NULL, '400c2cb6-111d-4272-a54d-59336dc1c2d7'),
	('00000000-0000-0000-0000-000000000000', 36, 'r4w5gibcvnxl', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 00:09:05.156336+00', '2026-03-27 00:09:05.156336+00', NULL, '63889278-501e-4f5c-831c-fafacdb0fb92'),
	('00000000-0000-0000-0000-000000000000', 37, 'ekyoyaf3mond', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 00:10:21.808137+00', '2026-03-27 00:10:21.808137+00', NULL, 'd3ddaa96-55e9-4c51-b5b2-ee9f004dce84'),
	('00000000-0000-0000-0000-000000000000', 38, 'ydv6eqa5vlby', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 07:32:45.16415+00', '2026-03-27 07:32:45.16415+00', NULL, '155a7327-fcde-4fb6-bd5c-096c3d16f2b5'),
	('00000000-0000-0000-0000-000000000000', 39, 'qtrwuzpdwaec', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 08:54:13.289568+00', '2026-03-27 08:54:13.289568+00', NULL, '4e885970-bafc-468f-a9ea-b1b765ef49cd'),
	('00000000-0000-0000-0000-000000000000', 40, 'mzuplphfsvme', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 10:58:22.214382+00', '2026-03-27 10:58:22.214382+00', NULL, '20fb76bc-cfe7-42b3-8690-dc85297c3e00'),
	('00000000-0000-0000-0000-000000000000', 41, '5oqii5ijsd5m', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-27 11:05:33.582057+00', '2026-03-27 13:06:36.751525+00', NULL, '06b22165-5a28-4f18-a493-60e98ff5afb8'),
	('00000000-0000-0000-0000-000000000000', 42, 'kqnw6ky2pm6y', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-27 13:06:36.777019+00', '2026-03-27 13:06:36.777019+00', '5oqii5ijsd5m', '06b22165-5a28-4f18-a493-60e98ff5afb8'),
	('00000000-0000-0000-0000-000000000000', 43, 'puv353jy42o3', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-28 22:31:13.174139+00', '2026-03-28 22:31:13.174139+00', NULL, '07fcdbd3-ccf9-4885-a6de-239f47bb8365'),
	('00000000-0000-0000-0000-000000000000', 44, 'w6ld5xcfxr4t', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-28 22:59:47.683954+00', '2026-03-28 22:59:47.683954+00', NULL, 'a7738ef9-a7b0-4e58-be14-f10c4516e9e0'),
	('00000000-0000-0000-0000-000000000000', 45, 'oulgkwkbhj6p', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-28 23:11:51.302198+00', '2026-03-29 08:40:53.378785+00', NULL, 'caf3321b-1608-4b7c-ba1f-9d4d0e831e38'),
	('00000000-0000-0000-0000-000000000000', 46, 'j4oughefavb2', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-29 08:40:53.418419+00', '2026-03-29 08:40:53.418419+00', 'oulgkwkbhj6p', 'caf3321b-1608-4b7c-ba1f-9d4d0e831e38'),
	('00000000-0000-0000-0000-000000000000', 47, 'obcztboovjya', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-29 20:40:31.397021+00', '2026-03-29 21:50:24.360527+00', NULL, '5b85ffba-49c7-4c36-8d3c-721a945da8f6'),
	('00000000-0000-0000-0000-000000000000', 48, '4aqgx37f3anw', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-29 21:50:24.388323+00', '2026-03-29 21:50:24.388323+00', 'obcztboovjya', '5b85ffba-49c7-4c36-8d3c-721a945da8f6'),
	('00000000-0000-0000-0000-000000000000', 49, '26ob3kno42gq', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-29 21:57:27.260645+00', '2026-03-29 21:57:27.260645+00', NULL, '35927dac-7fa5-4e78-9ba4-8f48a47c588e'),
	('00000000-0000-0000-0000-000000000000', 50, 'h35mdsrjklyr', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-29 22:46:12.078578+00', '2026-03-29 22:46:12.078578+00', NULL, '5a87a8d6-caf9-439d-b4bc-6d941e81b418'),
	('00000000-0000-0000-0000-000000000000', 51, 'od5w6stf4mf7', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-03-29 23:35:37.759513+00', '2026-03-29 23:35:37.759513+00', NULL, 'a1840fd2-cec7-4d01-ae46-2aa339781efc'),
	('00000000-0000-0000-0000-000000000000', 52, 'me5ze2fsxphi', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-03-30 16:55:19.713867+00', '2026-04-01 02:37:18.534779+00', NULL, 'a424edb3-de92-42bf-896a-e2e6b089781c'),
	('00000000-0000-0000-0000-000000000000', 53, 'ntt26tfmrdsd', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-01 02:37:18.570678+00', '2026-04-01 09:32:00.968288+00', 'me5ze2fsxphi', 'a424edb3-de92-42bf-896a-e2e6b089781c'),
	('00000000-0000-0000-0000-000000000000', 54, '7erui54fwycj', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-01 09:32:01.00354+00', '2026-04-01 11:58:22.329231+00', 'ntt26tfmrdsd', 'a424edb3-de92-42bf-896a-e2e6b089781c'),
	('00000000-0000-0000-0000-000000000000', 55, 'pprh7nwle3pr', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-01 12:19:36.247741+00', '2026-04-01 12:19:36.247741+00', NULL, '77973c34-5e8b-4c11-98ad-352dd4496e31'),
	('00000000-0000-0000-0000-000000000000', 56, '3w6bqcvz3qq2', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-02 09:46:20.939937+00', '2026-04-02 10:59:25.64105+00', NULL, 'eb9938c2-3bf7-4da3-890f-fb5f46243ac0'),
	('00000000-0000-0000-0000-000000000000', 58, 'hyxpfe3y2duf', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-03 17:26:19.609262+00', '2026-04-03 20:36:54.451736+00', NULL, '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 59, 'yzisizyinkaz', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-03 20:36:54.486263+00', '2026-04-03 21:37:47.826422+00', 'hyxpfe3y2duf', '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 60, 'bnlyxjzd3ibc', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-03 21:37:47.842773+00', '2026-04-03 22:52:07.745867+00', 'yzisizyinkaz', '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 61, '5h2dfxrrwtvk', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-03 22:52:07.763848+00', '2026-04-03 23:53:27.312841+00', 'bnlyxjzd3ibc', '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 62, 'l5gndx3lxlou', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-03 23:53:27.326384+00', '2026-04-04 00:53:50.526024+00', '5h2dfxrrwtvk', '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 63, 'ubxwdc5famrc', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-04 00:53:50.547967+00', '2026-04-04 00:53:50.547967+00', 'l5gndx3lxlou', '4879ce3d-26e6-4aaf-9302-529fa0163d9b'),
	('00000000-0000-0000-0000-000000000000', 57, 'hgtkd7hox5mz', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-02 10:59:25.677289+00', '2026-04-04 18:59:13.062354+00', '3w6bqcvz3qq2', 'eb9938c2-3bf7-4da3-890f-fb5f46243ac0'),
	('00000000-0000-0000-0000-000000000000', 64, 'bonurphumbeq', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-04 18:59:13.101687+00', '2026-04-04 18:59:13.101687+00', 'hgtkd7hox5mz', 'eb9938c2-3bf7-4da3-890f-fb5f46243ac0'),
	('00000000-0000-0000-0000-000000000000', 65, 'pazhzfh6unsr', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-04 19:00:38.839056+00', '2026-04-04 20:01:34.981837+00', NULL, '80998024-b8d9-4fe9-8313-11e168c76090'),
	('00000000-0000-0000-0000-000000000000', 66, '26k3pyrezytq', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-04 20:01:34.996605+00', '2026-04-04 21:06:31.172707+00', 'pazhzfh6unsr', '80998024-b8d9-4fe9-8313-11e168c76090'),
	('00000000-0000-0000-0000-000000000000', 67, 'k4viponrmtcu', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-04 21:06:31.191842+00', '2026-04-04 21:06:31.191842+00', '26k3pyrezytq', '80998024-b8d9-4fe9-8313-11e168c76090'),
	('00000000-0000-0000-0000-000000000000', 69, 'v4kpyyscdndo', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-05 17:25:19.294783+00', '2026-04-05 18:28:27.806974+00', NULL, '4c6e61bc-85e1-49f5-bbb4-0548c19f2c62'),
	('00000000-0000-0000-0000-000000000000', 70, 'htc32wzwin5h', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-05 18:28:27.832149+00', '2026-04-05 19:32:18.601038+00', 'v4kpyyscdndo', '4c6e61bc-85e1-49f5-bbb4-0548c19f2c62'),
	('00000000-0000-0000-0000-000000000000', 71, 'jolv4jnii7qi', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-05 19:32:18.617171+00', '2026-04-05 20:43:27.374408+00', 'htc32wzwin5h', '4c6e61bc-85e1-49f5-bbb4-0548c19f2c62'),
	('00000000-0000-0000-0000-000000000000', 72, 'p47nn3oq3tko', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-05 20:43:27.393839+00', '2026-04-05 20:43:27.393839+00', 'jolv4jnii7qi', '4c6e61bc-85e1-49f5-bbb4-0548c19f2c62'),
	('00000000-0000-0000-0000-000000000000', 73, 'oqwsokqeiu6a', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-06 09:59:45.541607+00', '2026-04-06 10:58:28.956077+00', NULL, '9deb1527-968c-4a7d-bb5c-536bde0c1efa'),
	('00000000-0000-0000-0000-000000000000', 74, '5jghgfjz4lgh', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-06 10:58:28.989494+00', '2026-04-06 10:58:28.989494+00', 'oqwsokqeiu6a', '9deb1527-968c-4a7d-bb5c-536bde0c1efa'),
	('00000000-0000-0000-0000-000000000000', 75, '2xzwtf2lsflg', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-06 11:35:30.947201+00', '2026-04-06 11:35:30.947201+00', NULL, '08365e96-de84-443f-ae41-4887f62b13d5'),
	('00000000-0000-0000-0000-000000000000', 76, 'am5vsr4ewfs4', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-06 20:59:09.574487+00', '2026-04-06 22:51:44.169233+00', NULL, '399cafc5-b50b-47a0-946d-a878b740cbb1'),
	('00000000-0000-0000-0000-000000000000', 77, 'vxg7b4jobswt', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-06 22:51:44.188654+00', '2026-04-06 22:51:44.188654+00', 'am5vsr4ewfs4', '399cafc5-b50b-47a0-946d-a878b740cbb1'),
	('00000000-0000-0000-0000-000000000000', 68, 's47ufraygmiq', '405ea0d8-d937-4973-b6ae-23aac96f1b87', true, '2026-04-05 11:55:23.354253+00', '2026-04-07 06:17:36.354888+00', NULL, '49381fc3-53d5-4cac-a86d-df678a34d983'),
	('00000000-0000-0000-0000-000000000000', 78, 'b7at5r5xgibx', '405ea0d8-d937-4973-b6ae-23aac96f1b87', false, '2026-04-07 06:17:36.385+00', '2026-04-07 06:17:36.385+00', 's47ufraygmiq', '49381fc3-53d5-4cac-a86d-df678a34d983');


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
-- Data for Name: cadastro; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cadastro" ("uuid", "user_id", "nome", "unidade", "tipo", "observacao", "estocavel", "vendavel", "fator_conversao", "preco_venda", "last_updated", "is_deleted", "categoria", "farm_id") VALUES
	('d556b9df-2c78-4b50-8660-7aa40df99ece', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'INSUMO', 'fazenda_padrao'),
	('a4da9694-a61f-41db-a26f-36472254c93c', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'INSUMO', 'fazenda_padrao'),
	('2e66a0e7-6cea-444a-802f-0e892ac13a23', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:06:52.611646+00', 0, 'SEMENTE', 'fazenda_padrao'),
	('497d7c68-0c2f-4620-bd29-fc9a28b179b8', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'INSUMO', 'fazenda_padrao'),
	('0a9259c4-8de1-4ddc-a3a3-59f3941d60b5', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'INSUMO', 'fazenda_padrao'),
	('65496cf6-c419-4841-8f82-07f9380a8bad', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:09:02.57158+00', 0, 'SEMENTE', 'fazenda_padrao'),
	('9748d9a5-9292-4909-abba-228894b0f3d5', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'INSUMO', 'fazenda_padrao'),
	('c901c8c4-b77f-415f-a6c5-b51ee4697d05', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'INSUMO', 'fazenda_padrao'),
	('66e81b6b-fd96-4239-9252-b8a0053eab57', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-03-24 00:11:25.838525+00', 0, 'SEMENTE', 'fazenda_padrao'),
	('ce0a3a8c-c2f7-4dc6-bc4a-bf63f13e5d30', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 22:35:51.025997+00', 0, 'INSUMO', 'fazenda_padrao'),
	('e81e1d2d-da0c-4d32-b6db-b26c5d22be3a', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 22:35:51.025997+00', 0, 'INSUMO', 'fazenda_padrao'),
	('9b1de500-86a4-4b5b-9328-bd6f7fc5a4d7', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 22:35:51.025997+00', 0, 'SEMENTE', 'fazenda_padrao'),
	('746fbfc6-8af0-47bb-8085-24ccd79a6c2b', NULL, 'Fertilizante NPK 10-10-10', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 23:04:22.066463+00', 0, 'INSUMO', 'fazenda_padrao'),
	('138d4aa2-ee02-41d2-bef8-2a37cd22f855', NULL, 'Ureia Agrícola', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 23:04:22.066463+00', 0, 'INSUMO', 'fazenda_padrao'),
	('801a934c-54cc-4927-8470-3a27af41e929', NULL, 'Semente de Milho Tradicional', 'KG', NULL, NULL, 1, 1, 1, 0, '2026-04-06 23:04:22.066463+00', 0, 'SEMENTE', 'fazenda_padrao');


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

INSERT INTO "public"."culturas" ("id", "uuid", "nome", "observacao", "created_at", "last_updated", "is_deleted", "usuario_id_bak_20260315145412", "is_deleted_bool", "usuario_id", "farm_id") VALUES
	('43d79ab6-b007-48c8-8bbe-971b435d1999', '1e455d23-c2f4-4c24-ba41-ffdc252c7b3d', 'MILHO', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao'),
	('42289112-73a5-4060-8955-ff6823abd5b2', '25314468-574b-4c27-8498-fb5d67646240', 'SOJA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao'),
	('9c39b74d-d843-48b4-8e55-c1f9f13e9dcf', 'eb7dd9b3-49fd-46d7-89e8-d24b23c3a66c', 'COVE', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao'),
	('5677f411-faf2-486a-be2d-93e1790b2cce', '5012f28d-f38a-46e0-b7cd-d9fd69c45a75', 'CEBOLA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao'),
	('7e5ef8cb-9c0a-4fdd-bc82-2f63a15f729e', 'c875b0d6-2487-4d6e-8677-92011275b0c2', 'CEBOLINHA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao'),
	('6ad0bb3d-b733-41fc-89d9-ae88ed632e82', '48f7c9a3-65ac-4f3e-abf4-4d6ffffcd52b', 'SALSINHA', NULL, '2026-03-23 23:04:06.249126', '2026-03-23 23:04:06.249126', 0, NULL, false, NULL, 'fazenda_padrao');


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
-- Data for Name: financial_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: financial_installments; Type: TABLE DATA; Schema: public; Owner: postgres
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

INSERT INTO "public"."user_profiles" ("id", "email", "name", "role", "created_at", "last_updated", "farm_id", "is_deleted") VALUES
	('405ea0d8-d937-4973-b6ae-23aac96f1b87', 'brunower2009@gmail.com', NULL, 'PRODUTOR', '2026-03-25 23:33:17.8237+00', '2026-03-25 23:33:17.8237+00', 'fazenda_padrao', false);


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

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 78, true);


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

-- \unrestrict bqWsDmyW5Rxyhf8dt4yhm2njtbu6y4TEwnn2WuFhclETk87meCaKYHKPLdtlu5m

RESET ALL;
