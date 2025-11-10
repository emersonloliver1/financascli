/**
 * Caso de uso: Listar categorias do usuário
 */
export class ListCategoriesUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a listagem de categorias organizadas em hierarquia
   * @param {Object} params - {userId, type}
   * @returns {Promise<{success: boolean, categories?: Category[], errors?: string[]}>}
   */
  async execute({ userId, type = null }) {
    try {
      // Buscar categorias raiz (sem parent_id) do usuário + globais
      const rootCategories = await this.categoryRepository.findRootCategories(userId, type);

      // Para cada categoria raiz, buscar suas subcategorias
      const categoriesWithSubcategories = await Promise.all(
        rootCategories.map(async (category) => {
          const subcategories = await this.categoryRepository.findByParentId(category.id);
          category.subcategories = subcategories;
          return category;
        })
      );

      return {
        success: true,
        categories: categoriesWithSubcategories
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao listar categorias: ${error.message}`]
      };
    }
  }

  /**
   * Lista apenas categorias editáveis pelo usuário
   * @param {Object} params - {userId, type}
   * @returns {Promise<{success: boolean, categories?: Category[], errors?: string[]}>}
   */
  async executeUserOwned({ userId, type = null }) {
    try {
      // Buscar todas as categorias do usuário (incluindo globais)
      const allCategories = await this.categoryRepository.findByUserId(userId, type);

      // Filtrar apenas categorias que pertencem ao usuário (não globais)
      const userCategories = allCategories.filter(cat => cat.userId === userId);

      // Organizar em hierarquia
      const rootCategories = userCategories.filter(cat => !cat.isSubcategory());

      const categoriesWithSubcategories = rootCategories.map(category => {
        const subcategories = userCategories.filter(
          sub => sub.parentId === category.id
        );
        category.subcategories = subcategories;
        return category;
      });

      return {
        success: true,
        categories: categoriesWithSubcategories
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao listar categorias: ${error.message}`]
      };
    }
  }
}
