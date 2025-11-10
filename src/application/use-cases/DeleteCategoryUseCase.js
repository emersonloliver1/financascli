/**
 * Caso de uso: Deletar categoria
 */
export class DeleteCategoryUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a deleção de uma categoria
   * @param {Object} params - {id, userId, force}
   * @returns {Promise<{success: boolean, warnings?: string[], errors?: string[]}>}
   */
  async execute({ id, userId, force = false }) {
    const warnings = [];

    // Buscar categoria existente
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      return { success: false, errors: ['Categoria não encontrada'] };
    }

    // Verificar se categoria pode ser deletada pelo usuário
    if (!category.isDeletable(userId)) {
      return {
        success: false,
        errors: ['Você não tem permissão para deletar esta categoria']
      };
    }

    // Verificar se categoria tem transações vinculadas
    const hasTransactions = await this.categoryRepository.hasTransactions(id);

    if (hasTransactions && !force) {
      return {
        success: false,
        errors: ['Esta categoria possui transações vinculadas. Não é possível deletá-la.'],
        requiresForce: true
      };
    }

    // Verificar se categoria tem subcategorias
    const subcategoriesCount = await this.categoryRepository.countSubcategories(id);

    if (subcategoriesCount > 0) {
      warnings.push(
        `Esta categoria possui ${subcategoriesCount} subcategoria(s) que serão deletadas em cascata`
      );
    }

    // Deletar categoria (cascata deleta subcategorias devido ao ON DELETE CASCADE)
    try {
      const deleted = await this.categoryRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          errors: ['Erro ao deletar categoria']
        };
      }

      return {
        success: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao deletar categoria: ${error.message}`]
      };
    }
  }
}
