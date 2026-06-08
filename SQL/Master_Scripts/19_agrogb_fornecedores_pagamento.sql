-- Master Script: 19_agrogb_fornecedores_pagamento.sql
-- Descrição: Adiciona campos de pagamento e dados bancários na tabela de fornecedores.

ALTER TABLE public.v2_fornecedores 
ADD COLUMN IF NOT EXISTS chave_pix text,
ADD COLUMN IF NOT EXISTS banco text,
ADD COLUMN IF NOT EXISTS agencia text,
ADD COLUMN IF NOT EXISTS conta_bancaria text,
ADD COLUMN IF NOT EXISTS tipo_conta text; -- 'Corrente', 'Poupança', etc.

COMMENT ON COLUMN public.v2_fornecedores.chave_pix IS 'Chave PIX do fornecedor para pagamentos';
COMMENT ON COLUMN public.v2_fornecedores.banco IS 'Nome ou código do banco do fornecedor';
COMMENT ON COLUMN public.v2_fornecedores.agencia IS 'Agência bancária do fornecedor';
COMMENT ON COLUMN public.v2_fornecedores.conta_bancaria IS 'Número da conta bancária do fornecedor';
COMMENT ON COLUMN public.v2_fornecedores.tipo_conta IS 'Tipo da conta bancária (Corrente, Poupança)';
