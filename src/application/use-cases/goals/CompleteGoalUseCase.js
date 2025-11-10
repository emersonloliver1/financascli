/**
 * Caso de uso para marcar uma meta como concluída ou cancelada manualmente
 */
export class CompleteGoalUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {number} goalId - ID da meta
   * @param {string} newStatus - Novo status (completed ou cancelled)
   * @param {string} userId - ID do usuário (para validação)
   * @returns {Promise<Goal>} Meta atualizada
   */
  async execute(goalId, newStatus, userId) {
    // Validar status
    if (!['completed', 'cancelled', 'active'].includes(newStatus)) {
      throw new Error('Status inválido. Use: completed, cancelled ou active');
    }

    // Verificar se a meta existe e pertence ao usuário
    const goal = await this.goalRepository.findById(goalId);

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    if (goal.userId !== userId) {
      throw new Error('Você não tem permissão para alterar esta meta');
    }

    // Atualizar status
    const updateData = {
      status: newStatus
    };

    // Se estiver reativando, remover completed_at
    if (newStatus === 'active' && goal.status === 'completed') {
      updateData.completed_at = null;
    }

    return await this.goalRepository.update(goalId, updateData);
  }
}
