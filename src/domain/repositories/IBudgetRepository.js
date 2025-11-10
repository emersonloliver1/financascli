/**
 * Interface do Repositório de Orçamentos
 * Define os métodos que devem ser implementados pelo repositório concreto
 */
export class IBudgetRepository {
  /**
   * Cria um novo orçamento
   * @param {Budget} budget
   * @returns {Promise<Budget>}
   */
  async create(budget) {
    throw new Error('Método create() não implementado');
  }

  /**
   * Busca um orçamento por ID
   * @param {number} id
   * @returns {Promise<Budget|null>}
   */
  async findById(id) {
    throw new Error('Método findById() não implementado');
  }

  /**
   * Busca orçamentos de um usuário
   * @param {string} userId
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Budget[]>}
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Método findByUserId() não implementado');
  }

  /**
   * Busca orçamentos ativos de um usuário
   * @param {string} userId
   * @param {Date} date - Data de referência (default: hoje)
   * @returns {Promise<Budget[]>}
   */
  async findActiveByUserId(userId, date = new Date()) {
    throw new Error('Método findActiveByUserId() não implementado');
  }

  /**
   * Busca orçamento por categoria e período
   * @param {string} userId
   * @param {number} categoryId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Budget|null>}
   */
  async findByCategoryAndPeriod(userId, categoryId, startDate, endDate) {
    throw new Error('Método findByCategoryAndPeriod() não implementado');
  }

  /**
   * Atualiza um orçamento existente
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Budget>}
   */
  async update(id, data) {
    throw new Error('Método update() não implementado');
  }

  /**
   * Deleta um orçamento
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Método delete() não implementado');
  }

  /**
   * Calcula o valor gasto em uma categoria durante um período
   * @param {string} userId
   * @param {number} categoryId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<number>}
   */
  async getSpentAmount(userId, categoryId, startDate, endDate) {
    throw new Error('Método getSpentAmount() não implementado');
  }

  /**
   * Busca orçamentos que estão em alerta
   * @param {string} userId
   * @param {number} thresholdPercentage - Percentual mínimo de uso (default: 50)
   * @returns {Promise<Budget[]>}
   */
  async findBudgetsInAlert(userId, thresholdPercentage = 50) {
    throw new Error('Método findBudgetsInAlert() não implementado');
  }

  /**
   * Calcula a média de gastos históricos de uma categoria
   * @param {string} userId
   * @param {number} categoryId
   * @param {number} months - Número de meses a considerar
   * @returns {Promise<number>}
   */
  async getAverageSpending(userId, categoryId, months = 3) {
    throw new Error('Método getAverageSpending() não implementado');
  }

  /**
   * Verifica se já existe um orçamento para a categoria no período
   * @param {string} userId
   * @param {number} categoryId
   * @param {Date} startDate
   * @param {Date} endDate
   * @param {number} excludeId - ID do orçamento a excluir da verificação (para updates)
   * @returns {Promise<boolean>}
   */
  async existsForCategoryAndPeriod(userId, categoryId, startDate, endDate, excludeId = null) {
    throw new Error('Método existsForCategoryAndPeriod() não implementado');
  }
}
