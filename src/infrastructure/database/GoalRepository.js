import { Goal } from '../../domain/entities/Goal.js';

/**
 * Repositório de metas financeiras
 */
export class GoalRepository {
  /**
   * @param {NeonDatabase} database - Instância do banco de dados
   */
  constructor(database) {
    this.database = database;
  }

  /**
   * Cria uma nova meta
   * @param {Goal} goal - Meta a ser criada
   * @returns {Promise<Goal>} Meta criada
   */
  async create(goal) {
    const query = `
      INSERT INTO goals (
        user_id, name, target_amount, current_amount,
        monthly_contribution, deadline, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const values = [
      goal.userId,
      goal.name,
      goal.targetAmount,
      goal.currentAmount || 0,
      goal.monthlyContribution,
      goal.deadline,
      goal.status
    ];

    const result = await this.database.query(query, values);
    return new Goal(result.rows[0]);
  }

  /**
   * Busca uma meta por ID
   * @param {number} id - ID da meta
   * @returns {Promise<Goal|null>} Meta encontrada ou null
   */
  async findById(id) {
    const query = `
      SELECT
        g.*,
        COALESCE(SUM(gc.amount), 0) as total_contributed,
        COUNT(gc.id) as contribution_count
      FROM goals g
      LEFT JOIN goal_contributions gc ON g.id = gc.goal_id
      WHERE g.id = $1
      GROUP BY g.id;
    `;

    const result = await this.database.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return new Goal(result.rows[0]);
  }

  /**
   * Busca todas as metas de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de metas
   */
  async findByUserId(userId, options = {}) {
    const { status, limit, offset } = options;

    let query = `
      SELECT
        g.*,
        COALESCE(SUM(gc.amount), 0) as total_contributed,
        COUNT(gc.id) as contribution_count,
        (SELECT AVG(monthly_total)
         FROM (
           SELECT DATE_TRUNC('month', contribution_date) as month,
                  SUM(amount) as monthly_total
           FROM goal_contributions
           WHERE goal_id = g.id
             AND contribution_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
           GROUP BY month
         ) monthly_totals
        ) as avg_monthly_contribution
      FROM goals g
      LEFT JOIN goal_contributions gc ON g.id = gc.goal_id
      WHERE g.user_id = $1
    `;

    const params = [userId];

    if (status) {
      query += ` AND g.status = $${params.length + 1}`;
      params.push(status);
    }

    query += `
      GROUP BY g.id
      ORDER BY
        CASE
          WHEN g.deadline IS NOT NULL AND g.deadline < CURRENT_DATE THEN 1
          WHEN (g.current_amount / g.target_amount) >= 0.8 THEN 2
          ELSE 3
        END,
        g.deadline ASC NULLS LAST,
        g.created_at DESC
    `;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    query += ';';

    const result = await this.database.query(query, params);
    return result.rows;
  }

  /**
   * Busca metas ativas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de metas ativas
   */
  async findActiveByUserId(userId) {
    const query = `
      SELECT
        g.*,
        COALESCE(SUM(gc.amount), 0) as total_contributed,
        COUNT(gc.id) as contribution_count,
        (SELECT AVG(monthly_total)
         FROM (
           SELECT DATE_TRUNC('month', contribution_date) as month,
                  SUM(amount) as monthly_total
           FROM goal_contributions
           WHERE goal_id = g.id
             AND contribution_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
           GROUP BY month
         ) monthly_totals
        ) as avg_monthly_contribution
      FROM goals g
      LEFT JOIN goal_contributions gc ON g.id = gc.goal_id
      WHERE g.user_id = $1
        AND g.status = 'active'
      GROUP BY g.id
      ORDER BY
        CASE
          WHEN g.deadline IS NOT NULL AND g.deadline < CURRENT_DATE THEN 1
          WHEN (g.current_amount / g.target_amount) >= 0.8 THEN 2
          ELSE 3
        END,
        g.deadline ASC NULLS LAST,
        g.created_at DESC;
    `;

    const result = await this.database.query(query, [userId]);
    return result.rows;
  }

  /**
   * Busca metas concluídas de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Lista de metas concluídas
   */
  async findCompletedByUserId(userId, options = {}) {
    const { limit = 10, offset = 0 } = options;

    const query = `
      SELECT
        g.*,
        COALESCE(SUM(gc.amount), 0) as total_contributed,
        COUNT(gc.id) as contribution_count,
        EXTRACT(DAY FROM (g.completed_at - g.created_at)) as days_to_complete
      FROM goals g
      LEFT JOIN goal_contributions gc ON g.id = gc.goal_id
      WHERE g.user_id = $1
        AND g.status = 'completed'
      GROUP BY g.id
      ORDER BY g.completed_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await this.database.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Atualiza uma meta
   * @param {number} id - ID da meta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Goal>} Meta atualizada
   */
  async update(id, data) {
    const allowedFields = [
      'name',
      'target_amount',
      'monthly_contribution',
      'deadline',
      'status',
      'current_amount'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('Nenhum campo válido para atualizar');
    }

    // Adicionar updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Se status mudou para completed, adicionar completed_at
    if (data.status === 'completed') {
      updates.push('completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)');
    }

    values.push(id);

    const query = `
      UPDATE goals
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await this.database.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Meta não encontrada');
    }

    return new Goal(result.rows[0]);
  }

  /**
   * Deleta uma meta
   * @param {number} id - ID da meta
   * @returns {Promise<boolean>} true se deletado com sucesso
   */
  async delete(id) {
    const query = 'DELETE FROM goals WHERE id = $1 RETURNING id;';
    const result = await this.database.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Adiciona uma contribuição a uma meta
   * @param {number} goalId - ID da meta
   * @param {number} amount - Valor da contribuição
   * @param {string} description - Descrição da contribuição
   * @returns {Promise<Object>} Contribuição e meta atualizada
   */
  async addContribution(goalId, amount, description = null) {
    const client = await this.database.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Adicionar contribuição
      const insertQuery = `
        INSERT INTO goal_contributions (goal_id, amount, description)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const contributionResult = await client.query(insertQuery, [goalId, amount, description]);

      // 2. Atualizar valor atual da meta
      const updateQuery = `
        UPDATE goals
        SET current_amount = current_amount + $1,
            updated_at = CURRENT_TIMESTAMP,
            status = CASE
              WHEN (current_amount + $1) >= target_amount THEN 'completed'
              ELSE status
            END,
            completed_at = CASE
              WHEN (current_amount + $1) >= target_amount AND completed_at IS NULL
              THEN CURRENT_TIMESTAMP
              ELSE completed_at
            END
        WHERE id = $2
        RETURNING *;
      `;
      const goalResult = await client.query(updateQuery, [amount, goalId]);

      await client.query('COMMIT');

      return {
        contribution: contributionResult.rows[0],
        goal: new Goal(goalResult.rows[0])
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtém as contribuições de uma meta
   * @param {number} goalId - ID da meta
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Lista de contribuições
   */
  async getContributions(goalId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT *
      FROM goal_contributions
      WHERE goal_id = $1
      ORDER BY contribution_date DESC, created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await this.database.query(query, [goalId, limit, offset]);
    return result.rows;
  }

  /**
   * Calcula a média mensal de contribuições
   * @param {string} userId - ID do usuário
   * @param {number|null} goalId - ID da meta (opcional)
   * @returns {Promise<number>} Média mensal
   */
  async getMonthlyAverage(userId, goalId = null) {
    const query = `
      SELECT AVG(monthly_total) as average
      FROM (
        SELECT
          DATE_TRUNC('month', contribution_date) as month,
          SUM(amount) as monthly_total
        FROM goal_contributions gc
        JOIN goals g ON gc.goal_id = g.id
        WHERE g.user_id = $1
          AND ($2::INTEGER IS NULL OR gc.goal_id = $2)
          AND contribution_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months')
        GROUP BY month
      ) monthly_totals;
    `;

    const result = await this.database.query(query, [userId, goalId]);
    return parseFloat(result.rows[0].average) || 0;
  }

  /**
   * Obtém estatísticas gerais das metas
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats(userId) {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COALESCE(SUM(current_amount) FILTER (WHERE status = 'active'), 0) as total_saved,
        COALESCE(SUM(target_amount - current_amount) FILTER (WHERE status = 'active'), 0) as total_remaining,
        COALESCE(
          (SELECT SUM(amount)
           FROM goal_contributions gc
           JOIN goals g ON gc.goal_id = g.id
           WHERE g.user_id = $1
             AND gc.contribution_date >= DATE_TRUNC('month', CURRENT_DATE)
          ), 0
        ) as this_month_contributions,
        (
          SELECT g.*
          FROM goals g
          WHERE g.user_id = $1
            AND g.status = 'active'
          ORDER BY (g.current_amount / g.target_amount) DESC
          LIMIT 1
        ) as closest_goal
      FROM goals
      WHERE user_id = $1;
    `;

    const result = await this.database.query(query, [userId]);

    if (result.rows.length === 0) {
      return {
        activeCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        totalSaved: 0,
        totalRemaining: 0,
        thisMonthContributions: 0,
        closestGoal: null
      };
    }

    const stats = result.rows[0];

    return {
      activeCount: parseInt(stats.active_count) || 0,
      completedCount: parseInt(stats.completed_count) || 0,
      cancelledCount: parseInt(stats.cancelled_count) || 0,
      totalSaved: parseFloat(stats.total_saved) || 0,
      totalRemaining: parseFloat(stats.total_remaining) || 0,
      thisMonthContributions: parseFloat(stats.this_month_contributions) || 0,
      closestGoal: stats.closest_goal ? new Goal(stats.closest_goal) : null
    };
  }
}
