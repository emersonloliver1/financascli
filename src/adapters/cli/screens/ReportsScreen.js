import chalk from 'chalk';
import inquirer from 'inquirer';
import { ReportRenderer } from '../components/ReportRenderer.js';
import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { icons } from '../utils/colors.js';

/**
 * Tela de Relatórios - Gerenciamento de todos os tipos de relatórios
 */
export class ReportsScreen {
  constructor(
    user,
    reportUseCases,
    categoryUseCases
  ) {
    this.user = user;
    this.reportUseCases = reportUseCases;
    this.categoryUseCases = categoryUseCases;
  }

  /**
   * Exibe a tela principal de relatórios
   */
  async show() {
    while (true) {
      clearScreen();

      console.log('\n');
      console.log(createBox(
        `${icons.chart} RELATÓRIOS E ANÁLISES\n${chalk.dim('Selecione o tipo de relatório desejado')}`,
        { borderColor: '#667eea', padding: 1 }
      ));
      console.log('\n');

      const choice = await QuickMenu.selectWithIcons(
        '📊 TIPOS DE RELATÓRIOS',
        [
          { name: 'Relatório Mensal', value: 'monthly', icon: '📅', color: 'cyan' },
          { name: 'Relatório por Categoria', value: 'category', icon: '📂', color: 'purple' },
          { name: 'Evolução Temporal', value: 'evolution', icon: '📈', color: 'green' },
          { name: 'Maiores Transações', value: 'top', icon: '🏆', color: 'yellow' },
          { name: 'Relatório Comparativo', value: 'comparative', icon: '⚖️', color: 'magenta' },
          { name: 'Análise de Padrões', value: 'patterns', icon: '🔍', color: 'blue' },
          { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
        ]
      );

      if (choice === 'back') {
        return 'back';
      }

      // Processar escolha
      const result = await this._handleReportChoice(choice);

      // Se retornou 'back', voltar ao menu
      if (result === 'back') {
        continue;
      }
    }
  }

  /**
   * Processa a escolha do tipo de relatório
   * @private
   */
  async _handleReportChoice(type) {
    try {
      let report = null;

      switch (type) {
        case 'monthly':
          report = await this._generateMonthlyReport();
          break;
        case 'category':
          report = await this._generateCategoryReport();
          break;
        case 'evolution':
          report = await this._generateEvolutionReport();
          break;
        case 'top':
          report = await this._generateTopTransactionsReport();
          break;
        case 'comparative':
          report = await this._generateComparativeReport();
          break;
        case 'patterns':
          report = await this._generatePatternAnalysisReport();
          break;
      }

      if (report) {
        await this._displayReport(report);
      }

      return 'back';
    } catch (error) {
      console.error('\n');
      console.error(chalk.red(`❌ Erro ao gerar relatório: ${error.message}`));
      console.error('\n');
      await Input.pressKey();
      return 'back';
    }
  }

  /**
   * Gera relatório mensal
   * @private
   */
  async _generateMonthlyReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('📅 RELATÓRIO MENSAL DETALHADO'));
    console.log('\n');

    // Selecionar mês e ano
    const { month, year } = await this._selectMonthYear();

    // Gerar relatório
    console.log(chalk.dim('\nGerando relatório...'));
    const report = await this.reportUseCases.generateMonthlyReport.execute(
      this.user.id,
      month,
      year
    );

    return report;
  }

  /**
   * Gera relatório por categoria
   * @private
   */
  async _generateCategoryReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('📂 RELATÓRIO POR CATEGORIA'));
    console.log('\n');

    // Listar categorias
    const categories = await this.categoryUseCases.listCategoriesUseCase.execute(this.user.id);

    if (categories.length === 0) {
      console.log(chalk.yellow('Você ainda não possui categorias cadastradas.'));
      console.log('\n');
      await Input.pressKey();
      return null;
    }

    // Selecionar categoria
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'categoryId',
        message: 'Selecione uma categoria:',
        choices: categories.map(cat => ({
          name: `${cat.icon} ${cat.name}`,
          value: cat.id
        }))
      },
      {
        type: 'list',
        name: 'months',
        message: 'Período de análise:',
        choices: [
          { name: 'Últimos 3 meses', value: 3 },
          { name: 'Últimos 6 meses', value: 6 },
          { name: 'Últimos 12 meses', value: 12 },
          { name: 'Últimos 24 meses', value: 24 }
        ],
        default: 6
      }
    ]);

    // Gerar relatório
    console.log(chalk.dim('\nGerando relatório...'));
    const report = await this.reportUseCases.generateCategoryReport.execute(
      this.user.id,
      answers.categoryId,
      answers.months
    );

    return report;
  }

  /**
   * Gera relatório de evolução
   * @private
   */
  async _generateEvolutionReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('📈 EVOLUÇÃO FINANCEIRA'));
    console.log('\n');

    // Selecionar período
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'months',
        message: 'Período de análise:',
        choices: [
          { name: 'Últimos 3 meses', value: 3 },
          { name: 'Últimos 6 meses', value: 6 },
          { name: 'Últimos 12 meses', value: 12 },
          { name: 'Últimos 24 meses', value: 24 }
        ],
        default: 12
      }
    ]);

    // Gerar relatório
    console.log(chalk.dim('\nGerando relatório...'));
    const report = await this.reportUseCases.generateEvolutionReport.execute(
      this.user.id,
      answers.months
    );

    return report;
  }

  /**
   * Gera relatório de maiores transações
   * @private
   */
  async _generateTopTransactionsReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('🏆 MAIORES TRANSAÇÕES'));
    console.log('\n');

    // Selecionar período
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'period',
        message: 'Período:',
        choices: [
          { name: 'Hoje', value: 'today' },
          { name: 'Esta Semana', value: 'week' },
          { name: 'Este Mês', value: 'month' },
          { name: 'Este Ano', value: 'year' }
        ],
        default: 'month'
      },
      {
        type: 'list',
        name: 'limit',
        message: 'Quantidade de transações:',
        choices: [
          { name: 'Top 5', value: 5 },
          { name: 'Top 10', value: 10 },
          { name: 'Top 20', value: 20 }
        ],
        default: 10
      }
    ]);

    // Gerar relatório
    console.log(chalk.dim('\nGerando relatório...'));
    const report = await this.reportUseCases.generateTopTransactionsReport.execute(
      this.user.id,
      {
        period: answers.period,
        limit: answers.limit
      }
    );

    return report;
  }

  /**
   * Gera relatório comparativo
   * @private
   */
  async _generateComparativeReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('⚖️ RELATÓRIO COMPARATIVO'));
    console.log('\n');

    console.log(chalk.white('Primeiro período:'));
    const period1 = await this._selectMonthYear();

    console.log('\n');
    console.log(chalk.white('Segundo período:'));
    const period2 = await this._selectMonthYear();

    // Gerar relatório
    console.log(chalk.dim('\nGerando relatório comparativo...'));
    const report = await this.reportUseCases.generateComparativeReport.execute(
      this.user.id,
      period1,
      period2
    );

    return report;
  }

  /**
   * Gera análise de padrões
   * @private
   */
  async _generatePatternAnalysisReport() {
    clearScreen();
    console.log('\n');
    console.log(chalk.cyan.bold('🔍 ANÁLISE DE PADRÕES'));
    console.log('\n');

    // Selecionar período
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'months',
        message: 'Período de análise:',
        choices: [
          { name: 'Últimos 3 meses', value: 3 },
          { name: 'Últimos 6 meses', value: 6 },
          { name: 'Últimos 12 meses', value: 12 }
        ],
        default: 6
      }
    ]);

    // Gerar relatório
    console.log(chalk.dim('\nGerando análise de padrões...'));
    const report = await this.reportUseCases.generatePatternAnalysisReport.execute(
      this.user.id,
      answers.months
    );

    return report;
  }

  /**
   * Exibe um relatório gerado
   * @private
   */
  async _displayReport(report) {
    clearScreen();

    // Renderizar relatório
    const rendered = ReportRenderer.render(report);
    console.log(rendered);

    console.log('\n');

    // Menu de opções
    const choice = await QuickMenu.selectWithIcons(
      '⚙️ OPÇÕES',
      [
        { name: 'Exportar (em breve)', value: 'export', icon: '📄', color: 'blue' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      ]
    );

    if (choice === 'export') {
      console.log('\n');
      console.log(chalk.yellow('⚠️ Funcionalidade de exportação será implementada na Fase 6.'));
      console.log('\n');
      await Input.pressKey();
    }
  }

  /**
   * Seletor de mês e ano
   * @private
   */
  async _selectMonthYear() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Gerar lista de meses dos últimos 2 anos
    const monthChoices = [];
    for (let yearOffset = 0; yearOffset < 2; yearOffset++) {
      const year = currentYear - yearOffset;

      for (let month = 12; month >= 1; month--) {
        // Não incluir meses futuros
        if (year === currentYear && month > currentMonth) {
          continue;
        }

        monthChoices.push({
          name: `${this._getFullMonthName(month)} de ${year}`,
          value: { month, year }
        });

        // Limitar a 24 meses
        if (monthChoices.length >= 24) {
          break;
        }
      }

      if (monthChoices.length >= 24) {
        break;
      }
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'period',
        message: 'Selecione o mês:',
        choices: monthChoices,
        pageSize: 12
      }
    ]);

    return answers.period;
  }

  /**
   * Retorna o nome completo do mês
   * @private
   */
  _getFullMonthName(monthNumber) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1] || 'N/A';
  }
}
