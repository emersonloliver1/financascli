/**
 * Budget Entity - Entidade de domínio representando um orçamento
 */
export class Budget {
  constructor({
    id,
    userId,
    categoryId,
    amount,
    period,
    startDate,
    endDate,
    rollover,
    createdAt,
    updatedAt,
    // Dados da categoria (quando há JOIN)
    categoryName,
    categoryIcon,
    categoryColor,
    categoryType,
    // Dados de uso (quando há cálculo)
    spent
  }) {
    this.id = id;
    this.userId = userId;
    this.categoryId = categoryId;
    this.amount = parseFloat(amount);
    this.period = period; // 'monthly', 'annual', 'custom'
    this.startDate = startDate instanceof Date ? startDate : new Date(startDate);
    this.endDate = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : this.calculateEndDate();
    this.rollover = rollover || false;
    this.createdAt = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : new Date();
    this.updatedAt = updatedAt ? (updatedAt instanceof Date ? updatedAt : new Date(updatedAt)) : new Date();

    // Dados da categoria (opcionais, vêm do JOIN)
    this.categoryName = categoryName;
    this.categoryIcon = categoryIcon;
    this.categoryColor = categoryColor;
    this.categoryType = categoryType;

    // Dados de uso (opcionais, vêm do cálculo)
    this.spent = spent !== undefined ? parseFloat(spent) : 0;
  }

  /**
   * Calcula a data final baseada no período
   * @returns {Date}
   */
  calculateEndDate() {
    if (!this.startDate) {
      return new Date();
    }

    const start = new Date(this.startDate);

    if (this.period === 'monthly') {
      // Último dia do mês
      return new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (this.period === 'annual') {
      // 31 de dezembro do ano
      return new Date(start.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return start;
  }

  /**
   * Valida o período
   * @returns {boolean}
   */
  isValidPeriod() {
    return ['monthly', 'annual', 'custom'].includes(this.period);
  }

  /**
   * Valida o valor (deve ser maior que 0)
   * @returns {boolean}
   */
  isValidAmount() {
    return this.amount && this.amount > 0 && !isNaN(this.amount);
  }

  /**
   * Valida as datas
   * @returns {boolean}
   */
  isValidDates() {
    if (!this.startDate || !(this.startDate instanceof Date)) {
      return false;
    }

    if (!this.endDate || !(this.endDate instanceof Date)) {
      return false;
    }

    // Verificar se são datas válidas
    if (isNaN(this.startDate.getTime()) || isNaN(this.endDate.getTime())) {
      return false;
    }

    // Data fim deve ser posterior à data início
    return this.endDate > this.startDate;
  }

  /**
   * Valida userId e categoryId (obrigatórios)
   * @returns {boolean}
   */
  hasRequiredIds() {
    return Boolean(this.userId && this.categoryId);
  }

  /**
   * Verifica se o orçamento está ativo em uma determinada data
   * @param {Date} date
   * @returns {boolean}
   */
  isActive(date = new Date()) {
    const checkDate = date instanceof Date ? date : new Date(date);
    return checkDate >= this.startDate && checkDate <= this.endDate;
  }

  /**
   * Calcula o uso do orçamento
   * @param {number} spent - Valor já gasto (opcional, usa this.spent se não fornecido)
   * @returns {Object}
   */
  calculateUsage(spent = null) {
    const spentAmount = spent !== null ? parseFloat(spent) : this.spent;

    return {
      spent: spentAmount,
      limit: this.amount,
      remaining: this.amount - spentAmount,
      percentage: (spentAmount / this.amount) * 100,
      exceeded: spentAmount > this.amount
    };
  }

  /**
   * Retorna o nível de alerta baseado no percentual usado
   * @param {number} percentage - Percentual usado (opcional, calcula se não fornecido)
   * @returns {string} 'safe', 'caution', 'warning', 'exceeded'
   */
  getAlertLevel(percentage = null) {
    const pct = percentage !== null ? percentage : this.calculateUsage().percentage;

    if (pct >= 100) return 'exceeded'; // 🔴 Vermelho
    if (pct >= 80) return 'warning';   // 🟠 Laranja
    if (pct >= 50) return 'caution';   // 🟡 Amarelo
    return 'safe';                     // 🟢 Verde
  }

  /**
   * Retorna o ícone de alerta baseado no nível
   * @param {string} level - Nível de alerta
   * @returns {string}
   */
  getAlertIcon(level = null) {
    const alertLevel = level || this.getAlertLevel();

    const icons = {
      safe: '✅',
      caution: '🟡',
      warning: '⚠️',
      exceeded: '🔴'
    };

    return icons[alertLevel] || '❓';
  }

  /**
   * Retorna o texto do alerta
   * @param {string} level - Nível de alerta
   * @returns {string}
   */
  getAlertText(level = null) {
    const alertLevel = level || this.getAlertLevel();

    const texts = {
      safe: 'OK',
      caution: 'ALERTA',
      warning: 'ATENÇÃO',
      exceeded: 'EXCEDIDO'
    };

    return texts[alertLevel] || 'DESCONHECIDO';
  }

  /**
   * Calcula a projeção de gasto baseada em dias corridos
   * @returns {Object}
   */
  calculateProjection() {
    const now = new Date();
    const usage = this.calculateUsage();

    // Total de dias no período
    const totalDays = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Dias que já passaram
    const daysPassed = Math.ceil((now - this.startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Dias restantes
    const daysRemaining = totalDays - daysPassed;

    // Média diária de gasto
    const dailyAverage = daysPassed > 0 ? usage.spent / daysPassed : 0;

    // Projeção para o final do período
    const projectedTotal = dailyAverage * totalDays;

    // Previsão de estouro
    const willExceed = projectedTotal > this.amount;
    const exceedDate = willExceed && dailyAverage > 0
      ? new Date(this.startDate.getTime() + (this.amount / dailyAverage) * (1000 * 60 * 60 * 24))
      : null;

    return {
      totalDays,
      daysPassed,
      daysRemaining,
      dailyAverage,
      projectedTotal,
      willExceed,
      exceedDate,
      projectedExcess: willExceed ? projectedTotal - this.amount : 0
    };
  }

  /**
   * Retorna o valor formatado em Reais
   * @param {number} value - Valor a formatar (opcional, usa this.amount se não fornecido)
   * @returns {string} Ex: "R$ 1.234,56"
   */
  getFormattedAmount(value = null) {
    const amount = value !== null ? parseFloat(value) : this.amount;
    const formatted = amount.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }

  /**
   * Retorna a data formatada
   * @param {Date} date - Data a formatar
   * @returns {string} Ex: "10/11/2025"
   */
  getFormattedDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Retorna o período formatado
   * @returns {string} Ex: "Novembro 2025" ou "01/11/2025 - 30/11/2025"
   */
  getFormattedPeriod() {
    if (this.period === 'monthly') {
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${months[this.startDate.getMonth()]} ${this.startDate.getFullYear()}`;
    } else if (this.period === 'annual') {
      return `${this.startDate.getFullYear()}`;
    } else {
      return `${this.getFormattedDate(this.startDate)} - ${this.getFormattedDate(this.endDate)}`;
    }
  }

  /**
   * Verifica se o orçamento pertence ao usuário
   * @param {string} currentUserId
   * @returns {boolean}
   */
  belongsTo(currentUserId) {
    return this.userId === currentUserId;
  }

  /**
   * Verifica se o orçamento pode ser editado
   * @param {string} currentUserId
   * @returns {boolean}
   */
  isEditable(currentUserId) {
    return this.belongsTo(currentUserId);
  }

  /**
   * Verifica se o orçamento pode ser deletado
   * @param {string} currentUserId
   * @returns {boolean}
   */
  isDeletable(currentUserId) {
    return this.belongsTo(currentUserId);
  }

  /**
   * Valida a entidade completa
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.hasRequiredIds()) {
      errors.push('UserId e CategoryId são obrigatórios');
    }

    if (!this.isValidAmount()) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!this.isValidPeriod()) {
      errors.push('Período inválido. Use: monthly, annual ou custom');
    }

    if (this.period === 'custom' && !this.endDate) {
      errors.push('Período customizado requer data de início e fim');
    }

    if (!this.isValidDates()) {
      errors.push('Datas inválidas. Data fim deve ser posterior à data início');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte para objeto simples (para JSON/API)
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      categoryId: this.categoryId,
      amount: this.amount,
      period: this.period,
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
      rollover: this.rollover,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Dados da categoria (se disponíveis)
      category: this.categoryName ? {
        name: this.categoryName,
        icon: this.categoryIcon,
        color: this.categoryColor,
        type: this.categoryType
      } : undefined,
      // Dados de uso (se disponíveis)
      usage: this.spent !== undefined ? this.calculateUsage() : undefined
    };
  }

  /**
   * Retorna um resumo curto para exibição
   * @returns {string}
   */
  getSummary() {
    const icon = this.categoryIcon || '💰';
    const category = this.categoryName || 'Categoria';
    const period = this.getFormattedPeriod();
    const usage = this.calculateUsage();
    const alert = this.getAlertIcon();

    return `${icon} ${category} | ${period} | ${this.getFormattedAmount(usage.spent)} / ${this.getFormattedAmount()} | ${alert}`;
  }
}
