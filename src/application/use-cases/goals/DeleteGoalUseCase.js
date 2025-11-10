/**
 * Caso de uso para deletar uma meta financeira
 */
export class DeleteGoalUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {number} goalId - ID da meta
   * @param {string} userId - ID do usuário (para validação)
   * @returns {Promise<boolean>} true se deletado com sucesso
   */
  async execute(goalId, userId) {
    // Verificar se a meta existe e pertence ao usuário
    const goal = await this.goalRepository.findById(goalId);

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    if (goal.userId !== userId) {
      throw new Error('Você não tem permissão para deletar esta meta');
    }

    // Deletar meta
    return await this.goalRepository.delete(goalId);
  }
}
