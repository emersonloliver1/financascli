/**
 * Interface do repositório de categorias
 * Define os métodos que devem ser implementados pela camada de infraestrutura
 */
export class ICategoryRepository {
  /**
   * Busca uma categoria por ID
   * @param {number} id
   * @returns {Promise<Category|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca categorias de um usuário (incluindo globais)
   * @param {string} userId - ID do usuário (null para buscar apenas globais)
   * @param {string} type - Tipo da categoria ('income' ou 'expense')
   * @returns {Promise<Category[]>}
   */
  async findByUserId(userId, type = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca subcategorias de uma categoria pai
   * @param {number} parentId - ID da categoria pai
   * @returns {Promise<Category[]>}
   */
  async findByParentId(parentId) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca apenas categorias globais (padrão do sistema)
   * @param {string} type - Tipo da categoria ('income' ou 'expense')
   * @returns {Promise<Category[]>}
   */
  async findGlobalCategories(type = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca categorias raiz (sem parent_id)
   * @param {string} userId - ID do usuário (null para globais)
   * @param {string} type - Tipo da categoria ('income' ou 'expense')
   * @returns {Promise<Category[]>}
   */
  async findRootCategories(userId, type = null) {
    throw new Error('Method not implemented');
  }

  /**
   * Verifica se uma categoria tem transações vinculadas
   * @param {number} categoryId - ID da categoria
   * @returns {Promise<boolean>}
   */
  async hasTransactions(categoryId) {
    throw new Error('Method not implemented');
  }

  /**
   * Conta quantas subcategorias uma categoria possui
   * @param {number} categoryId - ID da categoria
   * @returns {Promise<number>}
   */
  async countSubcategories(categoryId) {
    throw new Error('Method not implemented');
  }

  /**
   * Cria uma nova categoria
   * @param {Category} category
   * @returns {Promise<Category>}
   */
  async create(category) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza uma categoria existente
   * @param {Category} category
   * @returns {Promise<Category>}
   */
  async update(category) {
    throw new Error('Method not implemented');
  }

  /**
   * Deleta uma categoria
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Verifica se já existe uma categoria com o mesmo nome para o usuário
   * @param {string} userId - ID do usuário
   * @param {string} name - Nome da categoria
   * @param {string} type - Tipo da categoria
   * @param {number} parentId - ID da categoria pai (null para categoria raiz)
   * @param {number} excludeId - ID da categoria a excluir da busca (para updates)
   * @returns {Promise<boolean>}
   */
  async existsByName(userId, name, type, parentId = null, excludeId = null) {
    throw new Error('Method not implemented');
  }
}
