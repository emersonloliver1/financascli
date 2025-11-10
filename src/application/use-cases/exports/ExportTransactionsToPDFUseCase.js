/**
 * Export Transactions to PDF Use Case
 *
 * Caso de uso para exportar transações para PDF
 * Parte da Application Layer
 *
 * @class ExportTransactionsToPDFUseCase
 */
export class ExportTransactionsToPDFUseCase {
  /**
   * Inicializa o caso de uso
   *
   * @param {Object} transactionRepository - Repositório de transações
   * @param {PDFExportService} pdfExportService - Serviço de exportação PDF
   */
  constructor(transactionRepository, pdfExportService) {
    this.transactionRepository = transactionRepository;
    this.pdfExportService = pdfExportService;
  }

  /**
   * Executa a exportação de transações
   *
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros para as transações
   * @param {Date} filters.startDate - Data inicial
   * @param {Date} filters.endDate - Data final
   * @param {string} filters.type - Tipo de transação ('income', 'expense')
   * @param {string} filters.categoryId - ID da categoria
   * @param {Object} options - Opções adicionais
   * @param {boolean} options.includeSummary - Incluir resumo no PDF
   * @param {string} options.filename - Nome customizado do arquivo
   * @returns {Promise<Object>} Informações do arquivo gerado
   */
  async execute(userId, filters = {}, options = {}) {
    try {
      // Validar userId
      if (!userId) {
        throw new Error('ID do usuário é obrigatório');
      }

      // Preparar filtros
      const normalizedFilters = this.normalizeFilters(filters);

      // 1. Buscar transações do repositório
      const transactionsResult = await this.transactionRepository.findByUserId(
        userId,
        {
          filters: normalizedFilters,
          limit: 10000, // Limite alto para exportação
          orderBy: 'date',
          orderDirection: 'DESC'
        }
      );

      if (!transactionsResult || !transactionsResult.data) {
        throw new Error('Erro ao buscar transações');
      }

      const transactions = transactionsResult.data;

      // Verificar se há transações
      if (transactions.length === 0) {
        console.warn('Nenhuma transação encontrada para os filtros especificados');
      }

      // 2. Calcular resumo financeiro
      const summary = this.calculateSummary(transactions);

      // 3. Preparar período para exibição
      const period = this.formatPeriod(normalizedFilters);

      // 4. Gerar PDF usando o serviço
      const pdfOptions = {
        includeSummary: options.includeSummary !== false,
        filename: options.filename,
        period
      };

      const result = await this.pdfExportService.generateTransactionsPDF(
        {
          transactions,
          summary
        },
        pdfOptions
      );

      // 5. Retornar resultado com informações adicionais
      return {
        success: true,
        ...result,
        transactionCount: transactions.length,
        summary,
        period,
        filters: normalizedFilters
      };
    } catch (error) {
      console.error('Erro ao exportar transações para PDF:', error);
      throw new Error(`Falha na exportação: ${error.message}`);
    }
  }

  /**
   * Normaliza os filtros recebidos
   *
   * @param {Object} filters - Filtros brutos
   * @returns {Object} Filtros normalizados
   */
  normalizeFilters(filters) {
    const normalized = {};

    // Data inicial
    if (filters.startDate) {
      normalized.startDate = filters.startDate instanceof Date
        ? filters.startDate
        : new Date(filters.startDate);
    }

    // Data final
    if (filters.endDate) {
      normalized.endDate = filters.endDate instanceof Date
        ? filters.endDate
        : new Date(filters.endDate);
    }

    // Se não houver datas, usar mês atual
    if (!normalized.startDate && !normalized.endDate) {
      const now = new Date();
      normalized.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      normalized.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Tipo
    if (filters.type && ['income', 'expense'].includes(filters.type)) {
      normalized.type = filters.type;
    }

    // Categoria
    if (filters.categoryId) {
      normalized.categoryId = filters.categoryId;
    }

    // Período predefinido (current-month, last-month, etc.)
    if (filters.period) {
      const periodDates = this.getPeriodDates(filters.period);
      normalized.startDate = periodDates.startDate;
      normalized.endDate = periodDates.endDate;
    }

    return normalized;
  }

  /**
   * Obtém datas baseadas em período predefinido
   *
   * @param {string} period - Período predefinido
   * @returns {Object} Datas de início e fim
   */
  getPeriodDates(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
    case 'current-month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'last-month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;

    case 'last-3-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'last-6-months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'current-year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;

    case 'last-year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  }

  /**
   * Calcula resumo financeiro das transações
   *
   * @param {Array} transactions - Lista de transações
   * @returns {Object} Resumo calculado
   */
  calculateSummary(transactions) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const balance = totalIncome - totalExpense;
    const count = transactions.length;

    // Estatísticas adicionais
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;

    const averageIncome = incomeCount > 0 ? totalIncome / incomeCount : 0;
    const averageExpense = expenseCount > 0 ? totalExpense / expenseCount : 0;

    return {
      totalIncome,
      totalExpense,
      balance,
      count,
      incomeCount,
      expenseCount,
      averageIncome,
      averageExpense
    };
  }

  /**
   * Formata período para exibição
   *
   * @param {Object} filters - Filtros com datas
   * @returns {Object} Período formatado
   */
  formatPeriod(filters) {
    if (!filters.startDate && !filters.endDate) {
      return null;
    }

    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };

    return {
      start: filters.startDate
        ? filters.startDate.toLocaleDateString('pt-BR', options)
        : 'Início',
      end: filters.endDate
        ? filters.endDate.toLocaleDateString('pt-BR', options)
        : 'Hoje'
    };
  }
}
