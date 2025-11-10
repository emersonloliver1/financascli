import { Goal } from '../../../domain/entities/Goal.js';

/**
 * Caso de uso para criar uma nova meta financeira
 */
export class CreateGoalUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId - ID do usuário
   * @param {Object} data - Dados da meta
   * @param {string} data.name - Nome da meta
   * @param {number} data.targetAmount - Valor objetivo
   * @param {number} data.monthlyContribution - Contribuição mensal estimada (opcional)
   * @param {Date|string} data.deadline - Prazo para conclusão (opcional)
   * @returns {Promise<Goal>} Meta criada
   */
  async execute(userId, data) {
    // Validar dados e criar entidade
    const goal = new Goal({
      userId,
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: 0,
      monthlyContribution: data.monthlyContribution || null,
      deadline: data.deadline || null,
      status: 'active'
    });

    // Persistir no banco
    return await this.goalRepository.create(goal);
  }
}
