import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Relatório Mensal Detalhado
 *
 * Gera um relatório completo de um mês específico incluindo:
 * - Resumo financeiro (receitas, despesas, saldo)
 * - Lista de transações
 * - Distribuição por categoria
 * - Estatísticas (média diária, dia com maior/menor gasto)
 */
export class GenerateMonthlyReportUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {number} month - Mês (1-12)
   * @param {number} year - Ano (ex: 2025)
   * @returns {Promise<Report>}
   */
  async execute(userId, month, year) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    if (!month || month < 1 || month > 12) {
      throw new Error('Mês inválido (deve ser entre 1 e 12)');
    }

    if (!year || year < 2000 || year > 2100) {
      throw new Error('Ano inválido');
    }

    try {
      // Definir período
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Buscar dados em paralelo
      const [
        summary,
        transactions,
        categoryDistribution,
        dailyStats
      ] = await Promise.all([
        this._getMonthSummary(userId, startDate, endDate),
        this._getMonthTransactions(userId, startDate, endDate),
        this._getCategoryDistribution(userId, startDate, endDate),
        this._getDailyStats(userId, startDate, endDate)
      ]);

      // Criar entidade Report
      return new Report({
        type: 'monthly',
        period: {
          start: startDate,
          end: endDate,
          month,
          year,
          label: this._getMonthLabel(month, year)
        },
        data: {
          transactions,
          categoryDistribution,
          dailyStats
        },
        summary,
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar relatório mensal: ${error.message}`);
    }
  }

  /**
   * Busca resumo financeiro do mês
   * @private
   */
  async _getMonthSummary(userId, startDate, endDate) {
    const query = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count,
        AVG(amount) as average
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

    const incomeRow = result.rows.find(r => r.type === 'income');
    const expenseRow = result.rows.find(r => r.type === 'expense');

    const totalIncome = incomeRow ? parseFloat(incomeRow.total) : 0;
    const totalExpense = expenseRow ? parseFloat(expenseRow.total) : 0;
    const incomeCount = incomeRow ? parseInt(incomeRow.count) : 0;
    const expenseCount = expenseRow ? parseInt(expenseRow.count) : 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: incomeCount + expenseCount,
      incomeCount,
      expenseCount,
      averageIncome: incomeRow ? parseFloat(incomeRow.average) : 0,
      averageExpense: expenseRow ? parseFloat(expenseRow.average) : 0
    };
  }

  /**
   * Busca todas as transações do mês
   * @private
   */
  async _getMonthTransactions(userId, startDate, endDate) {
    const query = `
      SELECT
        t.id,
        t.date,
        t.type,
        t.amount,
        t.description,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.date >= $2
        AND t.date <= $3
      ORDER BY t.date DESC, t.created_at DESC
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      category: {
        name: row.category_name,
        icon: row.category_icon,
        color: row.category_color
      }
    }));
  }

  /**
   * Busca distribuição por categoria (apenas despesas)
   * @private
   */
  async _getCategoryDistribution(userId, startDate, endDate) {
    const query = `
      SELECT
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(*) as count,
        AVG(t.amount) as average
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.date >= $2
        AND t.date <= $3
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    // Calcular total de despesas para porcentagem
    const totalExpenses = result.rows.reduce(
      (sum, row) => sum + parseFloat(row.total),
      0
    );

    return result.rows.map(row => ({
      categoryId: row.id,
      categoryName: row.name,
      icon: row.icon,
      color: row.color,
      total: parseFloat(row.total),
      count: parseInt(row.count),
      average: parseFloat(row.average),
      percentage: totalExpenses > 0
        ? (parseFloat(row.total) / totalExpenses) * 100
        : 0
    }));
  }

  /**
   * Busca estatísticas diárias
   * @private
   */
  async _getDailyStats(userId, startDate, endDate) {
    const query = `
      SELECT
        DATE(date) as day,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as daily_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as daily_income,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      GROUP BY DATE(date)
      ORDER BY DATE(date)
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const dailyData = result.rows.map(row => ({
      day: row.day,
      expense: parseFloat(row.daily_expense),
      income: parseFloat(row.daily_income),
      transactionCount: parseInt(row.transaction_count)
    }));

    // Calcular estatísticas
    const expenseDays = dailyData.filter(d => d.expense > 0);
    const totalDaysInMonth = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      0
    ).getDate();

    const totalExpenses = dailyData.reduce((sum, d) => sum + d.expense, 0);
    const averageDaily = expenseDays.length > 0 ? totalExpenses / expenseDays.length : 0;

    // Dia com maior gasto
    const maxExpenseDay = expenseDays.length > 0
      ? expenseDays.reduce((max, d) => d.expense > max.expense ? d : max)
      : null;

    // Dia com menor gasto (apenas dias com gastos)
    const minExpenseDay = expenseDays.length > 0
      ? expenseDays.reduce((min, d) => d.expense < min.expense ? d : min)
      : null;

    return {
      dailyData,
      totalDaysInMonth,
      daysWithExpenses: expenseDays.length,
      averageDaily,
      maxExpenseDay,
      minExpenseDay
    };
  }

  /**
   * Retorna o nome do mês
   * @private
   */
  _getMonthLabel(month, year) {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[month - 1]} de ${year}`;
  }
}
