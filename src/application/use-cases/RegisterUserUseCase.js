import { User } from '../../domain/entities/User.js';

/**
 * Caso de uso: Registrar novo usuário
 */
export class RegisterUserUseCase {
  constructor(authService, userRepository) {
    this.authService = authService;
    this.userRepository = userRepository;
  }

  /**
   * Executa o registro de um novo usuário
   * @param {Object} userData - {email, name, password, confirmPassword}
   * @returns {Promise<{success: boolean, user?: User, errors?: string[]}>}
   */
  async execute({ email, name, password, confirmPassword }) {
    const errors = [];

    // Validar senha e confirmação
    if (!password || password.length < 6) {
      errors.push('Senha deve ter no mínimo 6 caracteres');
    }

    if (password !== confirmPassword) {
      errors.push('As senhas não coincidem');
    }

    // Criar e validar entidade User
    const user = new User({ email, name });
    const validation = user.validate();

    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    // Se houver erros de validação, retornar
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Verificar se email já existe
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return { success: false, errors: ['Email já cadastrado'] };
    }

    // Registrar usuário através do serviço de autenticação
    const result = await this.authService.register({ email, name, password });

    if (!result.success) {
      return { success: false, errors: [result.error || 'Erro ao registrar usuário'] };
    }

    return { success: true, user: result.user };
  }
}
