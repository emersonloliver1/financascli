import { DashboardData } from '../../domain/entities/DashboardData.js';

/**
 * Caso de uso para obter dados do dashboard
 */
export class GetDashboardDataUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @returns {Promise<DashboardData>}
   */
  async execute(userId) {
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    try {
      // Buscar dados em paralelo para melhor performance
      const [
        currentMonthData,
        previousMonthData,
        balanceData,
        topCategories,
        monthlyTrend
      ] = await Promise.all([
        this._getCurrentMonthData(userId),
        this._getPreviousMonthData(userId),
        this._getBalanceData(userId),
        this._getTopCategories(userId),
        this._getMonthlyTrend(userId)
      ]);

      // Criar e retornar entidade DashboardData
      return new DashboardData({
        userId,
        currentMonth: currentMonthData,
        previousMonth: previousMonthData,
        balance: balanceData,
        topCategories,
        monthlyTrend,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao buscar dados do dashboard: ${error.message}`);
    }
  }

  /**
   * Busca dados do mês atual
   * @private
   */
  async _getCurrentMonthData(userId) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const query = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
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

    const income = result.rows.find(r => r.type === 'income')?.total || 0;
    const expense = result.rows.find(r => r.type === 'expense')?.total || 0;
    const count = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    return {
      income: parseFloat(income),
      expense: parseFloat(expense),
      balance: parseFloat(income) - parseFloat(expense),
      count,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    };
  }

  /**
   * Busca dados do mês anterior
   * @private
   */
  async _getPreviousMonthData(userId) {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startDate = previousMonth;
    const endDate = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59);

    const query = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
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

    const income = result.rows.find(r => r.type === 'income')?.total || 0;
    const expense = result.rows.find(r => r.type === 'expense')?.total || 0;
    const count = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    return {
      income: parseFloat(income),
      expense: parseFloat(expense),
      balance: parseFloat(income) - parseFloat(expense),
      count,
      month: previousMonth.getMonth() + 1,
      year: previousMonth.getFullYear()
    };
  }

  /**
   * Busca saldo geral (todas as transações)
   * @private
   */
  async _getBalanceData(userId) {
    const query = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
      GROUP BY type
    `;

    const result = await this.transactionRepository.database.query(query, [userId]);

    const income = result.rows.find(r => r.type === 'income')?.total || 0;
    const expense = result.rows.find(r => r.type === 'expense')?.total || 0;
    const count = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);

    return {
      totalIncome: parseFloat(income),
      totalExpense: parseFloat(expense),
      balance: parseFloat(income) - parseFloat(expense),
      count
    };
  }

  /**
   * Busca top 5 categorias do mês atual (apenas despesas)
   * @private
   */
  async _getTopCategories(userId) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const query = `
      SELECT
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(*) as count
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.type = 'expense'
        AND t.date >= $2
        AND t.date <= $3
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC
      LIMIT 5
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
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      total: parseFloat(row.total),
      count: parseInt(row.count),
      percentage: totalExpenses > 0
        ? (parseFloat(row.total) / totalExpenses) * 100
        : 0
    }));
  }

  /**
   * Busca evolução dos últimos 6 meses
   * @private
   */
  async _getMonthlyTrend(userId) {
    const query = `
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month_year,
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        type,
        COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = $1
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
      GROUP BY month_year, month, year, type
      ORDER BY month_year
    `;

    const result = await this.transactionRepository.database.query(query, [userId]);

    // Agrupar por mês
    const monthsMap = new Map();

    result.rows.forEach(row => {
      const monthKey = row.month_year;

      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, {
          month: parseInt(row.month),
          year: parseInt(row.year),
          income: 0,
          expense: 0,
          balance: 0
        });
      }

      const monthData = monthsMap.get(monthKey);

      if (row.type === 'income') {
        monthData.income = parseFloat(row.total);
      } else if (row.type === 'expense') {
        monthData.expense = parseFloat(row.total);
      }

      monthData.balance = monthData.income - monthData.expense;
    });

    // Converter Map para Array e adicionar nomes dos meses
    return Array.from(monthsMap.values()).map(trend => ({
      ...trend,
      monthName: this._getMonthName(trend.month)
    }));
  }

  /**
   * Obtém o nome abreviado do mês
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
