/**
 * Category Entity - Entidade de domínio representando uma categoria
 */
export class Category {
  constructor({ id, userId, parentId, name, type, icon, color, isDefault, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.parentId = parentId;
    this.name = name;
    this.type = type;
    this.icon = icon;
    this.color = color;
    this.isDefault = isDefault || false;
    this.createdAt = createdAt || new Date();
    this.subcategories = []; // Para armazenar subcategorias quando listadas
  }

  /**
   * Valida o nome (mínimo 2 caracteres, máximo 100)
   * @returns {boolean}
   */
  isValidName() {
    return this.name &&
           this.name.trim().length >= 2 &&
           this.name.trim().length <= 100;
  }

  /**
   * Valida o tipo (income ou expense)
   * @returns {boolean}
   */
  isValidType() {
    return this.type === 'income' || this.type === 'expense';
  }

  /**
   * Valida o ícone (emoji único ou vazio)
   * @returns {boolean}
   */
  isValidIcon() {
    if (!this.icon) return true; // Ícone é opcional

    // Validar se é um emoji válido (1-10 caracteres)
    return this.icon.trim().length >= 1 && this.icon.trim().length <= 10;
  }

  /**
   * Valida a cor (nome ou código hex)
   * @returns {boolean}
   */
  isValidColor() {
    if (!this.color) return true; // Cor é opcional

    // Validar se é hex (#000000) ou nome de cor (1-20 caracteres)
    const hexRegex = /^#[0-9A-F]{6}$/i;
    return hexRegex.test(this.color) ||
           (this.color.trim().length >= 1 && this.color.trim().length <= 20);
  }

  /**
   * Verifica se é uma subcategoria
   * @returns {boolean}
   */
  isSubcategory() {
    return this.parentId !== null && this.parentId !== undefined;
  }

  /**
   * Verifica se é uma categoria global (sem usuário específico)
   * @returns {boolean}
   */
  isGlobal() {
    return this.userId === null || this.userId === undefined;
  }

  /**
   * Verifica se a categoria pode ser editada pelo usuário
   * @param {string} currentUserId - ID do usuário atual
   * @returns {boolean}
   */
  isEditable(currentUserId) {
    // Categorias padrão (globais) não podem ser editadas
    if (this.isDefault) return false;

    // Categorias globais não padrão não podem ser editadas
    if (this.isGlobal()) return false;

    // Somente o dono pode editar
    return this.userId === currentUserId;
  }

  /**
   * Verifica se a categoria pode ser deletada pelo usuário
   * @param {string} currentUserId - ID do usuário atual
   * @returns {boolean}
   */
  isDeletable(currentUserId) {
    // Mesmas regras de edição
    return this.isEditable(currentUserId);
  }

  /**
   * Valida a entidade completa
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.isValidName()) {
      errors.push('Nome deve ter entre 2 e 100 caracteres');
    }

    if (!this.isValidType()) {
      errors.push('Tipo deve ser "income" ou "expense"');
    }

    if (!this.isValidIcon()) {
      errors.push('Ícone inválido (máximo 10 caracteres)');
    }

    if (!this.isValidColor()) {
      errors.push('Cor inválida (use código hex #000000 ou nome da cor)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Converte para objeto simples
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      parentId: this.parentId,
      name: this.name,
      type: this.type,
      icon: this.icon,
      color: this.color,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      subcategories: this.subcategories.map(sub => sub.toJSON())
    };
  }
}
