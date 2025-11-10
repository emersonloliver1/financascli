/**
 * Caso de uso: Listar orçamentos
 */
export class ListBudgetsUseCase {
  constructor(budgetRepository) {
    this.budgetRepository = budgetRepository;
  }

  /**
   * Executa a listagem de orçamentos
   * @param {string} userId
   * @param {Object} options - {activeOnly?: boolean, categoryId?: number, period?: string}
   * @returns {Promise<{success: boolean, budgets?: Array, errors?: string[]}>}
   */
  async execute(userId, options = {}) {
    try {
      let budgets;

      // Se activeOnly for true, buscar apenas orçamentos ativos
      if (options.activeOnly) {
        budgets = await this.budgetRepository.findActiveByUserId(userId);
      } else {
        // Caso contrário, buscar todos com filtros opcionais
        budgets = await this.budgetRepository.findByUserId(userId, {
          categoryId: options.categoryId,
          period: options.period
        });
      }

      // Enriquecer cada orçamento com informações calculadas
      const enrichedBudgets = budgets.map(budget => {
        const usage = budget.calculateUsage();
        const alertLevel = budget.getAlertLevel(usage.percentage);
        const projection = budget.calculateProjection();

        return {
          ...budget,
          usage,
          alertLevel,
          alertIcon: budget.getAlertIcon(alertLevel),
          alertText: budget.getAlertText(alertLevel),
          projection,
          formattedPeriod: budget.getFormattedPeriod()
        };
      });

      return {
        success: true,
        budgets: enrichedBudgets
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao listar orçamentos: ${error.message}`]
      };
    }
  }
}
