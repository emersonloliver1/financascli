import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Análise de Padrões
 *
 * Gera um relatório de análise de padrões de comportamento financeiro incluindo:
 * - Dia da semana com mais gastos
 * - Categoria mais frequente
 * - Ticket médio por categoria
 * - Frequência de transações
 * - Padrões temporais
 */
export class GeneratePatternAnalysisUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {number} monthsBack - Quantos meses para trás analisar (padrão: 6)
   * @returns {Promise<Report>}
   */
  async execute(userId, monthsBack = 6) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    if (monthsBack < 1 || monthsBack > 24) {
      throw new Error('monthsBack deve estar entre 1 e 24');
    }

    try {
      // Definir período
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsBack);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Buscar dados em paralelo
      const [
        dayOfWeekPattern,
        categoryFrequency,
        ticketAnalysis,
        timePattern,
        summary
      ] = await Promise.all([
        this._getDayOfWeekPattern(userId, startDate, endDate),
        this._getCategoryFrequency(userId, startDate, endDate),
        this._getTicketAnalysis(userId, startDate, endDate),
        this._getTimePattern(userId, startDate, endDate),
        this._getSummary(userId, startDate, endDate)
      ]);

      // Criar entidade Report
      return new Report({
        type: 'pattern',
        period: {
          start: startDate,
          end: endDate,
          monthsBack,
          label: `Análise dos últimos ${monthsBack} meses`
        },
        data: {
          dayOfWeekPattern,
          categoryFrequency,
          ticketAnalysis,
          timePattern
        },
        summary,
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar análise de padrões: ${error.message}`);
    }
  }

  /**
   * Analisa padrão por dia da semana
   * @private
   */
  async _getDayOfWeekPattern(userId, startDate, endDate) {
    const query = `
      SELECT
        EXTRACT(DOW FROM date) as day_of_week,
        COUNT(*) as transaction_count,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(AVG(CASE WHEN type = 'expense' THEN amount ELSE NULL END), 0) as avg_expense
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const data = result.rows.map(row => ({
      dayOfWeek: parseInt(row.day_of_week),
      dayName: dayNames[parseInt(row.day_of_week)],
      transactionCount: parseInt(row.transaction_count),
      totalExpenses: parseFloat(row.total_expenses),
      totalIncome: parseFloat(row.total_income),
      averageExpense: parseFloat(row.avg_expense)
    }));

    // Encontrar dia com mais gastos
    const maxExpenseDay = data.length > 0
      ? data.reduce((max, d) => d.totalExpenses > max.totalExpenses ? d : max)
      : null;

    return {
      data,
      maxExpenseDay
    };
  }

  /**
   * Analisa frequência por categoria
   * @private
   */
  async _getCategoryFrequency(userId, startDate, endDate) {
    const query = `
      SELECT
        c.id,
        c.name,
        c.icon,
        c.type,
        COUNT(*) as frequency,
        COALESCE(SUM(t.amount), 0) as total,
        AVG(t.amount) as average_ticket
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.date >= $2
        AND t.date <= $3
      GROUP BY c.id, c.name, c.icon, c.type
      ORDER BY frequency DESC
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const totalTransactions = result.rows.reduce(
      (sum, row) => sum + parseInt(row.frequency),
      0
    );

    return result.rows.map(row => ({
      categoryId: row.id,
      categoryName: row.name,
      icon: row.icon,
      type: row.type,
      frequency: parseInt(row.frequency),
      total: parseFloat(row.total),
      averageTicket: parseFloat(row.average_ticket),
      frequencyPercent: totalTransactions > 0
        ? (parseInt(row.frequency) / totalTransactions) * 100
        : 0
    }));
  }

  /**
   * Analisa ticket médio
   * @private
   */
  async _getTicketAnalysis(userId, startDate, endDate) {
    const query = `
      SELECT
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total,
        AVG(amount) as average,
        MIN(amount) as min,
        MAX(amount) as max,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      GROUP BY type
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const analysis = {};

    result.rows.forEach(row => {
      analysis[row.type] = {
        count: parseInt(row.count),
        total: parseFloat(row.total),
        average: parseFloat(row.average),
        min: parseFloat(row.min),
        max: parseFloat(row.max),
        median: parseFloat(row.median)
      };
    });

    return analysis;
  }

  /**
   * Analisa padrão temporal (início, meio, fim do mês)
   * @private
   */
  async _getTimePattern(userId, startDate, endDate) {
    const query = `
      SELECT
        CASE
          WHEN EXTRACT(DAY FROM date) <= 10 THEN 'início'
          WHEN EXTRACT(DAY FROM date) <= 20 THEN 'meio'
          ELSE 'fim'
        END as period,
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      GROUP BY period, type
      ORDER BY period, type
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    // Organizar por período
    const patterns = {
      início: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 },
      meio: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 },
      fim: { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 }
    };

    result.rows.forEach(row => {
      const period = row.period;
      const type = row.type;

      if (type === 'income') {
        patterns[period].income = parseFloat(row.total);
        patterns[period].incomeCount = parseInt(row.count);
      } else {
        patterns[period].expense = parseFloat(row.total);
        patterns[period].expenseCount = parseInt(row.count);
      }
    });

    return patterns;
  }

  /**
   * Calcula resumo geral
   * @private
   */
  async _getSummary(userId, startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_transactions,
        COUNT(DISTINCT DATE(date)) as active_days,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const row = result.rows[0];

    const totalTransactions = parseInt(row.total_transactions);
    const activeDays = parseInt(row.active_days);
    const totalExpenses = parseFloat(row.total_expenses);
    const totalIncome = parseFloat(row.total_income);

    // Calcular dias no período
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    return {
      totalTransactions,
      activeDays,
      totalDays: daysDiff,
      activityRate: daysDiff > 0 ? (activeDays / daysDiff) * 100 : 0,
      averageTransactionsPerDay: activeDays > 0 ? totalTransactions / activeDays : 0,
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses
    };
  }
}
