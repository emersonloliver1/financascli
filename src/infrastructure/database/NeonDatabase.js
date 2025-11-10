import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

/**
 * Configuração e conexão com o NeonDB
 */
export class NeonDatabase {
  constructor() {
    this.pool = null;
  }

  /**
   * Conecta ao banco de dados
   */
  async connect() {
    if (this.pool) {
      return this.pool;
    }

    const connectionString = process.env.NEON_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('NEON_CONNECTION_STRING não configurada no .env');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Testar conexão
    try {
      const client = await this.pool.connect();
      console.log('✅ Conectado ao NeonDB');
      client.release();
    } catch (error) {
      console.error('❌ Erro ao conectar ao NeonDB:', error.message);
      throw error;
    }

    return this.pool;
  }

  /**
   * Executa uma query
   * @param {string} text - Query SQL
   * @param {Array} params - Parâmetros da query
   */
  async query(text, params) {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool.query(text, params);
  }

  /**
   * Fecha a conexão
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Inicializa as tabelas necessárias
   */
  async initializeTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createUserAuthTable = `
      CREATE TABLE IF NOT EXISTS user_auth (
        user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
        icon VARCHAR(10),
        color VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Migração para adicionar novas colunas (se tabela já existir)
    const migrateCategoriesTable = `
      DO $$
      BEGIN
        -- Adicionar parent_id se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'categories' AND column_name = 'parent_id'
        ) THEN
          ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE;
        END IF;

        -- Adicionar is_default se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'categories' AND column_name = 'is_default'
        ) THEN
          ALTER TABLE categories ADD COLUMN is_default BOOLEAN DEFAULT FALSE;
        END IF;

        -- Remover constraint antiga e adicionar nova
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'categories_user_id_name_type_key'
          AND table_name = 'categories'
        ) THEN
          ALTER TABLE categories DROP CONSTRAINT categories_user_id_name_type_key;
        END IF;

        -- Adicionar nova constraint se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'unique_user_category'
          AND table_name = 'categories'
        ) THEN
          ALTER TABLE categories ADD CONSTRAINT unique_user_category
            UNIQUE NULLS NOT DISTINCT (user_id, name, type, parent_id);
        END IF;
      END $$;
    `;

    // Índices para performance
    const createCategoriesIndexes = `
      CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
      CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
      CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
      CREATE INDEX IF NOT EXISTS idx_categories_is_default ON categories(is_default);
    `;

    // Tabela de orçamentos
    const createBudgetsTable = `
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
        period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'annual', 'custom')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        rollover BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category_id, start_date, end_date)
      );
    `;

    // Índices para performance de budgets
    const createBudgetsIndexes = `
      CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
      CREATE INDEX IF NOT EXISTS idx_budgets_dates ON budgets(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_budgets_user_dates ON budgets(user_id, start_date, end_date);
    `;

    // Tabela de metas financeiras
    const createGoalsTable = `
      CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
        current_amount DECIMAL(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
        monthly_contribution DECIMAL(15, 2),
        deadline DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Tabela de contribuições de metas
    const createGoalContributionsTable = `
      CREATE TABLE IF NOT EXISTS goal_contributions (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        description TEXT,
        contribution_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Índices para performance de goals
    const createGoalsIndexes = `
      CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
      CREATE INDEX IF NOT EXISTS idx_goal_contributions_date ON goal_contributions(contribution_date);
    `;

    try {
      await this.query(createUsersTable);
      await this.query(createUserAuthTable);
      await this.query(createTransactionsTable);
      await this.query(createCategoriesTable);
      await this.query(migrateCategoriesTable);
      await this.query(createCategoriesIndexes);
      await this.query(createBudgetsTable);
      await this.query(createBudgetsIndexes);
      await this.query(createGoalsTable);
      await this.query(createGoalContributionsTable);
      await this.query(createGoalsIndexes);
      console.log('✅ Tabelas inicializadas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar tabelas:', error.message);
      throw error;
    }
  }
}

// Singleton
export const database = new NeonDatabase();
