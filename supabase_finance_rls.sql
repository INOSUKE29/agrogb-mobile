-- ETAPA 1 & 2: CRIAR TABELAS E ATIVAR SEGURANÇA NO SUPABASE

-- 1. Criar Tabela de Contas
CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('PAGAR', 'RECEBER')),
    description TEXT NOT NULL,
    category TEXT,
    total_amount NUMERIC(15,2) DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
    payment_method TEXT,
    origin_uuid UUID, -- Referência ao UUID da compra/venda original
    created_at TIMESTAMPTZ DEFAULT now(),
    last_updated TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- 2. Criar Tabela de Parcelas
CREATE TABLE IF NOT EXISTS financial_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES financial_accounts(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_updated TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false
);

-- 3. Ativar RLS
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_installments ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso (Segurança)
CREATE POLICY "Usuários acessam apenas seus próprios dados financeiros"
ON financial_accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários acessam parcelas de suas próprias contas"
ON financial_installments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM financial_accounts
    WHERE financial_accounts.id = financial_installments.account_id
    AND financial_accounts.user_id = auth.uid()
  )
);

-- 5. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_fin_acc_user ON financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_fin_acc_date ON financial_accounts(due_date);
CREATE INDEX IF NOT EXISTS idx_fin_inst_acc ON financial_installments(account_id);
