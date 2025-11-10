/**
 * Caso de uso: Listar transações com paginação e filtros
 */
export class ListTransactionsUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa a listagem de transações
   * @param {Object} params - {
   *   userId: string (obrigatório),
   *   page?: number,
   *   limit?: number,
   *   filters?: {
   *     type?: 'income'|'expense',
   *     categoryId?: string,
   *     startDate?: Date|string,
   *     endDate?: Date|string,
   *     minAmount?: number,
   *     maxAmount?: number,
   *     search?: string
   *   }
   * }
   * @returns {Promise<{
   *   success: boolean,
   *   transactions?: Transaction[],
   *   pagination?: {page, limit, total, totalPages},
   *   summary?: {totalIncome, totalExpense, balance},
   *   errors?: string[]
   * }>}
   */
  async execute({ userId, page = 1, limit = 20, filters = {} }) {
    try {
      // Validar parâmetros
      if (!userId) {
        return { success: false, errors: ['UserId é obrigatório'] };
      }

      // Validar page e limit
      const validPage = Math.max(1, parseInt(page) || 1);
      const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 por página

      // Preparar filtros
      const preparedFilters = {
        userId,
        page: validPage,
        limit: validLimit,
        ...filters
      };

      // Converter datas de string para Date se necessário
      if (preparedFilters.startDate && typeof preparedFilters.startDate === 'string') {
        preparedFilters.startDate = new Date(preparedFilters.startDate);
      }

      if (preparedFilters.endDate && typeof preparedFilters.endDate === 'string') {
        preparedFilters.endDate = new Date(preparedFilters.endDate);
      }

      // Buscar transações com filtros
      const transactions = await this.transactionRepository.findByFilters(preparedFilters);

      // Contar total de transações (para paginação)
      const total = await this.transactionRepository.count(userId, filters);
      const totalPages = Math.ceil(total / validLimit);

      // Calcular resumo financeiro (com os mesmos filtros)
      const summary = await this.transactionRepository.getSummary(userId, filters);

      return {
        success: true,
        transactions,
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages
        },
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          balance: summary.balance
        }
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao listar transações: ${error.message}`]
      };
    }
  }
}
