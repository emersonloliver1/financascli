/**
 * Report Entity - Entidade de domínio representando um relatório financeiro
 */
export class Report {
  constructor({
    type,
    period,
    data,
    summary,
    charts = [],
    userId = null,
    generatedAt = new Date()
  }) {
    this.type = type; // 'monthly', 'category', 'evolution', 'top', 'comparative', 'pattern'
    this.period = {
      start: period?.start ? (period.start instanceof Date ? period.start : new Date(period.start)) : null,
      end: period?.end ? (period.end instanceof Date ? period.end : new Date(period.end)) : null,
      label: period?.label || this._generatePeriodLabel(period)
    };
    this.data = data || {};
    this.summary = summary || {};
    this.charts = charts || [];
    this.userId = userId;
    this.generatedAt = generatedAt instanceof Date ? generatedAt : new Date(generatedAt);
  }

  /**
   * Gera um label para o período
   * @private
   */
  _generatePeriodLabel(period) {
    if (!period?.start) return 'Período não definido';

    const start = period.start instanceof Date ? period.start : new Date(period.start);
    const end = period.end instanceof Date ? period.end : new Date(period.end);

    if (this.type === 'monthly') {
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    }

    if (start.getTime() === end.getTime()) {
      return this._formatDate(start);
    }

    return `${this._formatDate(start)} a ${this._formatDate(end)}`;
  }

  /**
   * Formata uma data
   * @private
   */
  _formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Verifica se o relatório é do tipo mensal
   * @returns {boolean}
   */
  isMonthly() {
    return this.type === 'monthly';
  }

  /**
   * Verifica se o relatório é por categoria
   * @returns {boolean}
   */
  isCategory() {
    return this.type === 'category';
  }

  /**
   * Verifica se o relatório é de evolução
   * @returns {boolean}
   */
  isEvolution() {
    return this.type === 'evolution';
  }

  /**
   * Verifica se o relatório é de top transações
   * @returns {boolean}
   */
  isTop() {
    return this.type === 'top';
  }

  /**
   * Verifica se o relatório é comparativo
   * @returns {boolean}
   */
  isComparative() {
    return this.type === 'comparative';
  }

  /**
   * Verifica se o relatório é de análise de padrões
   * @returns {boolean}
   */
  isPattern() {
    return this.type === 'pattern';
  }

  /**
   * Verifica se o relatório tem dados
   * @returns {boolean}
   */
  hasData() {
    return Object.keys(this.data).length > 0;
  }

  /**
   * Verifica se o relatório tem gráficos
   * @returns {boolean}
   */
  hasCharts() {
    return this.charts && this.charts.length > 0;
  }

  /**
   * Formata valor monetário
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
   * Obtém o título do relatório
   * @returns {string}
   */
  getTitle() {
    const titles = {
      monthly: 'Relatório Mensal',
      category: 'Relatório por Categoria',
      evolution: 'Evolução Financeira',
      top: 'Maiores Transações',
      comparative: 'Relatório Comparativo',
      pattern: 'Análise de Padrões'
    };

    return titles[this.type] || 'Relatório';
  }

  /**
   * Obtém descrição do relatório
   * @returns {string}
   */
  getDescription() {
    const descriptions = {
      monthly: 'Resumo detalhado de receitas, despesas e transações',
      category: 'Evolução e análise de uma categoria específica',
      evolution: 'Evolução financeira dos últimos 12 meses',
      top: 'Ranking das maiores receitas e despesas',
      comparative: 'Comparação entre dois períodos',
      pattern: 'Análise de padrões e comportamentos financeiros'
    };

    return descriptions[this.type] || '';
  }

  /**
   * Valida o relatório
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.type) {
      errors.push('Tipo de relatório é obrigatório');
    }

    if (!this.userId) {
      errors.push('userId é obrigatório');
    }

    if (!this.period?.start && this.type !== 'pattern') {
      errors.push('Período inicial é obrigatório');
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
      type: this.type,
      title: this.getTitle(),
      description: this.getDescription(),
      period: {
        start: this.period.start?.toISOString(),
        end: this.period.end?.toISOString(),
        label: this.period.label
      },
      data: this.data,
      summary: this.summary,
      charts: this.charts,
      userId: this.userId,
      generatedAt: this.generatedAt.toISOString()
    };
  }
}
