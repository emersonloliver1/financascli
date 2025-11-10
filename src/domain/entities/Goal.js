/**
 * Entidade Goal - Representa uma meta financeira
 */
export class Goal {
  /**
   * Cria uma nova instância de Goal
   * @param {Object} data - Dados da meta
   * @param {number} data.id - ID da meta
   * @param {string} data.userId - ID do usuário
   * @param {string} data.name - Nome da meta
   * @param {number} data.targetAmount - Valor objetivo
   * @param {number} data.currentAmount - Valor atual
   * @param {number} data.monthlyContribution - Contribuição mensal estimada
   * @param {Date|string} data.deadline - Prazo para conclusão
   * @param {string} data.status - Status da meta (active, completed, cancelled)
   * @param {Date|string} data.completedAt - Data de conclusão
   * @param {Date|string} data.createdAt - Data de criação
   * @param {Date|string} data.updatedAt - Data de atualização
   */
  constructor({
    id,
    userId,
    name,
    targetAmount,
    currentAmount,
    monthlyContribution,
    deadline,
    status,
    completedAt,
    createdAt,
    updatedAt
  }) {
    this.validate({ name, targetAmount, deadline });

    this.id = id;
    this.userId = userId;
    this.name = name;
    this.targetAmount = parseFloat(targetAmount);
    this.currentAmount = parseFloat(currentAmount) || 0;
    this.monthlyContribution = monthlyContribution ? parseFloat(monthlyContribution) : null;
    this.deadline = deadline ? new Date(deadline) : null;
    this.status = status || 'active';
    this.completedAt = completedAt ? new Date(completedAt) : null;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
  }

  /**
   * Valida os dados da meta
   * @param {Object} data - Dados para validação
   * @throws {Error} Se os dados forem inválidos
   */
  validate({ name, targetAmount, deadline }) {
    if (!name || name.trim().length < 3) {
      throw new Error('Nome da meta deve ter pelo menos 3 caracteres');
    }

    if (!targetAmount || targetAmount <= 0) {
      throw new Error('Valor objetivo deve ser maior que zero');
    }

    if (deadline) {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate <= today) {
        throw new Error('Prazo deve ser uma data futura');
      }
    }
  }

  /**
   * Calcula o progresso atual da meta
   * @returns {Object} Informações de progresso
   */
  calculateProgress() {
    const percentage = (this.currentAmount / this.targetAmount) * 100;

    return {
      percentage: Math.min(percentage, 100),
      current: this.currentAmount,
      target: this.targetAmount,
      remaining: Math.max(this.targetAmount - this.currentAmount, 0),
      isCompleted: percentage >= 100
    };
  }

  /**
   * Estima a data de conclusão baseada na contribuição mensal
   * @returns {Object|null} Estimativa de conclusão ou null se não houver contribuição mensal
   */
  estimateCompletionDate() {
    if (!this.monthlyContribution || this.monthlyContribution <= 0) {
      return null;
    }

    const remaining = this.targetAmount - this.currentAmount;

    if (remaining <= 0) {
      return {
        date: new Date(),
        monthsNeeded: 0,
        isOnTrack: true
      };
    }

    const monthsNeeded = Math.ceil(remaining / this.monthlyContribution);

    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + monthsNeeded);

    return {
      date: estimatedDate,
      monthsNeeded,
      isOnTrack: !this.deadline || estimatedDate <= this.deadline
    };
  }

  /**
   * Calcula os dias restantes até o prazo
   * @returns {Object|null} Informações sobre dias restantes ou null se não houver prazo
   */
  getDaysRemaining() {
    if (!this.deadline) return null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const deadline = new Date(this.deadline);
    deadline.setHours(0, 0, 0, 0);

    const diff = deadline - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return {
      days,
      isOverdue: days < 0,
      isUrgent: days > 0 && days <= 30
    };
  }

  /**
   * Retorna a cor apropriada baseada no status e progresso
   * @returns {string} Nome da cor
   */
  getStatusColor() {
    const progress = this.calculateProgress();

    if (this.status === 'completed') return 'green-bright';

    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining?.isOverdue) return 'red';

    if (progress.percentage >= 80) return 'orange';
    if (progress.percentage >= 50) return 'yellow';

    return 'green';
  }

  /**
   * Retorna o ícone apropriado para o status
   * @returns {string} Emoji do ícone
   */
  getStatusIcon() {
    if (this.status === 'completed') return '✅';
    if (this.status === 'cancelled') return '❌';

    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining?.isOverdue) return '⚠️';
    if (daysRemaining?.isUrgent) return '⏰';

    const progress = this.calculateProgress();
    if (progress.percentage >= 80) return '🔥';
    if (progress.percentage >= 50) return '📈';

    return '🎯';
  }

  /**
   * Verifica se a meta está completa
   * @returns {boolean}
   */
  isComplete() {
    return this.calculateProgress().isCompleted || this.status === 'completed';
  }

  /**
   * Verifica se a meta está no prazo
   * @returns {boolean}
   */
  isOnTrack() {
    if (!this.deadline) return true;

    const estimate = this.estimateCompletionDate();
    if (!estimate) return true;

    return estimate.isOnTrack;
  }
}
