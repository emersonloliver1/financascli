import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import {
  clearScreen,
  createBox,
  createSeparator,
  successMessage,
  errorMessage,
  warningMessage
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';
import ora from 'ora';

/**
 * Tela de gerenciamento de categorias
 */
export class CategoryScreen {
  constructor(
    user,
    createCategoryUseCase,
    listCategoriesUseCase,
    updateCategoryUseCase,
    deleteCategoryUseCase
  ) {
    this.user = user;
    this.createCategoryUseCase = createCategoryUseCase;
    this.listCategoriesUseCase = listCategoriesUseCase;
    this.updateCategoryUseCase = updateCategoryUseCase;
    this.deleteCategoryUseCase = deleteCategoryUseCase;
  }

  /**
   * Exibe menu principal de categorias
   */
  async show() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.folder} ${styles.bold('GERENCIAR CATEGORIAS')}\n${colors.textDim('Organize suas receitas e despesas')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    const choice = await QuickMenu.selectWithIcons(
      '📂 O QUE DESEJA FAZER?',
      [
        { name: 'Listar Categorias', value: 'list', icon: '📋', color: 'cyan' },
        { name: 'Criar Categoria', value: 'create', icon: '➕', color: 'green' },
        { name: 'Editar Categoria', value: 'edit', icon: '✏️', color: 'yellow' },
        { name: 'Deletar Categoria', value: 'delete', icon: '🗑️', color: 'red' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      ]
    );

    switch (choice) {
      case 'list':
        await this.showList();
        return await this.show();
      case 'create':
        await this.showCreate();
        return await this.show();
      case 'edit':
        await this.showEdit();
        return await this.show();
      case 'delete':
        await this.showDelete();
        return await this.show();
      case 'back':
        return 'back';
    }
  }

  /**
   * Lista categorias organizadas em hierarquia
   */
  async showList() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.folder} ${styles.bold('SUAS CATEGORIAS')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando categorias...').start();

    // Buscar categorias de receitas
    const incomeResult = await this.listCategoriesUseCase.execute({
      userId: this.user.id,
      type: 'income'
    });

    // Buscar categorias de despesas
    const expenseResult = await this.listCategoriesUseCase.execute({
      userId: this.user.id,
      type: 'expense'
    });

    spinner.stop();

    if (!incomeResult.success || !expenseResult.success) {
      console.log(errorMessage('Erro ao carregar categorias'));
      await Input.pressKey();
      return;
    }

    // Exibir Receitas
    console.log(colors.success(`\n📈 RECEITAS (${this._countTotal(incomeResult.categories)})\n`));
    this._displayCategoryTree(incomeResult.categories);

    // Exibir Despesas
    console.log(colors.danger(`\n📉 DESPESAS (${this._countTotal(expenseResult.categories)})\n`));
    this._displayCategoryTree(expenseResult.categories);

    console.log('\n');
    await Input.pressKey();
  }

  /**
   * Cria nova categoria
   */
  async showCreate() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.add} ${styles.bold('CRIAR CATEGORIA')}`,
      { borderColor: 'green', padding: 1 }
    ));
    console.log('\n');

    // Escolher tipo
    const type = await QuickMenu.selectWithIcons(
      '💰 TIPO DA CATEGORIA',
      [
        { name: 'Receita', value: 'income', icon: '📈', color: 'green' },
        { name: 'Despesa', value: 'expense', icon: '📉', color: 'red' },
        { name: 'Cancelar', value: 'cancel', icon: '❌', color: 'gray' }
      ]
    );

    if (type === 'cancel') return;

    // Escolher se é raiz ou subcategoria
    const isSubcategory = await Input.confirm('Esta é uma subcategoria?', false);

    let parentId = null;
    if (isSubcategory) {
      parentId = await this._selectParentCategory(type);
      if (!parentId) return; // Cancelou
    }

    // Formulário
    const name = await Input.text('Nome da categoria');
    if (!name) return;

    const icon = await Input.text('Ícone (emoji)', '📁');
    const color = await Input.text('Cor (nome ou #hex)', 'blue');

    // Executar caso de uso
    const spinner = ora('Criando categoria...').start();

    const result = await this.createCategoryUseCase.execute({
      userId: this.user.id,
      parentId,
      name,
      type,
      icon,
      color
    });

    spinner.stop();

    if (result.success) {
      console.log('\n');
      console.log(successMessage(`Categoria "${name}" criada com sucesso!`));
    } else {
      console.log('\n');
      console.log(errorMessage(result.errors.join('\n')));
    }

    console.log('\n');
    await Input.pressKey();
  }

  /**
   * Edita categoria existente
   */
  async showEdit() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.edit} ${styles.bold('EDITAR CATEGORIA')}`,
      { borderColor: 'yellow', padding: 1 }
    ));
    console.log('\n');

    // Buscar apenas categorias do usuário (não globais)
    const result = await this.listCategoriesUseCase.executeUserOwned({
      userId: this.user.id
    });

    if (!result.success) {
      console.log(errorMessage('Erro ao carregar categorias'));
      await Input.pressKey();
      return;
    }

    if (result.categories.length === 0) {
      console.log(warningMessage('Você ainda não criou nenhuma categoria personalizada'));
      await Input.pressKey();
      return;
    }

    // Selecionar categoria para editar
    const categoryId = await this._selectCategoryToEdit(result.categories);
    if (!categoryId) return; // Cancelou

    // Buscar categoria atual
    const category = this._findCategoryById(result.categories, categoryId);
    if (!category) return;

    // Formulário com valores atuais
    console.log(colors.info(`\nEditando: ${category.icon} ${category.name}\n`));

    const name = await Input.text('Nome', category.name);
    const icon = await Input.text('Ícone', category.icon);
    const color = await Input.text('Cor', category.color);

    // Confirmar
    const confirm = await Input.confirm('Confirmar alterações?', true);
    if (!confirm) return;

    // Executar caso de uso
    const spinner = ora('Atualizando categoria...').start();

    const updateResult = await this.updateCategoryUseCase.execute({
      id: categoryId,
      userId: this.user.id,
      name,
      icon,
      color
    });

    spinner.stop();

    if (updateResult.success) {
      console.log('\n');
      console.log(successMessage('Categoria atualizada com sucesso!'));
    } else {
      console.log('\n');
      console.log(errorMessage(updateResult.errors.join('\n')));
    }

    console.log('\n');
    await Input.pressKey();
  }

  /**
   * Deleta categoria
   */
  async showDelete() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.delete} ${styles.bold('DELETAR CATEGORIA')}`,
      { borderColor: 'red', padding: 1 }
    ));
    console.log('\n');

    // Buscar apenas categorias do usuário
    const result = await this.listCategoriesUseCase.executeUserOwned({
      userId: this.user.id
    });

    if (!result.success) {
      console.log(errorMessage('Erro ao carregar categorias'));
      await Input.pressKey();
      return;
    }

    if (result.categories.length === 0) {
      console.log(warningMessage('Você ainda não criou nenhuma categoria personalizada'));
      await Input.pressKey();
      return;
    }

    // Selecionar categoria para deletar
    const categoryId = await this._selectCategoryToEdit(result.categories);
    if (!categoryId) return; // Cancelou

    // Buscar categoria
    const category = this._findCategoryById(result.categories, categoryId);
    if (!category) return;

    // Confirmar
    console.log(colors.danger(`\n⚠️  Você está prestes a deletar: ${category.icon} ${category.name}\n`));

    if (category.subcategories.length > 0) {
      console.log(warningMessage(
        `Esta categoria possui ${category.subcategories.length} subcategoria(s) que também serão deletadas.`
      ));
      console.log('');
    }

    const confirm = await Input.confirm('Tem certeza que deseja deletar?', false);
    if (!confirm) return;

    // Executar caso de uso
    const spinner = ora('Deletando categoria...').start();

    const deleteResult = await this.deleteCategoryUseCase.execute({
      id: categoryId,
      userId: this.user.id
    });

    spinner.stop();

    if (deleteResult.success) {
      console.log('\n');
      console.log(successMessage('Categoria deletada com sucesso!'));
      if (deleteResult.warnings) {
        console.log(warningMessage(deleteResult.warnings.join('\n')));
      }
    } else {
      console.log('\n');
      console.log(errorMessage(deleteResult.errors.join('\n')));
    }

    console.log('\n');
    await Input.pressKey();
  }

  // ========== MÉTODOS AUXILIARES ==========

  /**
   * Exibe árvore de categorias
   * @private
   */
  _displayCategoryTree(categories) {
    categories.forEach(category => {
      const defaultTag = category.isDefault ? colors.textDim(' (padrão)') : '';
      console.log(`  ${category.icon || '📁'} ${styles.bold(category.name)}${defaultTag}`);

      category.subcategories.forEach(sub => {
        const subDefaultTag = sub.isDefault ? colors.textDim(' (padrão)') : '';
        console.log(`    └─ ${sub.icon || '📄'} ${sub.name}${subDefaultTag}`);
      });

      if (category.subcategories.length === 0) {
        console.log(colors.textDim('    └─ (sem subcategorias)'));
      }
    });
  }

  /**
   * Conta total de categorias + subcategorias
   * @private
   */
  _countTotal(categories) {
    let total = categories.length;
    categories.forEach(cat => {
      total += cat.subcategories.length;
    });
    return total;
  }

  /**
   * Seleciona categoria pai para criar subcategoria
   * @private
   */
  async _selectParentCategory(type) {
    const result = await this.listCategoriesUseCase.execute({
      userId: this.user.id,
      type
    });

    if (!result.success || result.categories.length === 0) {
      console.log(errorMessage('Nenhuma categoria disponível'));
      await Input.pressKey();
      return null;
    }

    const options = result.categories.map(cat => ({
      name: `${cat.icon} ${cat.name}`,
      value: cat.id,
      icon: cat.icon,
      color: cat.color || 'white'
    }));

    options.push({ name: 'Cancelar', value: null, icon: '❌', color: 'red' });

    return await QuickMenu.selectWithIcons(
      '📂 ESCOLHA A CATEGORIA PAI',
      options
    );
  }

  /**
   * Seleciona categoria para editar/deletar
   * @private
   */
  async _selectCategoryToEdit(categories) {
    const options = [];

    categories.forEach(cat => {
      options.push({
        name: `${cat.icon} ${cat.name} (${cat.type === 'income' ? 'Receita' : 'Despesa'})`,
        value: cat.id,
        icon: cat.icon,
        color: cat.color || 'white'
      });

      cat.subcategories.forEach(sub => {
        options.push({
          name: `  └─ ${sub.icon} ${sub.name}`,
          value: sub.id,
          icon: sub.icon,
          color: sub.color || 'white'
        });
      });
    });

    options.push({ name: 'Cancelar', value: null, icon: '❌', color: 'red' });

    return await QuickMenu.selectWithIcons(
      '📂 ESCOLHA A CATEGORIA',
      options
    );
  }

  /**
   * Busca categoria por ID na árvore
   * @private
   */
  _findCategoryById(categories, id) {
    for (const cat of categories) {
      if (cat.id === id) return cat;

      for (const sub of cat.subcategories) {
        if (sub.id === id) return sub;
      }
    }
    return null;
  }
}

export default CategoryScreen;
