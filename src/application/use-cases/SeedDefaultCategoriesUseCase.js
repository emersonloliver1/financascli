import { Category } from '../../domain/entities/Category.js';

/**
 * Caso de uso: Popular categorias padrão do sistema
 */
export class SeedDefaultCategoriesUseCase {
  constructor(categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a criação das categorias padrão (apenas se não existirem)
   * @returns {Promise<{success: boolean, created: number, errors?: string[]}>}
   */
  async execute() {
    try {
      // Verificar se já existem categorias padrão
      const existingDefaults = await this.categoryRepository.findGlobalCategories();

      if (existingDefaults.length > 0) {
        console.log('✅ Categorias padrão já existem');
        return { success: true, created: 0 };
      }

      console.log('🌱 Criando categorias padrão...');

      const defaultCategories = this._getDefaultCategories();
      let createdCount = 0;

      // Criar categorias raiz primeiro
      const rootCategories = defaultCategories.filter(cat => !cat.parentName);

      for (const catData of rootCategories) {
        const category = new Category({
          userId: null, // Global
          parentId: null,
          name: catData.name,
          type: catData.type,
          icon: catData.icon,
          color: catData.color,
          isDefault: true
        });

        const created = await this.categoryRepository.create(category);
        catData.id = created.id; // Guardar ID para vincular subcategorias
        createdCount++;
      }

      // Criar subcategorias
      const subcategories = defaultCategories.filter(cat => cat.parentName);

      for (const catData of subcategories) {
        // Encontrar ID da categoria pai
        const parentData = rootCategories.find(r => r.name === catData.parentName);

        if (!parentData || !parentData.id) {
          console.error(`❌ Categoria pai não encontrada: ${catData.parentName}`);
          continue;
        }

        const category = new Category({
          userId: null, // Global
          parentId: parentData.id,
          name: catData.name,
          type: catData.type,
          icon: catData.icon,
          color: catData.color,
          isDefault: true
        });

        await this.categoryRepository.create(category);
        createdCount++;
      }

      console.log(`✅ ${createdCount} categorias padrão criadas com sucesso`);

      return { success: true, created: createdCount };
    } catch (error) {
      return {
        success: false,
        created: 0,
        errors: [`Erro ao criar categorias padrão: ${error.message}`]
      };
    }
  }

  /**
   * Define as categorias padrão do sistema
   * @private
   */
  _getDefaultCategories() {
    return [
      // ========== DESPESAS (EXPENSE) ==========

      // Alimentação
      { name: 'Alimentação', type: 'expense', icon: '🍔', color: 'orange' },
      { name: 'Supermercado', type: 'expense', icon: '🛒', color: 'orange', parentName: 'Alimentação' },
      { name: 'Restaurante', type: 'expense', icon: '🍽️', color: 'orange', parentName: 'Alimentação' },
      { name: 'Delivery', type: 'expense', icon: '🛵', color: 'orange', parentName: 'Alimentação' },
      { name: 'Lanchonete', type: 'expense', icon: '🍕', color: 'orange', parentName: 'Alimentação' },
      { name: 'Padaria', type: 'expense', icon: '🥖', color: 'orange', parentName: 'Alimentação' },

      // Transporte
      { name: 'Transporte', type: 'expense', icon: '🚗', color: 'blue' },
      { name: 'Combustível', type: 'expense', icon: '⛽', color: 'blue', parentName: 'Transporte' },
      { name: 'Manutenção veículo', type: 'expense', icon: '🔧', color: 'blue', parentName: 'Transporte' },
      { name: 'Transporte público', type: 'expense', icon: '🚌', color: 'blue', parentName: 'Transporte' },
      { name: 'Uber/Táxi', type: 'expense', icon: '🚕', color: 'blue', parentName: 'Transporte' },
      { name: 'Estacionamento', type: 'expense', icon: '🅿️', color: 'blue', parentName: 'Transporte' },

      // Moradia
      { name: 'Moradia', type: 'expense', icon: '🏠', color: 'brown' },
      { name: 'Aluguel', type: 'expense', icon: '🔑', color: 'brown', parentName: 'Moradia' },
      { name: 'Condomínio', type: 'expense', icon: '🏢', color: 'brown', parentName: 'Moradia' },
      { name: 'IPTU', type: 'expense', icon: '📄', color: 'brown', parentName: 'Moradia' },
      { name: 'Energia elétrica', type: 'expense', icon: '💡', color: 'brown', parentName: 'Moradia' },
      { name: 'Água', type: 'expense', icon: '💧', color: 'brown', parentName: 'Moradia' },
      { name: 'Internet', type: 'expense', icon: '🌐', color: 'brown', parentName: 'Moradia' },
      { name: 'Gás', type: 'expense', icon: '🔥', color: 'brown', parentName: 'Moradia' },

      // Contas e Serviços
      { name: 'Contas e Serviços', type: 'expense', icon: '💳', color: 'purple' },
      { name: 'Telefone', type: 'expense', icon: '📱', color: 'purple', parentName: 'Contas e Serviços' },
      { name: 'TV por assinatura', type: 'expense', icon: '📺', color: 'purple', parentName: 'Contas e Serviços' },
      { name: 'Streaming', type: 'expense', icon: '🎬', color: 'purple', parentName: 'Contas e Serviços' },
      { name: 'Seguros', type: 'expense', icon: '🛡️', color: 'purple', parentName: 'Contas e Serviços' },
      { name: 'Impostos', type: 'expense', icon: '📋', color: 'purple', parentName: 'Contas e Serviços' },

      // Vestuário
      { name: 'Vestuário', type: 'expense', icon: '👕', color: 'pink' },
      { name: 'Roupas', type: 'expense', icon: '👔', color: 'pink', parentName: 'Vestuário' },
      { name: 'Calçados', type: 'expense', icon: '👟', color: 'pink', parentName: 'Vestuário' },
      { name: 'Acessórios', type: 'expense', icon: '👜', color: 'pink', parentName: 'Vestuário' },

      // Saúde
      { name: 'Saúde', type: 'expense', icon: '🏥', color: 'red' },
      { name: 'Plano de saúde', type: 'expense', icon: '🩺', color: 'red', parentName: 'Saúde' },
      { name: 'Medicamentos', type: 'expense', icon: '💊', color: 'red', parentName: 'Saúde' },
      { name: 'Consultas', type: 'expense', icon: '👨‍⚕️', color: 'red', parentName: 'Saúde' },
      { name: 'Exames', type: 'expense', icon: '🔬', color: 'red', parentName: 'Saúde' },
      { name: 'Academia', type: 'expense', icon: '💪', color: 'red', parentName: 'Saúde' },

      // Educação
      { name: 'Educação', type: 'expense', icon: '🎓', color: 'yellow' },
      { name: 'Mensalidade escolar', type: 'expense', icon: '🏫', color: 'yellow', parentName: 'Educação' },
      { name: 'Cursos', type: 'expense', icon: '📚', color: 'yellow', parentName: 'Educação' },
      { name: 'Livros', type: 'expense', icon: '📖', color: 'yellow', parentName: 'Educação' },
      { name: 'Material escolar', type: 'expense', icon: '✏️', color: 'yellow', parentName: 'Educação' },

      // Lazer
      { name: 'Lazer', type: 'expense', icon: '🎮', color: 'cyan' },
      { name: 'Cinema', type: 'expense', icon: '🎥', color: 'cyan', parentName: 'Lazer' },
      { name: 'Shows', type: 'expense', icon: '🎤', color: 'cyan', parentName: 'Lazer' },
      { name: 'Viagens', type: 'expense', icon: '✈️', color: 'cyan', parentName: 'Lazer' },
      { name: 'Hobbies', type: 'expense', icon: '🎨', color: 'cyan', parentName: 'Lazer' },
      { name: 'Games', type: 'expense', icon: '🎮', color: 'cyan', parentName: 'Lazer' },

      // Família
      { name: 'Família', type: 'expense', icon: '👨‍👩‍👧', color: 'magenta' },
      { name: 'Presentes', type: 'expense', icon: '🎁', color: 'magenta', parentName: 'Família' },
      { name: 'Pets', type: 'expense', icon: '🐕', color: 'magenta', parentName: 'Família' },
      { name: 'Creche', type: 'expense', icon: '🧸', color: 'magenta', parentName: 'Família' },

      // Manutenção
      { name: 'Manutenção', type: 'expense', icon: '🔧', color: 'gray' },
      { name: 'Casa', type: 'expense', icon: '🏡', color: 'gray', parentName: 'Manutenção' },
      { name: 'Eletrônicos', type: 'expense', icon: '💻', color: 'gray', parentName: 'Manutenção' },
      { name: 'Móveis', type: 'expense', icon: '🪑', color: 'gray', parentName: 'Manutenção' },

      // ========== RECEITAS (INCOME) ==========

      // Salário
      { name: 'Salário', type: 'income', icon: '💰', color: 'green' },
      { name: 'Salário fixo', type: 'income', icon: '💵', color: 'green', parentName: 'Salário' },
      { name: 'Bônus', type: 'income', icon: '🎉', color: 'green', parentName: 'Salário' },
      { name: '13º salário', type: 'income', icon: '🎊', color: 'green', parentName: 'Salário' },
      { name: 'Comissão', type: 'income', icon: '💸', color: 'green', parentName: 'Salário' },

      // Freelance
      { name: 'Freelance', type: 'income', icon: '💼', color: 'blue' },
      { name: 'Projetos', type: 'income', icon: '📝', color: 'blue', parentName: 'Freelance' },
      { name: 'Consultorias', type: 'income', icon: '🤝', color: 'blue', parentName: 'Freelance' },

      // Investimentos
      { name: 'Investimentos', type: 'income', icon: '📈', color: 'teal' },
      { name: 'Dividendos', type: 'income', icon: '💹', color: 'teal', parentName: 'Investimentos' },
      { name: 'Juros', type: 'income', icon: '🏦', color: 'teal', parentName: 'Investimentos' },
      { name: 'Rendimentos', type: 'income', icon: '💰', color: 'teal', parentName: 'Investimentos' },

      // Negócio Próprio
      { name: 'Negócio Próprio', type: 'income', icon: '🏪', color: 'purple' },
      { name: 'Vendas', type: 'income', icon: '🛍️', color: 'purple', parentName: 'Negócio Próprio' },
      { name: 'Serviços', type: 'income', icon: '⚙️', color: 'purple', parentName: 'Negócio Próprio' },

      // Outros
      { name: 'Outros', type: 'income', icon: '🎁', color: 'gray' },
      { name: 'Presentes recebidos', type: 'income', icon: '🎀', color: 'gray', parentName: 'Outros' },
      { name: 'Reembolsos', type: 'income', icon: '💳', color: 'gray', parentName: 'Outros' },
      { name: 'Prêmios', type: 'income', icon: '🏆', color: 'gray', parentName: 'Outros' }
    ];
  }
}
