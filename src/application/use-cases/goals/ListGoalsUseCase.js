import { Goal } from '../../../domain/entities/Goal.js';

/**
 * Caso de uso para listar metas financeiras
 */
export class ListGoalsUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @param {string} options.status - Filtrar por status (active, completed, cancelled)
   * @returns {Promise<Array>} Lista de metas com informações calculadas
   */
  async execute(userId, options = {}) {
    const { status = 'active' } = options;

    // Buscar metas
    let goals;
    if (status === 'active') {
      goals = await this.goalRepository.findActiveByUserId(userId);
    } else {
      goals = await this.goalRepository.findByUserId(userId, { status });
    }

    // Enriquecer com informações calculadas
    return goals.map(goalData => {
      const goal = new Goal(goalData);
      const progress = goal.calculateProgress();
      const estimate = goal.estimateCompletionDate();
      const daysRemaining = goal.getDaysRemaining();

      return {
        ...goalData,
        progress,
        estimate,
        daysRemaining,
        color: goal.getStatusColor(),
        icon: goal.getStatusIcon()
      };
    });
  }
}
