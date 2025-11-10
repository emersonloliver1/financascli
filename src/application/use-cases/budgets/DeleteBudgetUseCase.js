/**
 * Caso de uso: Deletar orçamento
 */
export class DeleteBudgetUseCase {
  constructor(budgetRepository) {
    this.budgetRepository = budgetRepository;
  }

  /**
   * Executa a deleção de um orçamento
   * @param {string} userId
   * @param {number} budgetId
   * @returns {Promise<{success: boolean, errors?: string[]}>}
   */
  async execute(userId, budgetId) {
    try {
      // 1. Buscar orçamento existente
      const budget = await this.budgetRepository.findById(budgetId);

      if (!budget) {
        return { success: false, errors: ['Orçamento não encontrado'] };
      }

      // 2. Verificar se o orçamento pertence ao usuário
      if (budget.userId !== userId) {
        return { success: false, errors: ['Você não tem permissão para deletar este orçamento'] };
      }

      // 3. Deletar orçamento
      const deleted = await this.budgetRepository.delete(budgetId);

      if (!deleted) {
        return { success: false, errors: ['Erro ao deletar orçamento'] };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao deletar orçamento: ${error.message}`]
      };
    }
  }
}
