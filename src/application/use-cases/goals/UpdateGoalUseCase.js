/**
 * Caso de uso para atualizar uma meta financeira
 */
export class UpdateGoalUseCase {
  /**
   * @param {GoalRepository} goalRepository - Repositório de metas
   */
  constructor(goalRepository) {
    this.goalRepository = goalRepository;
  }

  /**
   * Executa o caso de uso
   * @param {number} goalId - ID da meta
   * @param {Object} data - Dados para atualização
   * @param {string} data.name - Nome da meta (opcional)
   * @param {number} data.targetAmount - Valor objetivo (opcional)
   * @param {number} data.monthlyContribution - Contribuição mensal (opcional)
   * @param {Date|string} data.deadline - Prazo (opcional)
   * @returns {Promise<Goal>} Meta atualizada
   */
  async execute(goalId, data) {
    // Verificar se a meta existe
    const existingGoal = await this.goalRepository.findById(goalId);
    if (!existingGoal) {
      throw new Error('Meta não encontrada');
    }

    // Validar dados se fornecidos
    if (data.name !== undefined && data.name.trim().length < 3) {
      throw new Error('Nome da meta deve ter pelo menos 3 caracteres');
    }

    if (data.targetAmount !== undefined && data.targetAmount <= 0) {
      throw new Error('Valor objetivo deve ser maior que zero');
    }

    if (data.deadline !== undefined && data.deadline) {
      const deadlineDate = new Date(data.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineDate <= today) {
        throw new Error('Prazo deve ser uma data futura');
      }
    }

    // Preparar dados para atualização
    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.targetAmount !== undefined) updateData.target_amount = data.targetAmount;
    if (data.monthlyContribution !== undefined) updateData.monthly_contribution = data.monthlyContribution;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;

    // Atualizar no banco
    return await this.goalRepository.update(goalId, updateData);
  }
}
