/**
 * Caso de uso para adicionar uma contribuição a uma meta
 */
export class AddContributionUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {number} goalId - ID da meta
   * @param {number} amount - Valor da contribuição
   * @param {string} description - Descrição da contribuição (opcional)
   * @param {string} userId - ID do usuário (para validação)
   * @returns {Promise<Object>} Contribuição e meta atualizada
   */
  async execute(goalId, amount, description = null, userId = null) {
    // Validar valor
    if (!amount || amount === 0) {
      throw new Error('Valor da contribuição não pode ser zero');
    }

    // Verificar se a meta existe
    const goal = await this.goalRepository.findById(goalId);
    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    // Validar usuário se fornecido
    if (userId && goal.userId !== userId) {
      throw new Error('Você não tem permissão para adicionar contribuições a esta meta');
    }

    // Validar se meta está ativa
    if (goal.status !== 'active') {
      throw new Error('Não é possível adicionar contribuições a uma meta inativa');
    }

    // Adicionar contribuição
    const result = await this.goalRepository.addContribution(
      goalId,
      amount,
      description
    );

    // Verificar se meta foi concluída
    const wasCompleted = result.goal.status === 'completed' && goal.status !== 'completed';

    return {
      ...result,
      celebration: wasCompleted,
      progress: result.goal.calculateProgress()
    };
  }
}
