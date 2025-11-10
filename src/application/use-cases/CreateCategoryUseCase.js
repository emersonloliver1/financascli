import { Category } from '../../domain/entities/Category.js';

/**
 * Caso de uso: Criar nova categoria
 */
export class CreateCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a criação de uma nova categoria
   * @param {Object} categoryData - {userId, parentId, name, type, icon, color}
   * @returns {Promise<{success: boolean, category?: Category, errors?: string[]}>}
   */
  async execute({ userId, parentId = null, name, type, icon = null, color = null }) {
    const errors = [];

    // Criar e validar entidade Category
    const category = new Category({
      userId,
      parentId,
      name,
      type,
      icon,
      color,
      isDefault: false // Categorias criadas por usuários nunca são padrão
    });

    const validation = category.validate();

    if (!validation.isValid) {
      errors.push(...validation.errors);
    }

    // Se houver erros de validação, retornar
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Se for subcategoria, verificar se categoria pai existe
    if (parentId) {
      const parentCategory = await this.categoryRepository.findById(parentId);

      if (!parentCategory) {
        return { success: false, errors: ['Categoria pai não encontrada'] };
      }

      // Verificar se a categoria pai pertence ao usuário ou é global
      if (!parentCategory.isGlobal() && parentCategory.userId !== userId) {
        return { success: false, errors: ['Você não pode criar subcategorias em categorias de outros usuários'] };
      }

      // Verificar se a categoria pai já é uma subcategoria (não permitir mais de 1 nível)
      if (parentCategory.isSubcategory()) {
        return { success: false, errors: ['Não é possível criar subcategorias de subcategorias (limite: 1 nível)'] };
      }
    }

    // Verificar se já existe categoria com o mesmo nome
    const nameExists = await this.categoryRepository.existsByName(
      userId,
      name,
      type,
      parentId
    );

    if (nameExists) {
      return { success: false, errors: ['Já existe uma categoria com este nome'] };
    }

    // Criar categoria
    try {
      const createdCategory = await this.categoryRepository.create(category);
      return { success: true, category: createdCategory };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao criar categoria: ${error.message}`]
      };
    }
  }
}
