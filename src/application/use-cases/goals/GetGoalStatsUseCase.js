/**
 * Caso de uso para obter estatísticas das metas
 */
export class GetGoalStatsUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Estatísticas das metas
   */
  async execute(userId) {
    // Obter estatísticas básicas
    const stats = await this.goalRepository.getStats(userId);

    // Calcular média mensal geral
    const monthlyAverage = await this.goalRepository.getMonthlyAverage(userId);

    // Buscar metas recentes concluídas
    const completedGoals = await this.goalRepository.findCompletedByUserId(userId, {
      limit: 5
    });

    // Calcular taxa de sucesso
    const totalGoals = stats.activeCount + stats.completedCount + stats.cancelledCount;
    const successRate = totalGoals > 0
      ? (stats.completedCount / totalGoals) * 100
      : 0;

    return {
      ...stats,
      monthlyAverage,
      successRate: Math.round(successRate),
      totalGoals,
      recentCompletedGoals: completedGoals
    };
  }
}
