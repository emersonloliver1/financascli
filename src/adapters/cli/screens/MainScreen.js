import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import { CategoryScreen } from './CategoryScreen.js';
import { TransactionScreen } from './TransactionScreen.js';
import { DashboardScreen } from './DashboardScreen.js';
import { ReportsScreen } from './ReportsScreen.js';
import { BudgetScreen } from './BudgetScreen.js';
import { GoalScreen } from './GoalScreen.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';

/**
 * Tela principal do sistema (após login)
 */
export class MainScreen {
  constructor(
    user,
    categoryUseCases = null,
    transactionUseCases = null,
    getDashboardDataUseCase = null,
    reportUseCases = null,
    budgetUseCases = null,
    goalUseCases = null
  ) {
    this.user = user;
    this.categoryUseCases = categoryUseCases;
    this.transactionUseCases = transactionUseCases;
    this.getDashboardDataUseCase = getDashboardDataUseCase;
    this.reportUseCases = reportUseCases;
    this.budgetUseCases = budgetUseCases;
    this.goalUseCases = goalUseCases;
  }

  /**
   * Exibe a tela principal
   */
  async show() {
    // Header
    console.log('\n');
    console.log(createBox(
      `${icons.user} ${styles.bold(this.user.name)}\n${colors.textDim(this.user.email)}`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    // Menu principal com seleção numérica instantânea
    const choice = await QuickMenu.selectWithIcons(
      '💰 MENU PRINCIPAL',
      [
        { name: 'Dashboard', value: 'dashboard', icon: '📊', color: 'cyan' },
        { name: 'Nova Receita', value: 'income', icon: '📈', color: 'green' },
        { name: 'Nova Despesa', value: 'expense', icon: '📉', color: 'red' },
        { name: 'Categorias', value: 'categories', icon: '📂', color: 'purple' },
        { name: 'Ver Transações', value: 'transactions', icon: '💰', color: 'yellow' },
        { name: 'Relatórios', value: 'reports', icon: '📈', color: 'magenta' },
        { name: 'Orçamentos', value: 'budgets', icon: '💰', color: 'cyan' },
        { name: 'Metas Financeiras', value: 'goals', icon: '🎯', color: 'green' },
        { name: 'Configurações', value: 'settings', icon: '⚙️', color: 'blue' },
        { name: 'Sair', value: 'exit', icon: '❌', color: 'red' }
      ]
    );

    switch (choice) {
      case 'dashboard':
        if (this.getDashboardDataUseCase) {
          const dashboardScreen = new DashboardScreen(
            this.user,
            this.getDashboardDataUseCase,
            this.budgetUseCases ? this.budgetUseCases.listBudgets : null,
            this.goalUseCases ? this.goalUseCases.listGoals : null
          );
          const action = await dashboardScreen.show();

          // Se retornou 'transactions', navegar para tela de transações
          if (action === 'transactions') {
            if (this.transactionUseCases && this.categoryUseCases) {
              const transactionScreen = new TransactionScreen(
                this.user,
                this.transactionUseCases,
                this.categoryUseCases
              );
              await transactionScreen.show();
            }
          }
        } else {
          await this.showComingSoon('Dashboard');
        }
        return await this.show();
      case 'income':
        if (this.transactionUseCases && this.categoryUseCases) {
          const transactionScreen = new TransactionScreen(
            this.user,
            this.transactionUseCases,
            this.categoryUseCases
          );
          const addForm = transactionScreen.addTransactionForm;
          await addForm.show('income');
        } else {
          await this.showComingSoon('Nova Receita');
        }
        return await this.show();
      case 'expense':
        if (this.transactionUseCases && this.categoryUseCases) {
          const transactionScreen = new TransactionScreen(
            this.user,
            this.transactionUseCases,
            this.categoryUseCases
          );
          const addForm = transactionScreen.addTransactionForm;
          await addForm.show('expense');
        } else {
          await this.showComingSoon('Nova Despesa');
        }
        return await this.show();
      case 'categories':
        if (this.categoryUseCases) {
          const categoryScreen = new CategoryScreen(
            this.user,
            this.categoryUseCases.createCategoryUseCase,
            this.categoryUseCases.listCategoriesUseCase,
            this.categoryUseCases.updateCategoryUseCase,
            this.categoryUseCases.deleteCategoryUseCase
          );
          await categoryScreen.show();
        } else {
          await this.showComingSoon('Categorias');
        }
        return await this.show();
      case 'transactions':
        if (this.transactionUseCases && this.categoryUseCases) {
          const transactionScreen = new TransactionScreen(
            this.user,
            this.transactionUseCases,
            this.categoryUseCases
          );
          await transactionScreen.show();
        } else {
          await this.showComingSoon('Transações');
        }
        return await this.show();
      case 'reports':
        if (this.reportUseCases) {
          const reportsScreen = new ReportsScreen(
            this.user,
            this.reportUseCases,
            this.categoryUseCases
          );
          await reportsScreen.show();
        } else {
          await this.showComingSoon('Relatórios');
        }
        return await this.show();
      case 'budgets':
        if (this.budgetUseCases && this.categoryUseCases) {
          const budgetScreen = new BudgetScreen(
            this.user,
            this.budgetUseCases,
            this.categoryUseCases
          );
          await budgetScreen.show();
        } else {
          await this.showComingSoon('Orçamentos');
        }
        return await this.show();
      case 'goals':
        if (this.goalUseCases) {
          const goalScreen = new GoalScreen(
            this.user,
            this.goalUseCases
          );
          await goalScreen.show();
        } else {
          await this.showComingSoon('Metas Financeiras');
        }
        return await this.show();
      case 'settings':
        await this.showComingSoon('Configurações');
        return await this.show();
      case 'exit':
        return 'exit';
    }
  }

  /**
   * Exibe mensagem de funcionalidade em desenvolvimento
   */
  async showComingSoon(feature) {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.warning} Funcionalidade "${feature}" em desenvolvimento!\n\n` +
      `Esta funcionalidade será implementada em breve.`,
      { borderColor: 'yellow', padding: 2 }
    ));
    console.log('\n');
    await Input.pressKey();
  }
}

export default MainScreen;
