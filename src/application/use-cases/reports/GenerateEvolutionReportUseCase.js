import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Relatório de Evolução Temporal
 *
 * Gera um relatório de evolução financeira dos últimos N meses incluindo:
 * - Evolução mensal de receitas vs despesas
 * - Saldo mensal
 * - Tendência (crescimento/redução)
 * - Mês com maior/menor saldo
 * - Gráfico de linha ASCII
 */
export class GenerateEvolutionReportUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {number} monthsBack - Quantos meses para trás analisar (padrão: 12)
   * @returns {Promise<Report>}
   */
  async execute(userId, monthsBack = 12) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    if (monthsBack < 3 || monthsBack > 24) {
      throw new Error('monthsBack deve estar entre 3 e 24');
    }

    try {
      // Definir período
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (monthsBack - 1));
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      // Buscar dados
      const [
        monthlyData,
        summary,
        trend
      ] = await Promise.all([
        this._getMonthlyData(userId, monthsBack),
        this._getSummary(userId, monthsBack),
        this._getTrend(userId, monthsBack)
      ]);

      // Criar entidade Report
      return new Report({
        type: 'evolution',
        period: {
          start: startDate,
          end: endDate,
          monthsBack,
          label: `Últimos ${monthsBack} meses`
        },
        data: {
          monthlyData,
          trend
        },
        summary,
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de evolução: ${error.message}`);
    }
  }

  /**
   * Busca dados mensais
   * @private
   */
  async _getMonthlyData(userId, monthsBack) {
    const query = `
      SELECT
        TO_CHAR(date, 'YYYY-MM') as month_year,
        EXTRACT(MONTH FROM date) as month,
        EXTRACT(YEAR FROM date) as year,
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
        AND date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${monthsBack - 1} months')
      GROUP BY month_year, month, year, type
      ORDER BY month_year
    `;

    const result = await this.transactionRepository.database.query(query, [userId]);

    // Agrupar por mês
    const monthsMap = new Map();

    // Preencher todos os meses do período (mesmo sem transações)
    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      monthsMap.set(monthKey, {
        monthYear: monthKey,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        monthName: this._getMonthName(date.getMonth() + 1),
        income: 0,
        expense: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
        totalCount: 0
      });
    }

    // Preencher com dados reais
    result.rows.forEach(row => {
      const monthKey = row.month_year;

      if (!monthsMap.has(monthKey)) {
        return; // Ignorar meses fora do período
      }

      const monthData = monthsMap.get(monthKey);

      if (row.type === 'income') {
        monthData.income = parseFloat(row.total);
        monthData.incomeCount = parseInt(row.count);
      } else if (row.type === 'expense') {
        monthData.expense = parseFloat(row.total);
        monthData.expenseCount = parseInt(row.count);
      }

      monthData.balance = monthData.income - monthData.expense;
      monthData.totalCount = monthData.incomeCount + monthData.expenseCount;
    });

    return Array.from(monthsMap.values());
  }

  /**
   * Calcula resumo geral
   * @private
   */
  async _getSummary(userId, monthsBack) {
    const monthlyData = await this._getMonthlyData(userId, monthsBack);

    // Calcular totais
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
    const totalBalance = totalIncome - totalExpense;

    // Médias mensais
    const averageMonthlyIncome = totalIncome / monthsBack;
    const averageMonthlyExpense = totalExpense / monthsBack;
    const averageMonthlyBalance = totalBalance / monthsBack;

    // Mês com maior/menor saldo
    const monthsWithData = monthlyData.filter(m => m.totalCount > 0);

    const bestMonth = monthsWithData.length > 0
      ? monthsWithData.reduce((best, m) => m.balance > best.balance ? m : best)
      : null;

    const worstMonth = monthsWithData.length > 0
      ? monthsWithData.reduce((worst, m) => m.balance < worst.balance ? m : worst)
      : null;

    return {
      totalIncome,
      totalExpense,
      totalBalance,
      averageMonthlyIncome,
      averageMonthlyExpense,
      averageMonthlyBalance,
      bestMonth: bestMonth ? {
        monthYear: bestMonth.monthYear,
        monthName: bestMonth.monthName,
        year: bestMonth.year,
        balance: bestMonth.balance
      } : null,
      worstMonth: worstMonth ? {
        monthYear: worstMonth.monthYear,
        monthName: worstMonth.monthName,
        year: worstMonth.year,
        balance: worstMonth.balance
      } : null,
      monthsAnalyzed: monthsBack,
      monthsWithData: monthsWithData.length
    };
  }

  /**
   * Calcula tendência
   * @private
   */
  async _getTrend(userId, monthsBack) {
    const monthlyData = await this._getMonthlyData(userId, monthsBack);

    // Dividir em dois períodos para comparação
    const halfPoint = Math.floor(monthsBack / 2);
    const firstHalf = monthlyData.slice(0, halfPoint);
    const secondHalf = monthlyData.slice(halfPoint);

    // Calcular médias de cada período
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.balance, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.balance, 0) / secondHalf.length;

    // Calcular variação percentual
    const variation = firstHalfAvg !== 0
      ? ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100
      : 0;

    // Determinar tendência
    let trendType = 'stable';
    if (variation > 10) {
      trendType = 'growing';
    } else if (variation < -10) {
      trendType = 'declining';
    }

    // Calcular acumulado
    let accumulated = 0;
    const accumulatedData = monthlyData.map(m => {
      accumulated += m.balance;
      return {
        monthYear: m.monthYear,
        accumulated
      };
    });

    return {
      type: trendType,
      variation,
      firstHalfAverage: firstHalfAvg,
      secondHalfAverage: secondHalfAvg,
      accumulatedData,
      finalAccumulated: accumulated
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
