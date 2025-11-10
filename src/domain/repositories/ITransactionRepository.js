/**
 * Interface do repositório de transações
 * Define o contrato que deve ser implementado pela camada de infraestrutura
 */
export class ITransactionRepository {
  /**
   * Cria uma nova transação
   * @param {Transaction} transaction
   * @returns {Promise<Transaction>}
   */
  async create(transaction) {
    throw new Error('Method "create" must be implemented');
  }

  /**
   * Busca uma transação por ID
   * @param {string} id - UUID da transação
   * @returns {Promise<Transaction|null>}
   */
  async findById(id) {
    throw new Error('Method "findById" must be implemented');
  }

  /**
   * Lista transações de um usuário com paginação
   * @param {string} userId - UUID do usuário
   * @param {Object} options - { page: number, limit: number, orderBy: string, orderDirection: 'ASC'|'DESC' }
   * @returns {Promise<Transaction[]>}
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Method "findByUserId" must be implemented');
  }

  /**
   * Busca transações com filtros avançados
   * @param {Object} filters - {
   *   userId: string,
   *   type?: 'income'|'expense',
   *   categoryId?: string,
   *   startDate?: Date,
   *   endDate?: Date,
   *   minAmount?: number,
   *   maxAmount?: number,
   *   search?: string (busca na descrição),
   *   page?: number,
   *   limit?: number
   * }
   * @returns {Promise<Transaction[]>}
   */
  async findByFilters(filters) {
    throw new Error('Method "findByFilters" must be implemented');
  }

  /**
   * Atualiza uma transação existente
   * @param {string} id - UUID da transação
   * @param {Object} data - Dados a serem atualizados
   * @returns {Promise<Transaction>}
   */
  async update(id, data) {
    throw new Error('Method "update" must be implemented');
  }

  /**
   * Deleta uma transação
   * @param {string} id - UUID da transação
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method "delete" must be implemented');
  }

  /**
   * Conta o total de transações (para paginação)
   * @param {string} userId - UUID do usuário
   * @param {Object} filters - Mesmos filtros de findByFilters
   * @returns {Promise<number>}
   */
  async count(userId, filters = {}) {
    throw new Error('Method "count" must be implemented');
  }

  /**
   * Calcula o resumo financeiro (total de receitas e despesas)
   * @param {string} userId - UUID do usuário
   * @param {Object} filters - { startDate?: Date, endDate?: Date, categoryId?: string }
   * @returns {Promise<{totalIncome: number, totalExpense: number, balance: number, count: number}>}
   */
  async getSummary(userId, filters = {}) {
    throw new Error('Method "getSummary" must be implemented');
  }

  /**
   * Verifica se uma transação existe e pertence ao usuário
   * @param {string} id - UUID da transação
   * @param {string} userId - UUID do usuário
   * @returns {Promise<boolean>}
   */
  async existsAndBelongsToUser(id, userId) {
    throw new Error('Method "existsAndBelongsToUser" must be implemented');
  }
}
