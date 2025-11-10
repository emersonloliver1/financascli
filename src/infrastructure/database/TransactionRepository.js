import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository.js';
import { Transaction } from '../../domain/entities/Transaction.js';

/**
 * Implementação do repositório de transações usando NeonDB
 */
export class TransactionRepository extends ITransactionRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  /**
   * Converte row do banco para entidade Transaction
   * @private
   */
  _rowToTransaction(row) {
    return new Transaction({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Dados da categoria (quando há JOIN)
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      categoryColor: row.category_color
    });
  }

  /**
   * Cria uma nova transação
   */
  async create(transaction) {
    const query = `
      INSERT INTO transactions (
        user_id, type, category_id, amount, description, date, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const params = [
      transaction.userId,
      transaction.type,
      transaction.categoryId,
      transaction.amount,
      transaction.description,
      transaction.date
    ];

    try {
      const result = await this.database.query(query, params);

      // Buscar dados da categoria via JOIN
      return await this.findById(result.rows[0].id);
    } catch (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new Error('Categoria não encontrada');
      }
      throw error;
    }
  }

  /**
   * Busca uma transação por ID (com JOIN em categories)
   */
  async findById(id) {
    const query = `
      SELECT
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1
    `;

    const result = await this.database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._rowToTransaction(result.rows[0]);
  }

  /**
   * Lista transações de um usuário com paginação
   */
  async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      orderBy = 'date',
      orderDirection = 'DESC'
    } = options;

    const offset = (page - 1) * limit;

    // Validar orderBy para prevenir SQL injection
    const allowedOrderBy = ['date', 'amount', 'created_at'];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'date';

    // Validar orderDirection
    const safeOrderDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
      ORDER BY t.${safeOrderBy} ${safeOrderDirection}, t.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.database.query(query, [userId, limit, offset]);

    return result.rows.map(row => this._rowToTransaction(row));
  }

  /**
   * Busca transações com filtros avançados
   */
  async findByFilters(filters) {
    const {
      userId,
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;
    const params = [userId];
    const conditions = ['t.user_id = $1'];
    let paramIndex = 2;

    // Filtro por tipo
    if (type && (type === 'income' || type === 'expense')) {
      conditions.push(`t.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    // Filtro por categoria
    if (categoryId) {
      conditions.push(`t.category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    // Filtro por período
    if (startDate) {
      conditions.push(`t.date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`t.date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    // Filtro por faixa de valor
    if (minAmount !== undefined && minAmount !== null) {
      conditions.push(`t.amount >= $${paramIndex}`);
      params.push(minAmount);
      paramIndex++;
    }

    if (maxAmount !== undefined && maxAmount !== null) {
      conditions.push(`t.amount <= $${paramIndex}`);
      params.push(maxAmount);
      paramIndex++;
    }

    // Busca por texto na descrição
    if (search && search.trim().length > 0) {
      conditions.push(`t.description ILIKE $${paramIndex}`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Adicionar limit e offset
    params.push(limit, offset);

    const query = `
      SELECT
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY t.date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await this.database.query(query, params);

    return result.rows.map(row => this._rowToTransaction(row));
  }

  /**
   * Atualiza uma transação existente
   */
  async update(id, data) {
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    // Campos que podem ser atualizados
    const allowedFields = ['type', 'category_id', 'amount', 'description', 'date'];

    // Construir query dinâmica baseado nos campos fornecidos
    Object.keys(data).forEach(key => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(snakeKey) && data[key] !== undefined) {
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        params.push(data[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    // Adicionar updated_at
    updateFields.push('updated_at = NOW()');

    // Adicionar ID no final dos params
    params.push(id);

    const query = `
      UPDATE transactions
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.database.query(query, params);

      if (result.rows.length === 0) {
        throw new Error('Transação não encontrada');
      }

      // Buscar com dados da categoria
      return await this.findById(result.rows[0].id);
    } catch (error) {
      if (error.code === '23503') {
        throw new Error('Categoria não encontrada');
      }
      throw error;
    }
  }

  /**
   * Deleta uma transação
   */
  async delete(id) {
    const query = 'DELETE FROM transactions WHERE id = $1';
    const result = await this.database.query(query, [id]);

    return result.rowCount > 0;
  }

  /**
   * Conta o total de transações
   */
  async count(userId, filters = {}) {
    const {
      type,
      categoryId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search
    } = filters;

    const params = [userId];
    const conditions = ['user_id = $1'];
    let paramIndex = 2;

    // Aplicar os mesmos filtros de findByFilters
    if (type && (type === 'income' || type === 'expense')) {
      conditions.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (minAmount !== undefined && minAmount !== null) {
      conditions.push(`amount >= $${paramIndex}`);
      params.push(minAmount);
      paramIndex++;
    }

    if (maxAmount !== undefined && maxAmount !== null) {
      conditions.push(`amount <= $${paramIndex}`);
      params.push(maxAmount);
      paramIndex++;
    }

    if (search && search.trim().length > 0) {
      conditions.push(`description ILIKE $${paramIndex}`);
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const query = `
      SELECT COUNT(*) as count
      FROM transactions
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.database.query(query, params);

    return parseInt(result.rows[0].count);
  }

  /**
   * Calcula o resumo financeiro
   */
  async getSummary(userId, filters = {}) {
    const {
      startDate,
      endDate,
      categoryId
    } = filters;

    const params = [userId];
    const conditions = ['user_id = $1'];
    let paramIndex = 2;

    if (startDate) {
      conditions.push(`date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (categoryId) {
      conditions.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    const query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as count
      FROM transactions
      WHERE ${conditions.join(' AND ')}
    `;

    const result = await this.database.query(query, params);
    const row = result.rows[0];

    const totalIncome = parseFloat(row.total_income);
    const totalExpense = parseFloat(row.total_expense);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      count: parseInt(row.count)
    };
  }

  /**
   * Verifica se uma transação existe e pertence ao usuário
   */
  async existsAndBelongsToUser(id, userId) {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM transactions
        WHERE id = $1 AND user_id = $2
      ) as exists
    `;

    const result = await this.database.query(query, [id, userId]);

    return result.rows[0].exists;
  }
}
