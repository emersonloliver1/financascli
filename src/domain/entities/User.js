/**
 * User Entity - Entidade de domínio representando um usuário
 */
export class User {
  constructor({ id, email, name, createdAt, updatedAt }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  /**
   * Valida o email
   * @returns {boolean}
   */
  isValidEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  /**
   * Valida o nome (mínimo 3 caracteres)
   * @returns {boolean}
   */
  isValidName() {
    return this.name && this.name.trim().length >= 3;
  }

  /**
   * Valida a entidade completa
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validate() {
    const errors = [];

    if (!this.isValidEmail()) {
      errors.push('Email inválido');
    }

    if (!this.isValidName()) {
      errors.push('Nome deve ter no mínimo 3 caracteres');
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
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
