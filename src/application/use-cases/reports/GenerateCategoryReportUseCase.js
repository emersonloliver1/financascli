import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Relatório por Categoria
 *
 * Gera um relatório detalhado de uma categoria específica incluindo:
 * - Histórico completo de transações da categoria
 * - Evolução mensal (últimos 6 meses)
 * - Média de gastos por mês
 * - Ticket médio
 * - Gráfico de tendência
 */
export class GenerateCategoryReportUseCase {
  constructor(transactionRepository, categoryRepository) {
    this.transactionRepository = transactionRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {string} categoryId
   * @param {number} monthsBack - Quantos meses para trás analisar (padrão: 6)
   * @returns {Promise<Report>}
   */
  async execute(userId, categoryId, monthsBack = 6) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    if (!categoryId) {
      throw new Error('categoryId é obrigatório');
    }

    if (monthsBack < 1 || monthsBack > 24) {
      throw new Error('monthsBack deve estar entre 1 e 24');
    }

    try {
      // Buscar informações da categoria
      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      // Definir período de análise
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (monthsBack - 1));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Buscar dados em paralelo
      const [
        summary,
        transactions,
        monthlyEvolution,
        recentTrend
      ] = await Promise.all([
        this._getCategorySummary(userId, categoryId, startDate, endDate),
        this._getCategoryTransactions(userId, categoryId, startDate, endDate),
        this._getMonthlyEvolution(userId, categoryId, monthsBack),
        this._getRecentTrend(userId, categoryId)
      ]);

      // Criar entidade Report
      return new Report({
        type: 'category',
        period: {
          start: startDate,
          end: endDate,
          categoryId,
          categoryName: category.name,
          categoryIcon: category.icon,
          label: `${category.icon} ${category.name} - Últimos ${monthsBack} meses`
        },
        data: {
          category: {
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type
          },
          transactions,
          monthlyEvolution,
          recentTrend
        },
        summary,
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar relatório por categoria: ${error.message}`);
    }
  }

  /**
   * Busca resumo da categoria no período
   * @private
   */
  async _getCategorySummary(userId, categoryId, startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount), 0) as total,
        AVG(amount) as average_ticket,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM transactions
      WHERE user_id = $1
        AND category_id = $2
        AND date >= $3
        AND date <= $4
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      categoryId,
      startDate,
      endDate
    ]);

    const row = result.rows[0];

    return {
      transactionCount: parseInt(row.transaction_count),
      total: parseFloat(row.total),
      averageTicket: row.average_ticket ? parseFloat(row.average_ticket) : 0,
      minAmount: row.min_amount ? parseFloat(row.min_amount) : 0,
      maxAmount: row.max_amount ? parseFloat(row.max_amount) : 0
    };
  }

  /**
   * Busca todas as transações da categoria no período
   * @private
   */
  async _getCategoryTransactions(userId, categoryId, startDate, endDate) {
    const query = `
      SELECT
        id,
        date,
        type,
        amount,
        description,
        created_at
      FROM transactions
      WHERE user_id = $1
        AND category_id = $2
        AND date >= $3
        AND date <= $4
      ORDER BY date DESC, created_at DESC
      LIMIT 100
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      categoryId,
      startDate,
      endDate
    ]);

    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description
    }));
  }

  /**
   * Busca evolução mensal da categoria
   * @private
   */
  async _getMonthlyEvolution(userId, categoryId, monthsBack) {
    const query = `
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month_year,
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        AVG(amount) as average
      FROM transactions
      WHERE user_id = $1
        AND category_id = $2
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${monthsBack - 1} months')
      GROUP BY month_year, month, year
      ORDER BY month_year
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      categoryId
    ]);

    return result.rows.map(row => ({
      monthYear: row.month_year,
      month: parseInt(row.month),
      year: parseInt(row.year),
      total: parseFloat(row.total),
      count: parseInt(row.count),
      average: parseFloat(row.average),
      monthName: this._getMonthName(parseInt(row.month))
    }));
  }

  /**
   * Busca tendência recente (últimos 3 meses vs 3 anteriores)
   * @private
   */
  async _getRecentTrend(userId, categoryId) {
    const query = `
      SELECT
        CASE
          WHEN date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months') THEN 'recent'
          ELSE 'previous'
        END as period,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
        AND category_id = $2
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY period
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      categoryId
    ]);

    const recentData = result.rows.find(r => r.period === 'recent');
    const previousData = result.rows.find(r => r.period === 'previous');

    const recentTotal = recentData ? parseFloat(recentData.total) : 0;
    const previousTotal = previousData ? parseFloat(previousData.total) : 0;
    const recentCount = recentData ? parseInt(recentData.count) : 0;
    const previousCount = previousData ? parseInt(previousData.count) : 0;

    // Calcular variação percentual
    const variation = previousTotal > 0
      ? ((recentTotal - previousTotal) / previousTotal) * 100
      : 0;

    return {
      recent: {
        total: recentTotal,
        count: recentCount,
        average: recentCount > 0 ? recentTotal / recentCount : 0
      },
      previous: {
        total: previousTotal,
        count: previousCount,
        average: previousCount > 0 ? previousTotal / previousCount : 0
      },
      variation,
      trend: variation > 5 ? 'increasing' : variation < -5 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Retorna o nome abreviado do mês
   * @private
   */
  _getMonthName(monthNumber) {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return months[monthNumber - 1] || 'N/A';
  }
}
