/**
 * Interface do repositório de metas financeiras
 */
export class IGoalRepository {
  /**
   * Cria uma nova meta
   * @param {Goal} goal - Meta a ser criada
   * @returns {Promise<Goal>} Meta criada
   */
  async create(goal) {
    throw new Error('Método create() deve ser implementado');
  }

  /**
   * Busca uma meta por ID
   * @param {number} id - ID da meta
   * @returns {Promise<Goal|null>} Meta encontrada ou null
   */
  async findById(id) {
    throw new Error('Método findById() deve ser implementado');
  }

  /**
   * Busca todas as metas de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de filtro
   * @returns {Promise<Array>} Lista de metas
   */
  async findByUserId(userId, options = {}) {
    throw new Error('Método findByUserId() deve ser implementado');
  }

  /**
   * Busca metas ativas de um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<Array>} Lista de metas ativas
   */
  async findActiveByUserId(userId) {
    throw new Error('Método findActiveByUserId() deve ser implementado');
  }

  /**
   * Atualiza uma meta
   * @param {number} id - ID da meta
   * @param {Object} data - Dados para atualização
   * @returns {Promise<Goal>} Meta atualizada
   */
  async update(id, data) {
    throw new Error('Método update() deve ser implementado');
  }

  /**
   * Deleta uma meta
   * @param {number} id - ID da meta
   * @returns {Promise<boolean>} true se deletado com sucesso
   */
  async delete(id) {
    throw new Error('Método delete() deve ser implementado');
  }

  /**
   * Adiciona uma contribuição a uma meta
   * @param {number} goalId - ID da meta
   * @param {number} amount - Valor da contribuição
   * @param {string} description - Descrição da contribuição
   * @returns {Promise<Object>} Contribuição e meta atualizada
   */
  async addContribution(goalId, amount, description) {
    throw new Error('Método addContribution() deve ser implementado');
  }

  /**
   * Obtém as contribuições de uma meta
   * @param {number} goalId - ID da meta
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Lista de contribuições
   */
  async getContributions(goalId, options = {}) {
    throw new Error('Método getContributions() deve ser implementado');
  }

  /**
   * Calcula a média mensal de contribuições
   * @param {string} userId - ID do usuário
   * @param {number|null} goalId - ID da meta (opcional)
   * @returns {Promise<number>} Média mensal
   */
  async getMonthlyAverage(userId, goalId = null) {
    throw new Error('Método getMonthlyAverage() deve ser implementado');
  }

  /**
   * Obtém estatísticas gerais das metas
   * @param {string} userId - ID do usuário
   * @returns {Promise<Object>} Estatísticas
   */
  async getStats(userId) {
    throw new Error('Método getStats() deve ser implementado');
  }

  /**
   * Busca metas concluídas de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} options - Opções de paginação
   * @returns {Promise<Array>} Lista de metas concluídas
   */
  async findCompletedByUserId(userId, options = {}) {
    throw new Error('Método findCompletedByUserId() deve ser implementado');
  }
}
