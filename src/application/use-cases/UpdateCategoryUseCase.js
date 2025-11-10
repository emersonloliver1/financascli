import { Category } from '../../domain/entities/Category.js';

/**
 * Caso de uso: Atualizar categoria existente
 */
export class UpdateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a atualização de uma categoria
   * @param {Object} categoryData - {id, userId, name, icon, color}
   * @returns {Promise<{success: boolean, category?: Category, errors?: string[]}>}
   */
  async execute({ id, userId, name, icon = null, color = null }) {
    const errors = [];

    // Buscar categoria existente
    const existingCategory = await this.categoryRepository.findById(id);

    if (!existingCategory) {
      return { success: false, errors: ['Categoria não encontrada'] };
    }

    // Verificar se categoria pode ser editada pelo usuário
    if (!existingCategory.isEditable(userId)) {
      return {
        success: false,
        errors: ['Você não tem permissão para editar esta categoria']
      };
    }

    // Atualizar propriedades
    existingCategory.name = name;
    existingCategory.icon = icon;
    existingCategory.color = color;

    // Validar categoria atualizada
    const validation = existingCategory.validate();

    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    // Se houver erros de validação, retornar
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Verificar se já existe categoria com o mesmo nome (excluindo a própria)
    const nameExists = await this.categoryRepository.existsByName(
      userId,
      name,
      existingCategory.type,
      existingCategory.parentId,
      id // Excluir a própria categoria da busca
    );

    if (nameExists) {
      return { success: false, errors: ['Já existe uma categoria com este nome'] };
    }

    // Atualizar categoria
    try {
      const updatedCategory = await this.categoryRepository.update(existingCategory);
      return { success: true, category: updatedCategory };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao atualizar categoria: ${error.message}`]
      };
    }
  }
}
