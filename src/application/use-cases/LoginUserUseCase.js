/**
 * Caso de uso: Login de usuário
 */
export class LoginUserUseCase {
  constructor(authService) {
    this.authService = authService;
  }

  /**
   * Executa o login do usuário
   * @param {Object} credentials - {email, password}
   * @returns {Promise<{success: boolean, user?: User, errors?: string[]}>}
   */
  async execute({ email, password }) {
    const errors = [];

    // Validações básicas
    if (!email || !email.trim()) {
      errors.push('Email é obrigatório');
    }

    if (!password || !password.trim()) {
      errors.push('Senha é obrigatória');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Tentar fazer login
    const result = await this.authService.login({ email, password });

    if (!result.success) {
      return { success: false, errors: [result.error || 'Email ou senha inválidos'] };
    }

    return { success: true, user: result.user };
  }
}
