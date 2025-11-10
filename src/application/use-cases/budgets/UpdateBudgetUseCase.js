import { Budget } from '../../../domain/entities/Budget.js';

/**
 * Caso de uso: Atualizar orçamento
 */
export class UpdateBudgetUseCase {
  constructor(budgetRepository) {
    this.budgetRepository = budgetRepository;
  }

  /**
   * Executa a atualização de um orçamento
   * @param {string} userId
   * @param {number} budgetId
   * @param {Object} updateData - {amount?, period?, startDate?, endDate?, rollover?}
   * @returns {Promise<{success: boolean, budget?: Budget, errors?: string[]}>}
   */
  async execute(userId, budgetId, updateData) {
    try {
      // 1. Buscar orçamento existente
      const existingBudget = await this.budgetRepository.findById(budgetId);

      if (!existingBudget) {
        return { success: false, errors: ['Orçamento não encontrado'] };
      }

      // 2. Verificar se o orçamento pertence ao usuário
      if (existingBudget.userId !== userId) {
        return { success: false, errors: ['Você não tem permissão para editar este orçamento'] };
      }

      // 3. Criar entidade Budget com dados atualizados para validar
      const updatedBudget = new Budget({
        ...existingBudget,
        amount: updateData.amount !== undefined ? updateData.amount : existingBudget.amount,
        period: updateData.period !== undefined ? updateData.period : existingBudget.period,
        startDate: updateData.startDate !== undefined ? updateData.startDate : existingBudget.startDate,
        endDate: updateData.endDate !== undefined ? updateData.endDate : existingBudget.endDate,
        rollover: updateData.rollover !== undefined ? updateData.rollover : existingBudget.rollover
      });

      const validation = updatedBudget.validate();

      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      // 4. Se as datas mudaram, verificar se não há conflito com outro orçamento
      if (
        (updateData.startDate && updateData.startDate !== existingBudget.startDate) ||
        (updateData.endDate && updateData.endDate !== existingBudget.endDate)
      ) {
        const exists = await this.budgetRepository.existsForCategoryAndPeriod(
          userId,
          existingBudget.categoryId,
          updatedBudget.startDate,
          updatedBudget.endDate,
          budgetId // Excluir o próprio orçamento da verificação
        );

        if (exists) {
          return {
            success: false,
            errors: ['Já existe outro orçamento para esta categoria neste período']
          };
        }
      }

      // 5. Atualizar orçamento
      const updated = await this.budgetRepository.update(budgetId, {
        amount: updateData.amount,
        period: updateData.period,
        startDate: updateData.startDate,
        endDate: updateData.endDate,
        rollover: updateData.rollover
      });

      // Buscar novamente para incluir dados da categoria e spent
      const budgetWithDetails = await this.budgetRepository.findById(updated.id);

      return { success: true, budget: budgetWithDetails };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao atualizar orçamento: ${error.message}`]
      };
    }
  }
}
