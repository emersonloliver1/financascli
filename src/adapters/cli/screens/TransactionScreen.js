import { QuickMenu } from '../components/QuickMenu.js';
import { AddTransactionForm } from '../components/AddTransactionForm.js';
import { TransactionList } from '../components/TransactionList.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { colors, icons } from '../utils/colors.js';

/**
 * Tela principal de gerenciamento de transações
 */
export class TransactionScreen {
  constructor(user, transactionUseCases, categoryUseCases) {
    this.user = user;
    this.transactionUseCases = transactionUseCases;
    this.categoryUseCases = categoryUseCases;

    // Componentes
    this.addTransactionForm = new AddTransactionForm(
      user,
      transactionUseCases,
      categoryUseCases
    );

    this.transactionList = new TransactionList(
      user,
      transactionUseCases
    );
  }

  /**
   * Exibe o menu principal de transações
   */
  async show() {
    clearScreen();

    // Header
    console.log('\n');
    console.log(createBox(
      `${icons.money} GERENCIAR TRANSAÇÕES`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    // Menu principal
    const choice = await QuickMenu.selectWithIcons(
      'O que deseja fazer?',
      [
        { name: 'Adicionar Receita', value: 'income', icon: '📈', color: 'green' },
        { name: 'Adicionar Despesa', value: 'expense', icon: '📉', color: 'red' },
        { name: 'Ver Transações', value: 'list', icon: '📋', color: 'blue' },
        { name: 'Filtros Avançados', value: 'filters', icon: '🔍', color: 'purple' },
        { name: 'Resumo Rápido', value: 'summary', icon: '📊', color: 'cyan' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      ]
    );

    switch (choice) {
      case 'income':
        await this.addTransactionForm.show('income');
        return await this.show();

      case 'expense':
        await this.addTransactionForm.show('expense');
        return await this.show();

      case 'list':
        await this.transactionList.show({ page: 1, limit: 10 });
        return await this.show();

      case 'filters':
        await this._showFilters();
        return await this.show();

      case 'summary':
        await this._showSummary();
        return await this.show();

      case 'back':
      default:
        return;
    }
  }

  /**
   * Exibe filtros avançados (simplificado por enquanto)
   * @private
   */
  async _showFilters() {
    clearScreen();

    console.log('\n');
    console.log(createBox(
      `${icons.search} FILTROS AVANÇADOS`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    const filterChoice = await QuickMenu.selectWithIcons(
      'Filtrar por',
      [
        { name: 'Apenas Receitas', value: 'income', icon: '📈', color: 'green' },
        { name: 'Apenas Despesas', value: 'expense', icon: '📉', color: 'red' },
        { name: 'Este Mês', value: 'month', icon: '📅', color: 'blue' },
        { name: 'Esta Semana', value: 'week', icon: '📅', color: 'cyan' },
        { name: 'Hoje', value: 'today', icon: '📅', color: 'yellow' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      ]
    );

    if (!filterChoice || filterChoice === 'back') {
      return;
    }

    let filters = {};

    if (filterChoice === 'income' || filterChoice === 'expense') {
      filters.type = filterChoice;
    }

    if (filterChoice === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      filters.startDate = today;
      filters.endDate = tomorrow;
    }

    if (filterChoice === 'week') {
      const today = new Date();
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay()); // Domingo
      firstDay.setHours(0, 0, 0, 0);

      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 7);

      filters.startDate = firstDay;
      filters.endDate = lastDay;
    }

    if (filterChoice === 'month') {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      filters.startDate = firstDay;
      filters.endDate = lastDay;
    }

    await this.transactionList.show({ page: 1, limit: 10, filters });
  }

  /**
   * Exibe resumo rápido
   * @private
   */
  async _showSummary() {
    clearScreen();

    console.log('\n');
    console.log(createBox(
      `${icons.chart} RESUMO RÁPIDO`,
      { borderColor: '#667eea', padding: 1 }
    ));
    console.log('\n');

    console.log(colors.info('⏳ Carregando resumo...\n'));

    // Resumo geral (todas as transações)
    const resultAll = await this.transactionUseCases.listTransactionsUseCase.execute({
      userId: this.user.id,
      page: 1,
      limit: 1
    });

    // Resumo do mês
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const resultMonth = await this.transactionUseCases.listTransactionsUseCase.execute({
      userId: this.user.id,
      page: 1,
      limit: 1,
      filters: {
        startDate: firstDay,
        endDate: lastDay
      }
    });

    clearScreen();

    if (!resultAll.success || !resultMonth.success) {
      console.log(colors.error('\n❌ Erro ao carregar resumo\n'));
      await require('../components/Input.js').Input.pressKey();
      return;
    }

    console.log('\n');
    console.log(createBox(
      `${icons.chart} RESUMO FINANCEIRO\n\n` +
      `${colors.bold('📊 GERAL (Todas as transações)')}\n` +
      `${colors.success(`  📈 Receitas: R$ ${this._formatMoney(resultAll.summary.totalIncome)}`)}\n` +
      `${colors.error(`  📉 Despesas: R$ ${this._formatMoney(resultAll.summary.totalExpense)}`)}\n` +
      `${colors.info(`  💰 Saldo: R$ ${this._formatMoney(resultAll.summary.balance)}`)}\n\n` +
      `${colors.bold('📅 ESTE MÊS')}\n` +
      `${colors.success(`  📈 Receitas: R$ ${this._formatMoney(resultMonth.summary.totalIncome)}`)}\n` +
      `${colors.error(`  📉 Despesas: R$ ${this._formatMoney(resultMonth.summary.totalExpense)}`)}\n` +
      `${colors.info(`  💰 Saldo: R$ ${this._formatMoney(resultMonth.summary.balance)}`)}`,
      { borderColor: '#667eea', padding: 2 }
    ));
    console.log('\n');

    await require('../components/Input.js').Input.pressKey();
  }

  /**
   * Formata valor monetário
   * @private
   */
  _formatMoney(value) {
    return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}

export default TransactionScreen;
