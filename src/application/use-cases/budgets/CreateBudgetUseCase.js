import { Budget } from '../../../domain/entities/Budget.js';

/**
 * Caso de uso: Criar novo orçamento
 */
export class CreateBudgetUseCase {
  constructor(budgetRepository, categoryRepository) {
    this.budgetRepository = budgetRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a criação de um novo orçamento
   * @param {string} userId
   * @param {Object} budgetData - {categoryId, amount, period, startDate, endDate?, rollover?}
   * @returns {Promise<{success: boolean, budget?: Budget, errors?: string[]}>}
   */
  async execute(userId, budgetData) {
    const errors = [];

    // 1. Validar categoria existe
    const category = await this.categoryRepository.findById(budgetData.categoryId);
    if (!category) {
      return { success: false, errors: ['Categoria não encontrada'] };
    }

    // 2. Verificar se categoria pertence ao usuário ou é global
    if (!category.isGlobal() && category.userId !== userId) {
      return { success: false, errors: ['Você não pode criar orçamento para categorias de outros usuários'] };
    }

    // 3. Apenas categorias de despesa podem ter orçamento
    if (category.type !== 'expense') {
      return { success: false, errors: ['Orçamentos só podem ser criados para categorias de despesa'] };
    }

    // 4. Criar e validar entidade Budget
    const budget = new Budget({
      userId,
      categoryId: budgetData.categoryId,
      amount: budgetData.amount,
      period: budgetData.period,
      startDate: budgetData.startDate,
      endDate: budgetData.endDate,
      rollover: budgetData.rollover || false
    });

    const validation = budget.validate();

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    // 5. Verificar se já existe orçamento para esta categoria neste período
    const exists = await this.budgetRepository.existsForCategoryAndPeriod(
      userId,
      budgetData.categoryId,
      budget.startDate,
      budget.endDate
    );

    if (exists) {
      return {
        success: false,
        errors: ['Já existe um orçamento para esta categoria neste período']
      };
    }

    // 6. Criar orçamento
    try {
      const createdBudget = await this.budgetRepository.create(budget);

      // Buscar novamente para incluir dados da categoria e spent
      const budgetWithDetails = await this.budgetRepository.findById(createdBudget.id);

      return { success: true, budget: budgetWithDetails };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao criar orçamento: ${error.message}`]
      };
    }
  }
}
