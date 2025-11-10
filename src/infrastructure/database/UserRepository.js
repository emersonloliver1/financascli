import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User } from '../../domain/entities/User.js';

/**
 * Implementação do repositório de usuários usando NeonDB
 */
export class UserRepository extends IUserRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  /**
   * Busca um usuário por ID
   */
  async findById(id) {
    const result = await this.database.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Busca um usuário por email
   */
  async findByEmail(email) {
    const result = await this.database.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Cria um novo usuário
   */
  async create(user) {
    const result = await this.database.query(
      `INSERT INTO users (id, email, name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, user.email, user.name, user.createdAt, user.updatedAt]
    );

    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Atualiza um usuário existente
   */
  async update(user) {
    user.updatedAt = new Date();

    const result = await this.database.query(
      `UPDATE users
       SET email = $1, name = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [user.email, user.name, user.updatedAt, user.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuário não encontrado');
    }

    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  /**
   * Deleta um usuário
   */
  async delete(id) {
    const result = await this.database.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }
}
