/**
 * Transaction Entity - Entidade de domínio representando uma transação financeira
 */
export class Transaction {
  constructor({
    id,
    userId,
    type,
    categoryId,
    amount,
    description,
    date,
    createdAt,
    updatedAt,
    // Dados da categoria (quando há JOIN)
    categoryName,
    categoryIcon,
    categoryColor
  }) {
    this.id = id;
    this.userId = userId;
    this.type = type; // 'income' ou 'expense'
    this.categoryId = categoryId;
    this.amount = parseFloat(amount);
    this.description = description || '';
    this.date = date instanceof Date ? date : new Date(date);
    this.createdAt = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : new Date();
    this.updatedAt = updatedAt ? (updatedAt instanceof Date ? updatedAt : new Date(updatedAt)) : new Date();

    // Dados da categoria (opcionais, vêm do JOIN)
    this.categoryName = categoryName;
    this.categoryIcon = categoryIcon;
    this.categoryColor = categoryColor;
  }

  /**
   * Valida o tipo da transação
   * @returns {boolean}
   */
  isValidType() {
    return this.type === 'income' || this.type === 'expense';
  }

  /**
   * Valida o valor (deve ser maior que 0)
   * @returns {boolean}
   */
  isValidAmount() {
    return this.amount && this.amount > 0 && !isNaN(this.amount);
  }

  /**
   * Valida a data (não pode ser no futuro)
   * @returns {boolean}
   */
  isValidDate() {
    if (!this.date || !(this.date instanceof Date)) {
      return false;
    }

    // Verificar se é uma data válida
    if (isNaN(this.date.getTime())) {
      return false;
    }

    // Data não pode ser no futuro (com margem de 1 dia para timezone)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    return this.date <= tomorrow;
  }

  /**
   * Valida a descrição (máximo 200 caracteres)
   * @returns {boolean}
   */
  isValidDescription() {
    return this.description.length <= 200;
  }

  /**
   * Valida userId e categoryId (obrigatórios)
   * @returns {boolean}
   */
  hasRequiredIds() {
    return Boolean(this.userId && this.categoryId);
  }

  /**
   * Verifica se é uma receita
   * @returns {boolean}
   */
  isIncome() {
    return this.type === 'income';
  }

  /**
   * Verifica se é uma despesa
   * @returns {boolean}
   */
  isExpense() {
    return this.type === 'expense';
  }

  /**
   * Retorna o valor formatado em Reais
   * @returns {string} Ex: "R$ 1.234,56"
   */
  getFormattedAmount() {
    const formatted = this.amount.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }

  /**
   * Retorna a data formatada
   * @returns {string} Ex: "10/11/2025"
   */
  getFormattedDate() {
    const day = String(this.date.getDate()).padStart(2, '0');
    const month = String(this.date.getMonth() + 1).padStart(2, '0');
    const year = this.date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Retorna o valor com sinal (+ ou -)
   * @returns {string} Ex: "+R$ 1.234,56" ou "-R$ 1.234,56"
   */
  getSignedAmount() {
    const sign = this.isIncome() ? '+' : '-';
    return `${sign}${this.getFormattedAmount()}`;
  }

  /**
   * Verifica se a transação pertence ao usuário
   * @param {string} currentUserId
   * @returns {boolean}
   */
  belongsTo(currentUserId) {
    return this.userId === currentUserId;
  }

  /**
   * Verifica se a transação pode ser editada
   * @param {string} currentUserId
   * @returns {boolean}
   */
  isEditable(currentUserId) {
    return this.belongsTo(currentUserId);
  }

  /**
   * Verifica se a transação pode ser deletada
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

    if (!this.isValidType()) {
      errors.push('Tipo deve ser "income" ou "expense"');
    }

    if (!this.isValidAmount()) {
      errors.push('Valor deve ser maior que zero');
    }

    if (!this.isValidDate()) {
      errors.push('Data inválida ou no futuro');
    }

    if (!this.isValidDescription()) {
      errors.push('Descrição deve ter no máximo 200 caracteres');
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
      type: this.type,
      categoryId: this.categoryId,
      amount: this.amount,
      description: this.description,
      date: this.date.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Dados da categoria (se disponíveis)
      category: this.categoryName ? {
        name: this.categoryName,
        icon: this.categoryIcon,
        color: this.categoryColor
      } : undefined
    };
  }

  /**
   * Retorna um resumo curto para exibição
   * @returns {string}
   */
  getSummary() {
    const icon = this.categoryIcon || (this.isIncome() ? '📈' : '📉');
    const category = this.categoryName || 'Sem categoria';
    const amount = this.getSignedAmount();
    const date = this.getFormattedDate();
    const desc = this.description ? ` - ${this.description}` : '';

    return `${icon} ${category} | ${amount} | ${date}${desc}`;
  }
}
