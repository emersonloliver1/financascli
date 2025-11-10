/**
 * Caso de uso: Obter alertas de orçamentos
 */
export class GetBudgetAlertsUseCase {
  constructor(budgetRepository) {
    this.budgetRepository = budgetRepository;
  }

  /**
   * Executa a busca de orçamentos em alerta
   * @param {string} userId
   * @param {number} thresholdPercentage - Percentual mínimo para considerar alerta (default: 50)
   * @returns {Promise<{success: boolean, alerts?: Object, errors?: string[]}>}
   */
  async execute(userId, thresholdPercentage = 50) {
    try {
      // Buscar orçamentos em alerta
      const budgetsInAlert = await this.budgetRepository.findBudgetsInAlert(
        userId,
        thresholdPercentage
      );

      // Categorizar alertas por nível
      const categorized = {
        exceeded: [],    // 🔴 >= 100%
        warning: [],     // 🟠 >= 80%
        caution: [],     // 🟡 >= 50%
        total: budgetsInAlert.length
      };

      budgetsInAlert.forEach(budget => {
        const usage = budget.calculateUsage();
        const alertLevel = budget.getAlertLevel(usage.percentage);
        const projection = budget.calculateProjection();

        const enrichedBudget = {
          ...budget,
          usage,
          alertLevel,
          alertIcon: budget.getAlertIcon(alertLevel),
          alertText: budget.getAlertText(alertLevel),
          projection,
          formattedPeriod: budget.getFormattedPeriod()
        };

        if (alertLevel === 'exceeded') {
          categorized.exceeded.push(enrichedBudget);
        } else if (alertLevel === 'warning') {
          categorized.warning.push(enrichedBudget);
        } else if (alertLevel === 'caution') {
          categorized.caution.push(enrichedBudget);
        }
      });

      // Calcular estatísticas
      const stats = {
        totalBudgets: budgetsInAlert.length,
        exceededCount: categorized.exceeded.length,
        warningCount: categorized.warning.length,
        cautionCount: categorized.caution.length,
        safeCount: 0 // Não incluídos na busca
      };

      return {
        success: true,
        alerts: {
          categorized,
          stats,
          hasAlerts: budgetsInAlert.length > 0
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao buscar alertas de orçamento: ${error.message}`]
      };
    }
  }
}
