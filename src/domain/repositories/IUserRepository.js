/**
 * Interface do repositório de usuários
 * Define os métodos que devem ser implementados pela camada de infraestrutura
 */
export class IUserRepository {
  /**
   * Busca um usuário por ID
   * @param {string} id
   * @returns {Promise<User|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca um usuário por email
   * @param {string} email
   * @returns {Promise<User|null>}
   */
  async findByEmail(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Cria um novo usuário
   * @param {User} user
   * @returns {Promise<User>}
   */
  async create(user) {
    throw new Error('Method not implemented');
  }

  /**
   * Atualiza um usuário existente
   * @param {User} user
   * @returns {Promise<User>}
   */
  async update(user) {
    throw new Error('Method not implemented');
  }

  /**
   * Deleta um usuário
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
}
