import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import { BudgetList } from '../components/BudgetList.js';
import { BudgetProgressBar } from '../components/BudgetProgressBar.js';
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
import chalk from 'chalk';

/**
 * Tela de gerenciamento de orçamentos
 */
export class BudgetScreen {
  constructor(
    user,
    budgetUseCases,
    categoryUseCases
  ) {
    this.user = user;
    this.createBudgetUseCase = budgetUseCases.createBudget;
    this.listBudgetsUseCase = budgetUseCases.listBudgets;
    this.updateBudgetUseCase = budgetUseCases.updateBudget;
    this.deleteBudgetUseCase = budgetUseCases.deleteBudget;
    this.getBudgetAlertsUseCase = budgetUseCases.getBudgetAlerts;
    this.suggestBudgetsUseCase = budgetUseCases.suggestBudgets;
    this.listCategoriesUseCase = categoryUseCases.listCategories;
  }

  /**
   * Exibe menu principal de orçamentos
   */
  async show() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `💰 ${styles.bold('GERENCIAR ORÇAMENTOS')}\n${colors.textDim('Controle seus gastos por categoria')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    const choice = await QuickMenu.selectWithIcons(
      '💰 O QUE DESEJA FAZER?',
      [
        { name: 'Meus Orçamentos', value: 'list', icon: '📊', color: 'cyan' },
        { name: 'Criar Orçamento', value: 'create', icon: '➕', color: 'green' },
        { name: 'Editar Orçamento', value: 'edit', icon: '✏️', color: 'yellow' },
        { name: 'Deletar Orçamento', value: 'delete', icon: '🗑️', color: 'red' },
        { name: 'Alertas de Orçamento', value: 'alerts', icon: '⚠️', color: 'yellow' },
        { name: 'Sugestões Automáticas', value: 'suggest', icon: '💡', color: 'magenta' },
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
      case 'alerts':
        await this.showAlerts();
        return await this.show();
      case 'suggest':
        await this.showSuggestions();
        return await this.show();
      case 'back':
        return 'back';
    }
  }

  /**
   * Lista orçamentos
   */
  async showList() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `💰 ${styles.bold('MEUS ORÇAMENTOS')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando orçamentos...').start();

    const result = await this.listBudgetsUseCase.execute(this.user.id, {
      activeOnly: true
    });

    spinner.stop();

    if (!result.success) {
      console.log(errorMessage(result.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    if (result.budgets.length === 0) {
      console.log(chalk.gray('\n  Nenhum orçamento ativo encontrado.\n'));
      console.log(chalk.cyan('  💡 Dica: Crie um orçamento para começar a controlar seus gastos!\n'));
      await Input.pressKey();
      return;
    }

    BudgetList.render(result.budgets, { showDetails: true });

    await Input.pressKey();
  }

  /**
   * Criar novo orçamento
   */
  async showCreate() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `➕ ${styles.bold('CRIAR NOVO ORÇAMENTO')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    // 1. Selecionar categoria
    const spinner = ora('Carregando categorias de despesa...').start();

    const categoriesResult = await this.listCategoriesUseCase.execute({
      userId: this.user.id,
      type: 'expense'
    });

    spinner.stop();

    if (!categoriesResult.success || categoriesResult.categories.length === 0) {
      console.log(errorMessage('Nenhuma categoria de despesa encontrada.\nCrie categorias antes de criar orçamentos.'));
      await Input.pressKey();
      return;
    }

    console.log(chalk.bold('\n📂 Selecione a categoria:\n'));

    const categoryChoices = categoriesResult.categories.map(cat => ({
      name: `${cat.icon || '📂'} ${cat.name}`,
      value: cat.id
    }));

    const categoryId = await QuickMenu.select('Categoria:', categoryChoices);

    if (!categoryId) {
      return;
    }

    // 2. Valor do orçamento
    console.log('');
    const amountStr = await Input.text('💵 Valor do orçamento (R$):', {
      validate: (value) => {
        const num = parseFloat(value.replace(',', '.'));
        if (isNaN(num) || num <= 0) {
          return 'Valor inválido. Digite um valor maior que zero.';
        }
        return true;
      }
    });

    const amount = parseFloat(amountStr.replace(',', '.'));

    // 3. Período
    console.log('');
    const period = await QuickMenu.selectWithIcons(
      '📅 Período:',
      [
        { name: 'Mensal (este mês)', value: 'monthly', icon: '📅', color: 'cyan' },
        { name: 'Anual (este ano)', value: 'annual', icon: '📆', color: 'blue' },
        { name: 'Personalizado', value: 'custom', icon: '⚙️', color: 'yellow' }
      ]
    );

    let startDate, endDate;

    if (period === 'custom') {
      console.log('');
      const startDateStr = await Input.text('📅 Data início (DD/MM/AAAA):');
      const endDateStr = await Input.text('📅 Data fim (DD/MM/AAAA):');

      startDate = this._parseDate(startDateStr);
      endDate = this._parseDate(endDateStr);

      if (!startDate || !endDate) {
        console.log(errorMessage('Datas inválidas'));
        await Input.pressKey();
        return;
      }
    } else if (period === 'monthly') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'annual') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    // 4. Rollover
    console.log('');
    const rolloverAnswer = await Input.confirm('🔄 Ativar rollover (transferir saldo não usado para próximo período)?', false);

    // 5. Confirmar
    console.log('\n');
    console.log(createSeparator());
    console.log(chalk.bold('\n📋 CONFIRMAÇÃO:\n'));

    const selectedCategory = categoriesResult.categories.find(c => c.id === categoryId);
    console.log(`  Categoria: ${selectedCategory.icon} ${selectedCategory.name}`);
    console.log(`  Valor: R$ ${amount.toFixed(2).replace('.', ',')}`);
    console.log(`  Período: ${period === 'monthly' ? 'Mensal' : period === 'annual' ? 'Anual' : 'Personalizado'}`);
    console.log(`  Rollover: ${rolloverAnswer ? 'Sim' : 'Não'}`);
    console.log('');

    const confirm = await Input.confirm('Confirmar criação?', true);

    if (!confirm) {
      console.log(warningMessage('Operação cancelada'));
      await Input.pressKey();
      return;
    }

    // 6. Criar orçamento
    const createSpinner = ora('Criando orçamento...').start();

    const result = await this.createBudgetUseCase.execute(this.user.id, {
      categoryId,
      amount,
      period,
      startDate,
      endDate,
      rollover: rolloverAnswer
    });

    createSpinner.stop();

    if (!result.success) {
      console.log(errorMessage(result.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    console.log(successMessage('✅ Orçamento criado com sucesso!'));
    await Input.pressKey();
  }

  /**
   * Editar orçamento
   */
  async showEdit() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `✏️  ${styles.bold('EDITAR ORÇAMENTO')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando orçamentos...').start();

    const result = await this.listBudgetsUseCase.execute(this.user.id, {
      activeOnly: true
    });

    spinner.stop();

    if (!result.success || result.budgets.length === 0) {
      console.log(errorMessage('Nenhum orçamento encontrado'));
      await Input.pressKey();
      return;
    }

    // Selecionar orçamento
    const budgetChoices = result.budgets.map((b, idx) => {
      const icon = b.categoryIcon || '💰';
      const name = b.categoryName || 'Categoria';
      const period = b.formattedPeriod || b.getFormattedPeriod();

      return {
        name: `${icon} ${name} (${period})`,
        value: b.id
      };
    });

    console.log(chalk.bold('\n📊 Selecione o orçamento para editar:\n'));
    const budgetId = await QuickMenu.select('Orçamento:', budgetChoices);

    if (!budgetId) {
      return;
    }

    const selectedBudget = result.budgets.find(b => b.id === budgetId);

    // Novo valor
    console.log('');
    const newAmountStr = await Input.text(
      `💵 Novo valor (atual: R$ ${selectedBudget.amount.toFixed(2).replace('.', ',')}):`
    );

    const newAmount = parseFloat(newAmountStr.replace(',', '.'));

    if (isNaN(newAmount) || newAmount <= 0) {
      console.log(errorMessage('Valor inválido'));
      await Input.pressKey();
      return;
    }

    // Confirmar
    const confirm = await Input.confirm(`Alterar orçamento para R$ ${newAmount.toFixed(2).replace('.', ',')}?`, true);

    if (!confirm) {
      console.log(warningMessage('Operação cancelada'));
      await Input.pressKey();
      return;
    }

    // Atualizar
    const updateSpinner = ora('Atualizando orçamento...').start();

    const updateResult = await this.updateBudgetUseCase.execute(this.user.id, budgetId, {
      amount: newAmount
    });

    updateSpinner.stop();

    if (!updateResult.success) {
      console.log(errorMessage(updateResult.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    console.log(successMessage('✅ Orçamento atualizado com sucesso!'));
    await Input.pressKey();
  }

  /**
   * Deletar orçamento
   */
  async showDelete() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `🗑️  ${styles.bold('DELETAR ORÇAMENTO')}`,
      { borderColor: '#eb3349', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando orçamentos...').start();

    const result = await this.listBudgetsUseCase.execute(this.user.id, {
      activeOnly: false // Mostrar todos
    });

    spinner.stop();

    if (!result.success || result.budgets.length === 0) {
      console.log(errorMessage('Nenhum orçamento encontrado'));
      await Input.pressKey();
      return;
    }

    // Selecionar orçamento
    const budgetChoices = result.budgets.map((b, idx) => {
      const icon = b.categoryIcon || '💰';
      const name = b.categoryName || 'Categoria';
      const period = b.formattedPeriod || b.getFormattedPeriod();

      return {
        name: `${icon} ${name} (${period})`,
        value: b.id
      };
    });

    console.log(chalk.bold('\n📊 Selecione o orçamento para deletar:\n'));
    const budgetId = await QuickMenu.select('Orçamento:', budgetChoices);

    if (!budgetId) {
      return;
    }

    const selectedBudget = result.budgets.find(b => b.id === budgetId);

    // Confirmar
    console.log('\n');
    console.log(chalk.red.bold('⚠️  ATENÇÃO: Esta ação não pode ser desfeita!\n'));

    const confirm = await Input.confirm(`Deletar orçamento de ${selectedBudget.categoryName}?`, false);

    if (!confirm) {
      console.log(warningMessage('Operação cancelada'));
      await Input.pressKey();
      return;
    }

    // Deletar
    const deleteSpinner = ora('Deletando orçamento...').start();

    const deleteResult = await this.deleteBudgetUseCase.execute(this.user.id, budgetId);

    deleteSpinner.stop();

    if (!deleteResult.success) {
      console.log(errorMessage(deleteResult.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    console.log(successMessage('✅ Orçamento deletado com sucesso!'));
    await Input.pressKey();
  }

  /**
   * Mostrar alertas de orçamentos
   */
  async showAlerts() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `⚠️  ${styles.bold('ALERTAS DE ORÇAMENTO')}`,
      { borderColor: '#f2994a', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando alertas...').start();

    const result = await this.getBudgetAlertsUseCase.execute(this.user.id, 50);

    spinner.stop();

    if (!result.success) {
      console.log(errorMessage(result.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    if (!result.alerts.hasAlerts) {
      console.log(successMessage('✅ Nenhum alerta! Todos os orçamentos estão OK.'));
      await Input.pressKey();
      return;
    }

    const { categorized, stats } = result.alerts;

    // Mostrar orçamentos excedidos
    if (categorized.exceeded.length > 0) {
      console.log(chalk.red.bold('\n🔴 ORÇAMENTOS EXCEDIDOS:\n'));
      BudgetList.render(categorized.exceeded, { compact: true });
    }

    // Mostrar orçamentos em atenção
    if (categorized.warning.length > 0) {
      console.log(chalk.yellow.bold('\n⚠️  ORÇAMENTOS EM ATENÇÃO (80-100%):\n'));
      BudgetList.render(categorized.warning, { compact: true });
    }

    // Mostrar orçamentos em alerta
    if (categorized.caution.length > 0) {
      console.log(chalk.yellow.bold('\n🟡 ORÇAMENTOS EM ALERTA (50-80%):\n'));
      BudgetList.render(categorized.caution, { compact: true });
    }

    console.log(createSeparator());
    console.log(chalk.bold('\n📊 ESTATÍSTICAS:\n'));
    console.log(`  Total de alertas: ${chalk.yellow(stats.totalBudgets)}`);
    console.log(`  Excedidos: ${chalk.red(stats.exceededCount)}`);
    console.log(`  Em atenção: ${chalk.yellow(stats.warningCount)}`);
    console.log(`  Em alerta: ${chalk.yellow(stats.cautionCount)}`);
    console.log('');

    await Input.pressKey();
  }

  /**
   * Mostrar sugestões automáticas
   */
  async showSuggestions() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `💡 ${styles.bold('SUGESTÕES AUTOMÁTICAS DE ORÇAMENTO')}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Analisando histórico de gastos...').start();

    const result = await this.suggestBudgetsUseCase.execute(this.user.id, {
      months: 3,
      period: 'monthly'
    });

    spinner.stop();

    if (!result.success) {
      console.log(errorMessage(result.errors.join('\n')));
      await Input.pressKey();
      return;
    }

    if (result.suggestions.length === 0) {
      console.log(chalk.gray('\n  Não há dados históricos suficientes para gerar sugestões.\n'));
      console.log(chalk.cyan('  💡 Dica: Continue registrando suas transações para receber sugestões personalizadas!\n'));
      await Input.pressKey();
      return;
    }

    console.log(chalk.bold(`\n📊 Sugestões baseadas nos últimos ${result.summary.monthsAnalyzed} meses:\n`));
    console.log('');

    result.suggestions.forEach((suggestion, idx) => {
      const icon = suggestion.category.icon || '💰';
      const name = suggestion.category.name;
      const avg = this._formatCurrency(suggestion.historicalAverage);
      const suggested = this._formatCurrency(suggestion.suggestedAmount);

      console.log(`  ${chalk.gray(`[${idx + 1}]`)} ${icon} ${chalk.bold(name)}`);
      console.log(`      Média histórica: ${avg}`);
      console.log(`      Sugestão: ${chalk.green(suggested)} ${chalk.gray('(+10% margem)')}`);

      if (suggestion.hasExistingBudget) {
        const existing = this._formatCurrency(suggestion.existingBudgetAmount);
        console.log(`      Orçamento atual: ${existing}`);
        console.log(`      ${chalk.cyan(suggestion.recommendation)}`);
      } else {
        console.log(`      ${chalk.yellow('⚠️  Nenhum orçamento ativo')}`);
      }

      console.log('');
    });

    console.log(createSeparator());
    console.log(chalk.bold('\n📋 RESUMO:\n'));
    console.log(`  Categorias analisadas: ${result.summary.totalCategories}`);
    console.log(`  Com histórico: ${result.summary.categoriesWithHistory}`);
    console.log(`  Sem histórico: ${result.summary.categoriesWithoutHistory}`);
    console.log(`  Total sugerido: ${chalk.green(this._formatCurrency(result.summary.totalSuggestedBudget))}`);
    console.log('');

    await Input.pressKey();
  }

  /**
   * Parse de data DD/MM/AAAA
   * @private
   */
  _parseDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);

    const date = new Date(year, month, day);

    if (isNaN(date.getTime())) return null;

    return date;
  }

  /**
   * Formata valor em moeda
   * @private
   */
  _formatCurrency(value) {
    const formatted = value.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }
}

export default BudgetScreen;
