/**
 * Caso de uso: Sugerir orçamentos baseados em histórico
 */
export class SuggestBudgetsUseCase {
  constructor(budgetRepository, categoryRepository) {
    this.budgetRepository = budgetRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a sugestão de orçamentos baseados em média histórica
   * @param {string} userId
   * @param {Object} options - {months?: number, period?: string}
   * @returns {Promise<{success: boolean, suggestions?: Array, errors?: string[]}>}
   */
  async execute(userId, options = {}) {
    try {
      const months = options.months || 3; // Padrão: 3 meses
      const period = options.period || 'monthly'; // Padrão: mensal

      // 1. Buscar categorias de despesa do usuário
      const categories = await this.categoryRepository.findByUserId(userId, 'expense');

      if (categories.length === 0) {
        return {
          success: true,
          suggestions: [],
          message: 'Nenhuma categoria de despesa encontrada'
        };
      }

      // 2. Para cada categoria, calcular média de gastos
      const suggestions = [];

      for (const category of categories) {
        // Calcular média histórica
        const average = await this.budgetRepository.getAverageSpending(
          userId,
          category.id,
          months
        );

        // Apenas sugerir se houver média (ou seja, se já houve gastos)
        if (average > 0) {
          // Adicionar margem de segurança de 10%
          const suggestedAmount = Math.ceil(average * 1.1);

          // Verificar se já existe orçamento ativo para esta categoria
          const now = new Date();
          const startDate = period === 'monthly'
            ? new Date(now.getFullYear(), now.getMonth(), 1)
            : new Date(now.getFullYear(), 0, 1);

          const endDate = period === 'monthly'
            ? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
            : new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

          const existingBudget = await this.budgetRepository.findByCategoryAndPeriod(
            userId,
            category.id,
            startDate,
            endDate
          );

          suggestions.push({
            category: {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color
            },
            historicalAverage: average,
            suggestedAmount,
            period,
            startDate,
            endDate,
            monthsAnalyzed: months,
            hasExistingBudget: !!existingBudget,
            existingBudgetAmount: existingBudget ? existingBudget.amount : null,
            difference: existingBudget ? suggestedAmount - existingBudget.amount : null,
            recommendation: this._generateRecommendation(
              average,
              suggestedAmount,
              existingBudget
            )
          });
        }
      }

      // 3. Ordenar sugestões por valor sugerido (maior primeiro)
      suggestions.sort((a, b) => b.suggestedAmount - a.suggestedAmount);

      return {
        success: true,
        suggestions,
        summary: {
          totalCategories: categories.length,
          categoriesWithHistory: suggestions.length,
          categoriesWithoutHistory: categories.length - suggestions.length,
          totalSuggestedBudget: suggestions.reduce((sum, s) => sum + s.suggestedAmount, 0),
          monthsAnalyzed: months,
          period
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao gerar sugestões de orçamento: ${error.message}`]
      };
    }
  }

  /**
   * Gera recomendação textual baseada nos dados
   * @private
   */
  _generateRecommendation(average, suggested, existingBudget) {
    if (!existingBudget) {
      return `Criar orçamento de R$ ${this._formatCurrency(suggested)} baseado em média histórica`;
    }

    const difference = suggested - existingBudget.amount;
    const percentChange = (difference / existingBudget.amount) * 100;

    if (Math.abs(percentChange) < 5) {
      return 'Orçamento atual está adequado';
    } else if (difference > 0) {
      return `Considere aumentar em R$ ${this._formatCurrency(difference)} (${percentChange.toFixed(1)}%)`;
    } else {
      return `Possível reduzir em R$ ${this._formatCurrency(Math.abs(difference))} (${Math.abs(percentChange).toFixed(1)}%)`;
    }
  }

  /**
   * Formata valor em moeda
   * @private
   */
  _formatCurrency(value) {
    const formatted = value.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  }
}
