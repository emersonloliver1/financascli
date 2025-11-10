import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository.js';
import { Budget } from '../../domain/entities/Budget.js';

/**
 * Implementação do repositório de orçamentos usando NeonDB
 */
export class BudgetRepository extends IBudgetRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  /**
   * Converte row do banco para entidade Budget
   * @private
   */
  _rowToBudget(row) {
    return new Budget({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      amount: row.amount,
      period: row.period,
      startDate: row.start_date,
      endDate: row.end_date,
      rollover: row.rollover,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Dados da categoria (se disponíveis no JOIN)
      categoryName: row.category_name,
      categoryIcon: row.category_icon,
      categoryColor: row.category_color,
      categoryType: row.category_type,
      // Dados de uso (se disponíveis no cálculo)
      spent: row.spent
    });
  }

  /**
   * Cria um novo orçamento
   */
  async create(budget) {
    const query = `
      INSERT INTO budgets (
        user_id, category_id, amount, period,
        start_date, end_date, rollover, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      budget.userId,
      budget.categoryId,
      budget.amount,
      budget.period,
      budget.startDate,
      budget.endDate,
      budget.rollover,
      budget.createdAt,
      budget.updatedAt
    ];

    const result = await this.database.query(query, values);
    return this._rowToBudget(result.rows[0]);
  }

  /**
   * Busca um orçamento por ID
   */
  async findById(id) {
    const query = `
      SELECT
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1;
    `;

    const result = await this.database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._rowToBudget(result.rows[0]);
  }

  /**
   * Busca orçamentos de um usuário
   */
  async findByUserId(userId, options = {}) {
    let query = `
      SELECT
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
    `;

    const params = [userId];

    // Filtrar por período
    if (options.period) {
      query += ` AND b.period = $${params.length + 1}`;
      params.push(options.period);
    }

    // Filtrar por categoria
    if (options.categoryId) {
      query += ` AND b.category_id = $${params.length + 1}`;
      params.push(options.categoryId);
    }

    // Ordenação
    query += ' ORDER BY b.start_date DESC, b.created_at DESC';

    const result = await this.database.query(query, params);

    return result.rows.map(row => this._rowToBudget(row));
  }

  /**
   * Busca orçamentos ativos de um usuário
   */
  async findActiveByUserId(userId, date = new Date()) {
    const query = `
      SELECT
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
        AND $2::date BETWEEN b.start_date AND b.end_date
      ORDER BY
        CASE
          WHEN (COALESCE(
            (SELECT SUM(t.amount)
             FROM transactions t
             WHERE t.user_id = b.user_id
               AND t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date BETWEEN b.start_date AND b.end_date
            ), 0
          ) / b.amount) >= 1 THEN 1
          WHEN (COALESCE(
            (SELECT SUM(t.amount)
             FROM transactions t
             WHERE t.user_id = b.user_id
               AND t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date BETWEEN b.start_date AND b.end_date
            ), 0
          ) / b.amount) >= 0.8 THEN 2
          WHEN (COALESCE(
            (SELECT SUM(t.amount)
             FROM transactions t
             WHERE t.user_id = b.user_id
               AND t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date BETWEEN b.start_date AND b.end_date
            ), 0
          ) / b.amount) >= 0.5 THEN 3
          ELSE 4
        END,
        b.start_date DESC;
    `;

    const result = await this.database.query(query, [userId, date]);

    return result.rows.map(row => this._rowToBudget(row));
  }

  /**
   * Busca orçamento por categoria e período
   */
  async findByCategoryAndPeriod(userId, categoryId, startDate, endDate) {
    const query = `
      SELECT
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
        AND b.category_id = $2
        AND b.start_date = $3::date
        AND b.end_date = $4::date;
    `;

    const result = await this.database.query(query, [userId, categoryId, startDate, endDate]);

    if (result.rows.length === 0) {
      return null;
    }

    return this._rowToBudget(result.rows[0]);
  }

  /**
   * Atualiza um orçamento existente
   */
  async update(id, data) {
    const query = `
      UPDATE budgets
      SET
        amount = COALESCE($1, amount),
        period = COALESCE($2, period),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        rollover = COALESCE($5, rollover),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;

    const values = [
      data.amount || null,
      data.period || null,
      data.startDate || null,
      data.endDate || null,
      data.rollover !== undefined ? data.rollover : null,
      id
    ];

    const result = await this.database.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Orçamento não encontrado');
    }

    return this._rowToBudget(result.rows[0]);
  }

  /**
   * Deleta um orçamento
   */
  async delete(id) {
    const result = await this.database.query(
      'DELETE FROM budgets WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Calcula o valor gasto em uma categoria durante um período
   */
  async getSpentAmount(userId, categoryId, startDate, endDate) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1
        AND category_id = $2
        AND type = 'expense'
        AND date BETWEEN $3::date AND $4::date;
    `;

    const result = await this.database.query(query, [
      userId,
      categoryId,
      startDate,
      endDate
    ]);

    return parseFloat(result.rows[0].total);
  }

  /**
   * Busca orçamentos que estão em alerta
   */
  async findBudgetsInAlert(userId, thresholdPercentage = 50) {
    const query = `
      SELECT
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type,
        COALESCE(
          (SELECT SUM(t.amount)
           FROM transactions t
           WHERE t.user_id = b.user_id
             AND t.category_id = b.category_id
             AND t.type = 'expense'
             AND t.date BETWEEN b.start_date AND b.end_date
          ), 0
        ) as spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
        AND CURRENT_DATE BETWEEN b.start_date AND b.end_date
        AND (
          COALESCE(
            (SELECT SUM(t.amount)
             FROM transactions t
             WHERE t.user_id = b.user_id
               AND t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date BETWEEN b.start_date AND b.end_date
            ), 0
          ) / b.amount
        ) * 100 >= $2
      ORDER BY
        (
          COALESCE(
            (SELECT SUM(t.amount)
             FROM transactions t
             WHERE t.user_id = b.user_id
               AND t.category_id = b.category_id
               AND t.type = 'expense'
               AND t.date BETWEEN b.start_date AND b.end_date
            ), 0
          ) / b.amount
        ) DESC;
    `;

    const result = await this.database.query(query, [userId, thresholdPercentage]);

    return result.rows.map(row => this._rowToBudget(row));
  }

  /**
   * Calcula a média de gastos históricos de uma categoria
   */
  async getAverageSpending(userId, categoryId, months = 3) {
    const query = `
      SELECT COALESCE(AVG(monthly_total), 0) as average
      FROM (
        SELECT SUM(amount) as monthly_total
        FROM transactions
        WHERE user_id = $1
          AND category_id = $2
          AND type = 'expense'
          AND date >= CURRENT_DATE - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', date)
      ) monthly_totals;
    `;

    const result = await this.database.query(query, [userId, categoryId]);

    return parseFloat(result.rows[0].average);
  }

  /**
   * Verifica se já existe um orçamento para a categoria no período
   */
  async existsForCategoryAndPeriod(userId, categoryId, startDate, endDate, excludeId = null) {
    let query = `
      SELECT EXISTS(
        SELECT 1 FROM budgets
        WHERE user_id = $1
          AND category_id = $2
          AND (
            (start_date, end_date) OVERLAPS ($3::date, $4::date)
          )
    `;

    const params = [userId, categoryId, startDate, endDate];

    if (excludeId) {
      query += ' AND id != $5';
      params.push(excludeId);
    }

    query += ')';

    const result = await this.database.query(query, params);

    return result.rows[0].exists;
  }
}
