/**
 * Interface do serviço de autenticação
 * Define os métodos de autenticação que devem ser implementados
 */
export class IAuthService {
  /**
   * Registra um novo usuário
   * @param {Object} userData - {email, name, password}
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   */
  async register(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Faz login do usuário
   * @param {Object} credentials - {email, password}
   * @returns {Promise<{success: boolean, user?: User, error?: string}>}
   */
  async login(credentials) {
    throw new Error('Method not implemented');
  }

  /**
   * Faz logout do usuário
   * @returns {Promise<void>}
   */
  async logout() {
    throw new Error('Method not implemented');
  }

  /**
   * Obtém o usuário atual autenticado
   * @returns {Promise<User|null>}
   */
  async getCurrentUser() {
    throw new Error('Method not implemented');
  }

  /**
   * Verifica se há um usuário autenticado
   * @returns {Promise<boolean>}
   */
  async isAuthenticated() {
    throw new Error('Method not implemented');
  }
}
