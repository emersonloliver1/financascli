import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Relatório Comparativo
 *
 * Gera um relatório comparando dois períodos (geralmente dois meses) incluindo:
 * - Comparação de receitas, despesas e saldo
 * - Diferenças absolutas e percentuais
 * - Categorias com maior variação
 * - Análise de mudanças
 */
export class GenerateComparativeReportUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {Object} period1 - Primeiro período { month, year }
   * @param {Object} period2 - Segundo período { month, year }
   * @returns {Promise<Report>}
   */
  async execute(userId, period1, period2) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    if (!period1 || !period1.month || !period1.year) {
      throw new Error('period1 com month e year são obrigatórios');
    }

    if (!period2 || !period2.month || !period2.year) {
      throw new Error('period2 com month e year são obrigatórios');
    }

    this._validateMonth(period1.month);
    this._validateMonth(period2.month);
    this._validateYear(period1.year);
    this._validateYear(period2.year);

    try {
      // Definir períodos
      const start1 = new Date(period1.year, period1.month - 1, 1);
      const end1 = new Date(period1.year, period1.month, 0, 23, 59, 59, 999);

      const start2 = new Date(period2.year, period2.month - 1, 1);
      const end2 = new Date(period2.year, period2.month, 0, 23, 59, 59, 999);

      // Buscar dados em paralelo
      const [
        summary1,
        summary2,
        categoryComparison,
        insights
      ] = await Promise.all([
        this._getPeriodSummary(userId, start1, end1),
        this._getPeriodSummary(userId, start2, end2),
        this._getCategoryComparison(userId, start1, end1, start2, end2),
        this._generateInsights(userId, start1, end1, start2, end2)
      ]);

      // Calcular diferenças
      const comparison = this._calculateComparison(summary1, summary2);

      // Criar entidade Report
      return new Report({
        type: 'comparative',
        period: {
          period1: {
            start: start1,
            end: end1,
            month: period1.month,
            year: period1.year,
            label: this._getMonthLabel(period1.month, period1.year)
          },
          period2: {
            start: start2,
            end: end2,
            month: period2.month,
            year: period2.year,
            label: this._getMonthLabel(period2.month, period2.year)
          }
        },
        data: {
          summary1,
          summary2,
          comparison,
          categoryComparison,
          insights
        },
        summary: {
          period1Total: summary1.balance,
          period2Total: summary2.balance,
          difference: comparison.balanceDiff,
          variationPercentage: comparison.balanceVariationPercent
        },
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar relatório comparativo: ${error.message}`);
    }
  }

  /**
   * Busca resumo de um período
   * @private
   */
  async _getPeriodSummary(userId, startDate, endDate) {
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

    const income = incomeRow ? parseFloat(incomeRow.total) : 0;
    const expense = expenseRow ? parseFloat(expenseRow.total) : 0;

    return {
      income,
      expense,
      balance: income - expense,
      incomeCount: incomeRow ? parseInt(incomeRow.count) : 0,
      expenseCount: expenseRow ? parseInt(expenseRow.count) : 0,
      totalCount: (incomeRow ? parseInt(incomeRow.count) : 0) + (expenseRow ? parseInt(expenseRow.count) : 0),
      averageIncome: incomeRow ? parseFloat(incomeRow.average) : 0,
      averageExpense: expenseRow ? parseFloat(expenseRow.average) : 0
    };
  }

  /**
   * Calcula comparação entre dois períodos
   * @private
   */
  _calculateComparison(summary1, summary2) {
    const incomeDiff = summary2.income - summary1.income;
    const expenseDiff = summary2.expense - summary1.expense;
    const balanceDiff = summary2.balance - summary1.balance;

    const incomeVariationPercent = summary1.income > 0
      ? (incomeDiff / summary1.income) * 100
      : 0;

    const expenseVariationPercent = summary1.expense > 0
      ? (expenseDiff / summary1.expense) * 100
      : 0;

    const balanceVariationPercent = summary1.balance !== 0
      ? (balanceDiff / Math.abs(summary1.balance)) * 100
      : 0;

    return {
      incomeDiff,
      expenseDiff,
      balanceDiff,
      incomeVariationPercent,
      expenseVariationPercent,
      balanceVariationPercent,
      transactionCountDiff: summary2.totalCount - summary1.totalCount
    };
  }

  /**
   * Compara categorias entre os dois períodos
   * @private
   */
  async _getCategoryComparison(userId, start1, end1, start2, end2) {
    const query = `
      WITH period1 AS (
        SELECT
          c.id,
          c.name,
          c.icon,
          COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        INNER JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND t.date >= $2
          AND t.date <= $3
        GROUP BY c.id, c.name, c.icon
      ),
      period2 AS (
        SELECT
          c.id,
          c.name,
          c.icon,
          COALESCE(SUM(t.amount), 0) as total
        FROM transactions t
        INNER JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = $1
          AND t.type = 'expense'
          AND t.date >= $4
          AND t.date <= $5
        GROUP BY c.id, c.name, c.icon
      )
      SELECT
        COALESCE(p1.id, p2.id) as category_id,
        COALESCE(p1.name, p2.name) as category_name,
        COALESCE(p1.icon, p2.icon) as category_icon,
        COALESCE(p1.total, 0) as period1_total,
        COALESCE(p2.total, 0) as period2_total
      FROM period1 p1
      FULL OUTER JOIN period2 p2 ON p1.id = p2.id
      ORDER BY ABS(COALESCE(p2.total, 0) - COALESCE(p1.total, 0)) DESC
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      start1,
      end1,
      start2,
      end2
    ]);

    return result.rows.map(row => {
      const period1Total = parseFloat(row.period1_total);
      const period2Total = parseFloat(row.period2_total);
      const difference = period2Total - period1Total;
      const variationPercent = period1Total > 0
        ? (difference / period1Total) * 100
        : 0;

      return {
        categoryId: row.category_id,
        categoryName: row.category_name,
        icon: row.category_icon,
        period1Total,
        period2Total,
        difference,
        variationPercent
      };
    });
  }

  /**
   * Gera insights sobre as mudanças
   * @private
   */
  async _generateInsights(userId, start1, end1, start2, end2) {
    const insights = [];

    const [summary1, summary2] = await Promise.all([
      this._getPeriodSummary(userId, start1, end1),
      this._getPeriodSummary(userId, start2, end2)
    ]);

    const comparison = this._calculateComparison(summary1, summary2);

    // Insight sobre receitas
    if (Math.abs(comparison.incomeVariationPercent) > 10) {
      insights.push({
        type: 'income',
        severity: comparison.incomeDiff > 0 ? 'positive' : 'negative',
        message: `Receitas ${comparison.incomeDiff > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(comparison.incomeVariationPercent).toFixed(1)}%`
      });
    }

    // Insight sobre despesas
    if (Math.abs(comparison.expenseVariationPercent) > 10) {
      insights.push({
        type: 'expense',
        severity: comparison.expenseDiff > 0 ? 'negative' : 'positive',
        message: `Despesas ${comparison.expenseDiff > 0 ? 'aumentaram' : 'diminuíram'} ${Math.abs(comparison.expenseVariationPercent).toFixed(1)}%`
      });
    }

    // Insight sobre saldo
    if (Math.abs(comparison.balanceVariationPercent) > 15) {
      insights.push({
        type: 'balance',
        severity: comparison.balanceDiff > 0 ? 'positive' : 'negative',
        message: `Saldo ${comparison.balanceDiff > 0 ? 'melhorou' : 'piorou'} significativamente (${Math.abs(comparison.balanceVariationPercent).toFixed(1)}%)`
      });
    }

    return insights;
  }

  /**
   * Valida mês
   * @private
   */
  _validateMonth(month) {
    if (!month || month < 1 || month > 12) {
      throw new Error('Mês inválido (deve ser entre 1 e 12)');
    }
  }

  /**
   * Valida ano
   * @private
   */
  _validateYear(year) {
    if (!year || year < 2000 || year > 2100) {
      throw new Error('Ano inválido');
    }
  }

  /**
   * Retorna o label do mês
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
