import bcrypt from 'bcryptjs';
import { IAuthService } from '../../application/interfaces/IAuthService.js';
import { User } from '../../domain/entities/User.js';

/**
 * Implementação do serviço de autenticação com bcrypt
 * Autenticação segura para aplicação de terminal
 */
export class NeonAuthService extends IAuthService {
  constructor(userRepository, database) {
    super();
    this.userRepository = userRepository;
    this.database = database;
    this.currentUser = null;
  }

  /**
   * Registra um novo usuário
   */
  async register({ email, name, password }) {
    try {
      // Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return { success: false, error: 'Email já cadastrado' };
      }

      // Criar ID único para o usuário
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Criar hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Criar usuário
      const user = new User({
        id: userId,
        email,
        name
      });

      // Salvar usuário no banco
      const savedUser = await this.userRepository.create(user);

      // Salvar senha hash na tabela de autenticação
      await this.database.query(
        'INSERT INTO user_auth (user_id, password_hash) VALUES ($1, $2)',
        [userId, passwordHash]
      );

      // Definir como usuário atual
      this.currentUser = savedUser;

      return { success: true, user: savedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Faz login do usuário
   */
  async login({ email, password }) {
    try {
      // Buscar usuário por email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // Buscar hash da senha
      const authResult = await this.database.query(
        'SELECT password_hash FROM user_auth WHERE user_id = $1',
        [user.id]
      );

      if (authResult.rows.length === 0) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      const passwordHash = authResult.rows[0].password_hash;

      // Verificar senha
      const passwordMatch = await bcrypt.compare(password, passwordHash);
      if (!passwordMatch) {
        return { success: false, error: 'Email ou senha inválidos' };
      }

      // Definir como usuário atual
      this.currentUser = user;

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Faz logout do usuário
   */
  async logout() {
    this.currentUser = null;
  }

  /**
   * Obtém o usuário atual autenticado
   */
  async getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Verifica se há um usuário autenticado
   */
  async isAuthenticated() {
    return this.currentUser !== null;
  }
}
