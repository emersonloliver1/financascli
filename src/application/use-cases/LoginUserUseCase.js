/**
 * Caso de uso: Login de usuário
 */
export class LoginUserUseCase {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Executa o login do usuário
   * @param {Object} credentials - {usernameOrEmail, password}
   * @returns {Promise<{success: boolean, user?: User, errors?: string[]}>}
   */
  async execute({ usernameOrEmail, password }) {
    const errors = [];

    // Validações básicas
    if (!usernameOrEmail || !usernameOrEmail.trim()) {
      errors.push('Username ou email é obrigatório');
    }

    if (!password || !password.trim()) {
      errors.push('Senha é obrigatória');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Tentar fazer login
    const result = await this.authService.login({ usernameOrEmail, password });

    if (!result.success) {
      return { success: false, errors: [result.error || 'Email ou senha inválidos'] };
    }

    return { success: true, user: result.user };
  }
}
