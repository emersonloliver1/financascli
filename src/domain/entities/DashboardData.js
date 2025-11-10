/**
 * DashboardData Entity - Entidade de domínio representando dados do dashboard
 */
export class DashboardData {
  constructor({
    currentMonth = {},
    previousMonth = {},
    balance = {},
    topCategories = [],
    monthlyTrend = [],
    userId = null,
    generatedAt = new Date()
  }) {
    this.userId = userId;
    this.generatedAt = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);

    // Dados do mês atual
    this.currentMonth = {
      income: parseFloat(currentMonth.income || 0),
      expense: parseFloat(currentMonth.expense || 0),
      balance: parseFloat(currentMonth.balance || 0),
      count: parseInt(currentMonth.count || 0),
      month: currentMonth.month || this._getCurrentMonth(),
      year: currentMonth.year || new Date().getFullYear()
    };

    // Dados do mês anterior
    this.previousMonth = {
      income: parseFloat(previousMonth.income || 0),
      expense: parseFloat(previousMonth.expense || 0),
      balance: parseFloat(previousMonth.balance || 0),
      count: parseInt(previousMonth.count || 0),
      month: previousMonth.month || this._getPreviousMonth(),
      year: previousMonth.year || this._getPreviousYear()
    };

    // Saldo geral (todas as transações)
    this.balance = {
      totalIncome: parseFloat(balance.totalIncome || 0),
      totalExpense: parseFloat(balance.totalExpense || 0),
      balance: parseFloat(balance.balance || 0),
      count: parseInt(balance.count || 0)
    };

    // Top 5 categorias (maiores gastos do mês)
    this.topCategories = topCategories.map(cat => ({
      id: cat.id,
      name: cat.name || 'Sem nome',
      icon: cat.icon || '📂',
      color: cat.color || '#999',
      total: parseFloat(cat.total || 0),
      count: parseInt(cat.count || 0),
      percentage: parseFloat(cat.percentage || 0)
    }));

    // Tendência mensal (últimos 6 meses)
    this.monthlyTrend = monthlyTrend.map(trend => ({
      month: trend.month,
      monthName: trend.monthName || this._getMonthName(trend.month),
      year: trend.year || new Date().getFullYear(),
      income: parseFloat(trend.income || 0),
      expense: parseFloat(trend.expense || 0),
      balance: parseFloat(trend.balance || 0)
    }));
  }

  /**
   * Obtém o mês atual (1-12)
   * @private
   */
  _getCurrentMonth() {
    return new Date().getMonth() + 1;
  }

  /**
   * Obtém o mês anterior (1-12)
   * @private
   */
  _getPreviousMonth() {
    const current = new Date();
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    return previous.getMonth() + 1;
  }

  /**
   * Obtém o ano do mês anterior
   * @private
   */
  _getPreviousYear() {
    const current = new Date();
    const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    return previous.getFullYear();
  }

  /**
   * Obtém o nome do mês
   * @private
   */
  _getMonthName(monthNumber) {
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    return months[monthNumber - 1] || 'N/A';
  }

  /**
   * Calcula a variação percentual entre mês atual e anterior
   * @param {'income'|'expense'|'balance'} type
   * @returns {number}
   */
  calculateMonthVariation(type = 'expense') {
    const current = this.currentMonth[type];
    const previous = this.previousMonth[type];

    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return ((current - previous) / previous) * 100;
  }

  /**
   * Calcula a tendência de gastos (crescente, decrescente, estável)
   * @returns {'increasing'|'decreasing'|'stable'}
   */
  getExpenseTrend() {
    const variation = this.calculateMonthVariation('expense');

    if (variation > 5) return 'increasing';
    if (variation < -5) return 'decreasing';
    return 'stable';
  }

  /**
   * Retorna símbolo da tendência
   * @returns {string}
   */
  getTrendSymbol() {
    const trend = this.getExpenseTrend();
    switch (trend) {
    case 'increasing': return '↑';
    case 'decreasing': return '↓';
    default: return '→';
    }
  }

  /**
   * Retorna descrição da tendência
   * @returns {string}
   */
  getTrendDescription() {
    const trend = this.getExpenseTrend();
    const variation = Math.abs(this.calculateMonthVariation('expense'));

    switch (trend) {
    case 'increasing':
      return `AUMENTANDO (${variation.toFixed(1)}%)`;
    case 'decreasing':
      return `DIMINUINDO (${variation.toFixed(1)}%)`;
    default:
      return 'ESTÁVEL (variação < 5%)';
    }
  }

  /**
   * Calcula a média diária de gastos do mês atual
   * @returns {number}
   */
  getDailyAverageExpense() {
    const today = new Date();
    const dayOfMonth = today.getDate();

    if (dayOfMonth === 0) return 0;

    return this.currentMonth.expense / dayOfMonth;
  }

  /**
   * Projeta os gastos do mês com base nos dias corridos
   * @returns {number}
   */
  getProjectedMonthExpense() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    if (dayOfMonth === 0) return 0;

    const dailyAverage = this.getDailyAverageExpense();
    return dailyAverage * daysInMonth;
  }

  /**
   * Verifica se o saldo geral é positivo
   * @returns {boolean}
   */
  hasPositiveBalance() {
    return this.balance.balance > 0;
  }

  /**
   * Verifica se o mês atual está positivo
   * @returns {boolean}
   */
  isCurrentMonthPositive() {
    return this.currentMonth.balance > 0;
  }

  /**
   * Verifica se há dados suficientes
   * @returns {boolean}
   */
  hasData() {
    return this.balance.count > 0;
  }

  /**
   * Verifica se há dados do mês atual
   * @returns {boolean}
   */
  hasCurrentMonthData() {
    return this.currentMonth.count > 0;
  }

  /**
   * Formata valor em Reais
   * @param {number} value
   * @returns {string}
   */
  static formatCurrency(value) {
    const formatted = Math.abs(value).toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }

  /**
   * Formata porcentagem
   * @param {number} value
   * @returns {string}
   */
  static formatPercentage(value) {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Retorna resumo do mês atual formatado
   * @returns {Object}
   */
  getCurrentMonthSummary() {
    return {
      income: DashboardData.formatCurrency(this.currentMonth.income),
      expense: DashboardData.formatCurrency(this.currentMonth.expense),
      balance: DashboardData.formatCurrency(this.currentMonth.balance),
      isPositive: this.isCurrentMonthPositive(),
      count: this.currentMonth.count
    };
  }

  /**
   * Retorna resumo do saldo geral formatado
   * @returns {Object}
   */
  getBalanceSummary() {
    return {
      totalIncome: DashboardData.formatCurrency(this.balance.totalIncome),
      totalExpense: DashboardData.formatCurrency(this.balance.totalExpense),
      balance: DashboardData.formatCurrency(this.balance.balance),
      isPositive: this.hasPositiveBalance(),
      count: this.balance.count
    };
  }

  /**
   * Retorna indicadores formatados
   * @returns {Object}
   */
  getIndicators() {
    return {
      trend: this.getTrendDescription(),
      trendSymbol: this.getTrendSymbol(),
      dailyAverage: DashboardData.formatCurrency(this.getDailyAverageExpense()),
      projected: DashboardData.formatCurrency(this.getProjectedMonthExpense()),
      variation: DashboardData.formatPercentage(this.calculateMonthVariation('expense'))
    };
  }

  /**
   * Valida os dados do dashboard
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.userId) {
      errors.push('userId é obrigatório');
    }

    if (this.currentMonth.income < 0 || this.currentMonth.expense < 0) {
      errors.push('Valores do mês atual não podem ser negativos');
    }

    if (this.balance.totalIncome < 0 || this.balance.totalExpense < 0) {
      errors.push('Valores do saldo geral não podem ser negativos');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte para JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      userId: this.userId,
      generatedAt: this.generatedAt.toISOString(),
      currentMonth: this.currentMonth,
      previousMonth: this.previousMonth,
      balance: this.balance,
      topCategories: this.topCategories,
      monthlyTrend: this.monthlyTrend,
      indicators: this.getIndicators(),
      summary: {
        current: this.getCurrentMonthSummary(),
        balance: this.getBalanceSummary()
      }
    };
  }
}
