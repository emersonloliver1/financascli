-- Índices otimizados para a tabela transactions
-- Criado em: 2025-11-10
-- Objetivo: Melhorar performance de queries de transações

-- Índice composto para buscar transações por usuário ordenadas por data
-- Usado em: listagem principal, filtros por período
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
ON transactions(user_id, date DESC, created_at DESC);

-- Índice para buscar por categoria
-- Usado em: filtros por categoria, relatórios por categoria
CREATE INDEX IF NOT EXISTS idx_transactions_category
ON transactions(category_id);

-- Índice para buscar por tipo de transação
-- Usado em: filtros por tipo (receitas/despesas)
CREATE INDEX IF NOT EXISTS idx_transactions_type
ON transactions(type);

-- Índice composto para agregações por usuário e tipo
-- Usado em: cálculos de resumo, dashboard
CREATE INDEX IF NOT EXISTS idx_transactions_user_type
ON transactions(user_id, type);

-- Índice para busca textual na descrição (usando gin para melhor performance)
-- Usado em: busca por texto
CREATE INDEX IF NOT EXISTS idx_transactions_description_gin
ON transactions USING gin(to_tsvector('portuguese', description));

-- Índice para verificar propriedade (usado em updates/deletes)
-- Melhora performance de verificações de segurança
CREATE INDEX IF NOT EXISTS idx_transactions_user_id
ON transactions(user_id, id);

-- Comentários explicativos
COMMENT ON INDEX idx_transactions_user_date IS 'Otimiza listagem de transações por usuário ordenadas por data';
COMMENT ON INDEX idx_transactions_category IS 'Otimiza filtros e relatórios por categoria';
COMMENT ON INDEX idx_transactions_type IS 'Otimiza filtros por tipo de transação';
COMMENT ON INDEX idx_transactions_user_type IS 'Otimiza agregações e cálculos de resumo';
COMMENT ON INDEX idx_transactions_description_gin IS 'Otimiza busca textual na descrição usando full-text search';
COMMENT ON INDEX idx_transactions_user_id IS 'Otimiza verificações de propriedade em updates/deletes';
