import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository.js';
import { Category } from '../../domain/entities/Category.js';

/**
 * Implementação do repositório de categorias usando NeonDB
 */
export class CategoryRepository extends ICategoryRepository {
  constructor(database) {
    super();
    this.database = database;
  }

  /**
   * Converte row do banco para entidade Category
   * @private
   */
  _rowToCategory(row) {
    return new Category({
      id: row.id,
      userId: row.user_id,
      parentId: row.parent_id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      color: row.color,
      isDefault: row.is_default,
      createdAt: row.created_at
    });
  }

  /**
   * Busca uma categoria por ID
   */
  async findById(id) {
    const result = await this.database.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this._rowToCategory(result.rows[0]);
  }

  /**
   * Busca categorias de um usuário (incluindo globais)
   */
  async findByUserId(userId, type = null) {
    let query = `
      SELECT * FROM categories
      WHERE (user_id = $1 OR user_id IS NULL)
    `;
    const params = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const result = await this.database.query(query, params);

    return result.rows.map(row => this._rowToCategory(row));
  }

  /**
   * Busca subcategorias de uma categoria pai
   */
  async findByParentId(parentId) {
    const result = await this.database.query(
      'SELECT * FROM categories WHERE parent_id = $1 ORDER BY name ASC',
      [parentId]
    );

    return result.rows.map(row => this._rowToCategory(row));
  }

  /**
   * Busca apenas categorias globais (padrão do sistema)
   */
  async findGlobalCategories(type = null) {
    let query = 'SELECT * FROM categories WHERE user_id IS NULL';
    const params = [];

    if (type) {
      query += ' AND type = $1';
      params.push(type);
    }

    query += ' ORDER BY name ASC';

    const result = await this.database.query(query, params);

    return result.rows.map(row => this._rowToCategory(row));
  }

  /**
   * Busca categorias raiz (sem parent_id)
   */
  async findRootCategories(userId, type = null) {
    let query = `
      SELECT * FROM categories
      WHERE (user_id = $1 OR user_id IS NULL)
      AND parent_id IS NULL
    `;
    const params = [userId];

    if (type) {
      query += ' AND type = $2';
      params.push(type);
    }

    query += ' ORDER BY is_default DESC, name ASC';

    const result = await this.database.query(query, params);

    return result.rows.map(row => this._rowToCategory(row));
  }

  /**
   * Verifica se uma categoria tem transações vinculadas
   */
  async hasTransactions(categoryId) {
    const result = await this.database.query(
      'SELECT EXISTS(SELECT 1 FROM transactions WHERE category_id = $1)',
      [categoryId]
    );

    return result.rows[0].exists;
  }

  /**
   * Conta quantas subcategorias uma categoria possui
   */
  async countSubcategories(categoryId) {
    const result = await this.database.query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
      [categoryId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Cria uma nova categoria
   */
  async create(category) {
    const result = await this.database.query(
      `INSERT INTO categories (user_id, parent_id, name, type, icon, color, is_default, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        category.userId,
        category.parentId,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.isDefault,
        category.createdAt
      ]
    );

    return this._rowToCategory(result.rows[0]);
  }

  /**
   * Atualiza uma categoria existente
   */
  async update(category) {
    const result = await this.database.query(
      `UPDATE categories
       SET name = $1, icon = $2, color = $3
       WHERE id = $4
       RETURNING *`,
      [category.name, category.icon, category.color, category.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Categoria não encontrada');
    }

    return this._rowToCategory(result.rows[0]);
  }

  /**
   * Deleta uma categoria (cascata deleta subcategorias)
   */
  async delete(id) {
    const result = await this.database.query(
      'DELETE FROM categories WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Verifica se já existe uma categoria com o mesmo nome
   */
  async existsByName(userId, name, type, parentId = null, excludeId = null) {
    let query = `
      SELECT EXISTS(
        SELECT 1 FROM categories
        WHERE (user_id = $1 OR user_id IS NULL)
        AND LOWER(name) = LOWER($2)
        AND type = $3
        AND ($4::INTEGER IS NULL AND parent_id IS NULL OR parent_id = $4)
    `;
    const params = [userId, name, type, parentId];

    if (excludeId) {
      query += ' AND id != $5';
      params.push(excludeId);
    }

    query += ')';

    const result = await this.database.query(query, params);

    return result.rows[0].exists;
  }
}
