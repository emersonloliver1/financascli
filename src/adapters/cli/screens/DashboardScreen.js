import { ChartRenderer } from '../components/ChartRenderer.js';
import { BudgetList } from '../components/BudgetList.js';
import { GoalCard } from '../components/GoalCard.js';
import { GoalProgressBar } from '../components/GoalProgressBar.js';
import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';
import chalk from 'chalk';

/**
 * Tela do Dashboard - Visualização geral das finanças
 */
export class DashboardScreen {
  constructor(user, getDashboardDataUseCase, listBudgetsUseCase = null, listGoalsUseCase = null) {
    this.user = user;
    this.getDashboardDataUseCase = getDashboardDataUseCase;
    this.listBudgetsUseCase = listBudgetsUseCase;
    this.listGoalsUseCase = listGoalsUseCase;
  }

  /**
   * Exibe a tela do dashboard
   */
  async show() {
    try {
      // Buscar dados do dashboard
      const dashboardData = await this.getDashboardDataUseCase.execute(this.user.id);

      // Verificar se há dados
      if (!dashboardData.hasData()) {
        await this._showEmptyState();
        return;
      }

      // Renderizar dashboard completo
      await this._renderDashboard(dashboardData);

      // Menu de opções
      const choice = await QuickMenu.selectWithIcons(
        '💰 OPÇÕES',
        [
          { name: 'Atualizar', value: 'refresh', icon: '🔄', color: 'cyan' },
          { name: 'Ver Transações', value: 'transactions', icon: '💰', color: 'yellow' },
          { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
        ]
      );

      // Processar escolha
      switch (choice) {
        case 'refresh':
          // Recarregar dashboard
          return await this.show();
        case 'transactions':
          // Voltar e navegar para transações
          return 'transactions';
        case 'back':
        default:
          return 'back';
      }
    } catch (error) {
      console.error('\n');
      console.error(chalk.red(`❌ Erro ao carregar dashboard: ${error.message}`));
      console.error('\n');
      await Input.pressKey();
      return 'back';
    }
  }

  /**
   * Renderiza o dashboard completo
   * @private
   */
  async _renderDashboard(data) {
    clearScreen();

    console.log('\n');

    // Header
    const monthName = this._getFullMonthName(data.currentMonth.month);
    const header = `📊 DASHBOARD FINANCEIRO - ${monthName.toUpperCase()} ${data.currentMonth.year}`;
    console.log(createBox(header, { borderColor: '#667eea', padding: 1 }));
    console.log('\n');

    // Resumo em cards lado a lado
    this._renderSummaryCards(data);
    console.log('\n');

    // Separador
    console.log(ChartRenderer.renderSeparator(70));
    console.log('\n');

    // Evolução mensal (últimos 6 meses)
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      console.log(ChartRenderer.renderSectionTitle('EVOLUÇÃO (Últimos 6 meses)', '📈'));
      console.log('\n');
      console.log(ChartRenderer.renderMonthlyTrend(data.monthlyTrend, { width: 30 }));
      console.log('\n');
      console.log(ChartRenderer.renderSeparator(70));
      console.log('\n');
    }

    // Top 5 categorias
    if (data.topCategories && data.topCategories.length > 0) {
      const monthNameShort = this._getFullMonthName(data.currentMonth.month);
      console.log(ChartRenderer.renderSectionTitle(`TOP 5 CATEGORIAS (${monthNameShort})`, '🏆'));
      console.log('\n');
      console.log(ChartRenderer.renderTopCategories(data.topCategories, {
        width: 25,
        showPercentage: true
      }));
      console.log('\n');
      console.log(ChartRenderer.renderSeparator(70));
      console.log('\n');
    }

    // Widget de Orçamentos
    await this._renderBudgetWidget();

    // Widget de Metas
    await this._renderGoalsWidget();

    // Indicadores
    this._renderIndicators(data);
    console.log('\n');
  }

  /**
   * Renderiza cards de resumo lado a lado
   * @private
   */
  _renderSummaryCards(data) {
    const summary = data.getCurrentMonthSummary();
    const balance = data.getBalanceSummary();

    // Card do Saldo Geral
    const balanceLines = [
      chalk.gray('┌─────────────────────────────┐'),
      chalk.gray('│') + chalk.cyan.bold('   💰 SALDO GERAL           ') + chalk.gray('│'),
      chalk.gray('├─────────────────────────────┤'),
      chalk.gray('│') + this._padLine(`   ${balance.balance}`, 29) + chalk.gray('│'),
      chalk.gray('│') + this._padLine(`   ${balance.isPositive ? chalk.green('(positivo)') : chalk.red('(negativo)')}`, 29, true) + chalk.gray('│'),
      chalk.gray('│') + this._padLine('', 29) + chalk.gray('│'),
      chalk.gray('│') + this._padLine(`   Total: ${balance.count} transações`, 29) + chalk.gray('│'),
      chalk.gray('└─────────────────────────────┘')
    ];

    // Card do Mês Atual
    const monthLines = [
      chalk.gray('┌─────────────────────────────┐'),
      chalk.gray('│') + chalk.cyan.bold('   📅 MÊS ATUAL              ') + chalk.gray('│'),
      chalk.gray('├─────────────────────────────┤'),
      chalk.gray('│') + this._padLine(`   Receitas: ${chalk.green(summary.income)}`, 29, true) + chalk.gray('│'),
      chalk.gray('│') + this._padLine(`   Despesas: ${chalk.red(summary.expense)}`, 29, true) + chalk.gray('│'),
      chalk.gray('│') + this._padLine(`   Saldo:    ${summary.isPositive ? chalk.green(summary.balance) : chalk.red(summary.balance)}`, 29, true) + chalk.gray('│'),
      chalk.gray('│') + this._padLine('', 29) + chalk.gray('│'),
      chalk.gray('└─────────────────────────────┘')
    ];

    // Renderizar cards lado a lado
    for (let i = 0; i < Math.max(balanceLines.length, monthLines.length); i++) {
      const leftCard = balanceLines[i] || '';
      const rightCard = monthLines[i] || '';
      console.log(`${leftCard}  ${rightCard}`);
    }
  }

  /**
   * Renderiza indicadores de tendência
   * @private
   */
  _renderIndicators(data) {
    const indicators = data.getIndicators();

    console.log(ChartRenderer.renderSectionTitle('INDICADORES', '📊'));
    console.log('\n');

    // Tendência
    const trendText = ChartRenderer.renderTrendIndicator(
      data.currentMonth.expense,
      data.previousMonth.expense,
      { showPercentage: true, invertColors: true }
    );
    console.log(`${icons.arrow} Tendência: ${trendText}`);

    // Média diária
    console.log(`${icons.arrow} Média diária: ${chalk.cyan(indicators.dailyAverage)}/dia`);

    // Projeção do mês
    const today = new Date();
    const dayOfMonth = today.getDate();
    console.log(`${icons.arrow} Projeção do mês: ${chalk.cyan(indicators.projected)} ${chalk.dim(`(baseado em ${dayOfMonth} dias)`)}`);
  }

  /**
   * Exibe estado vazio (sem transações)
   * @private
   */
  async _showEmptyState() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.info} Dashboard vazio!\n\n` +
      `Você ainda não possui transações cadastradas.\n` +
      `Adicione sua primeira transação para ver os gráficos e estatísticas.`,
      { borderColor: 'yellow', padding: 2 }
    ));
    console.log('\n');
    await Input.pressKey();
  }

  /**
   * Preenche linha com espaços (helper para cards)
   * @private
   */
  _padLine(text, width, hasColor = false) {
    // Se tem cor, precisamos calcular o tamanho real sem os códigos ANSI
    if (hasColor) {
      // Remover códigos ANSI para calcular tamanho real
      const plainText = text.replace(/\x1b\[[0-9;]*m/g, '');
      const padding = width - plainText.length;
      return text + ' '.repeat(Math.max(0, padding));
    }

    return text.padEnd(width);
  }

  /**
   * Obtém nome completo do mês
   * @private
   */
  _getFullMonthName(monthNumber) {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthNumber - 1] || 'N/A';
  }

  /**
   * Renderiza widget de orçamentos
   * @private
   */
  async _renderBudgetWidget() {
    if (!this.listBudgetsUseCase) {
      return; // Widget não disponível se não houver use case
    }

    try {
      const result = await this.listBudgetsUseCase.execute(this.user.id, {
        activeOnly: true
      });

      if (result.success && result.budgets && result.budgets.length > 0) {
        BudgetList.renderWidget(result.budgets);
        console.log('\n');
        console.log(ChartRenderer.renderSeparator(70));
        console.log('\n');
      }
    } catch (error) {
      // Silenciosamente ignorar erro no widget
      console.error('Erro ao carregar widget de orçamentos:', error.message);
    }
  }

  /**
   * Renderiza widget de metas financeiras
   * @private
   */
  async _renderGoalsWidget() {
    if (!this.listGoalsUseCase) {
      return; // Widget não disponível se não houver use case
    }

    try {
      const goals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });

      if (goals && goals.length > 0) {
        // Limitar a 3 metas mais próximas de conclusão
        const topGoals = goals.slice(0, 3);

        console.log(ChartRenderer.renderSectionTitle('METAS FINANCEIRAS', '🎯'));
        console.log('');

        topGoals.forEach((goal, index) => {
          console.log(GoalCard.renderCompact(goal));
          if (index < topGoals.length - 1) {
            console.log('');
          }
        });

        console.log('');
        console.log(ChartRenderer.renderSeparator(70));
        console.log('');
      }
    } catch (error) {
      // Silenciosamente ignorar erro no widget
      console.error('Erro ao carregar widget de metas:', error.message);
    }
  }
}
