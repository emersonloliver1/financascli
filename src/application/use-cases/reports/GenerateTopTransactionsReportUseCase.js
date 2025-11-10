import { Report } from '../../../domain/entities/Report.js';

/**
 * Use Case: Gerar Relatório de Maiores Transações
 *
 * Gera um relatório com as maiores receitas e despesas incluindo:
 * - Top N maiores despesas
 * - Top N maiores receitas
 * - Período configurável
 * - Soma total
 * - Percentual do total
 */
export class GenerateTopTransactionsReportUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa o caso de uso
   * @param {string} userId
   * @param {Object} options - Opções de filtro
   * @param {string} options.period - 'today', 'week', 'month', 'year', 'custom'
   * @param {Date} options.startDate - Data inicial (para period='custom')
   * @param {Date} options.endDate - Data final (para period='custom')
   * @param {number} options.limit - Quantidade de transações (padrão: 10)
   * @returns {Promise<Report>}
   */
  async execute(userId, options = {}) {
    // Validação
    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    const {
      period = 'month',
      startDate,
      endDate,
      limit = 10
    } = options;

    if (limit < 1 || limit > 50) {
      throw new Error('limit deve estar entre 1 e 50');
    }

    try {
      // Calcular período
      const { start, end, label } = this._calculatePeriod(period, startDate, endDate);

      // Buscar dados em paralelo
      const [
        topExpenses,
        topIncomes,
        summary
      ] = await Promise.all([
        this._getTopTransactions(userId, 'expense', start, end, limit),
        this._getTopTransactions(userId, 'income', start, end, limit),
        this._getSummary(userId, start, end)
      ]);

      // Criar entidade Report
      return new Report({
        type: 'top',
        period: {
          start,
          end,
          period,
          label
        },
        data: {
          topExpenses,
          topIncomes,
          limit
        },
        summary,
        userId,
        generatedAt: new Date()
      });
    } catch (error) {
      throw new Error(`Erro ao gerar relatório de maiores transações: ${error.message}`);
    }
  }

  /**
   * Calcula o período baseado na opção selecionada
   * @private
   */
  _calculatePeriod(period, customStart, customEnd) {
    const now = new Date();
    let start, end, label;

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        label = 'Hoje';
        break;

      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Segunda-feira
        start = new Date(now);
        start.setDate(now.getDate() - diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        label = 'Esta Semana';
        break;

      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        label = `${this._getMonthName(now.getMonth() + 1)} ${now.getFullYear()}`;
        break;

      case 'year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        label = `${now.getFullYear()}`;
        break;

      case 'custom':
        if (!customStart || !customEnd) {
          throw new Error('startDate e endDate são obrigatórios para period=custom');
        }
        start = customStart instanceof Date ? customStart : new Date(customStart);
        end = customEnd instanceof Date ? customEnd : new Date(customEnd);
        label = `${this._formatDate(start)} a ${this._formatDate(end)}`;
        break;

      default:
        throw new Error('Período inválido');
    }

    return { start, end, label };
  }

  /**
   * Busca top transações de um tipo
   * @private
   */
  async _getTopTransactions(userId, type, startDate, endDate, limit) {
    const query = `
      SELECT
        t.id,
        t.date,
        t.amount,
        t.description,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM transactions t
      INNER JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
        AND t.type = $2
        AND t.date >= $3
        AND t.date <= $4
      ORDER BY t.amount DESC
      LIMIT $5
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      type,
      startDate,
      endDate,
      limit
    ]);

    return result.rows.map(row => ({
      id: row.id,
      date: row.date,
      amount: parseFloat(row.amount),
      description: row.description,
      category: {
        name: row.category_name,
        icon: row.category_icon,
        color: row.category_color
      }
    }));
  }

  /**
   * Calcula resumo geral do período
   * @private
   */
  async _getSummary(userId, startDate, endDate) {
    const query = `
      SELECT
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM transactions
      WHERE user_id = $1
        AND date >= $2
        AND date <= $3
      GROUP BY type
    `;

    const result = await this.transactionRepository.database.query(query, [
      userId,
      startDate,
      endDate
    ]);

    const incomeRow = result.rows.find(r => r.type === 'income');
    const expenseRow = result.rows.find(r => r.type === 'expense');

    const totalIncome = incomeRow ? parseFloat(incomeRow.total) : 0;
    const totalExpense = expenseRow ? parseFloat(expenseRow.total) : 0;
    const incomeCount = incomeRow ? parseInt(incomeRow.count) : 0;
    const expenseCount = expenseRow ? parseInt(expenseRow.count) : 0;

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount,
      expenseCount,
      totalCount: incomeCount + expenseCount
    };
  }

  /**
   * Formata data para exibição
   * @private
   */
  _formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Retorna o nome do mês
   * @private
   */
  _getMonthName(monthNumber) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1] || 'N/A';
  }
}
