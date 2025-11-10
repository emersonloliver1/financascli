import chalk from 'chalk';
import { ChartRenderer } from './ChartRenderer.js';
import { createBox, createSeparator } from '../utils/banner.js';
import { colors, icons } from '../utils/colors.js';

/**
 * Componente para renderizar relatórios financeiros no terminal
 */
export class ReportRenderer {
  /**
   * Renderiza um relatório completo baseado no tipo
   * @param {Report} report - Entidade de relatório
   * @returns {string}
   */
  static render(report) {
    if (!report || !report.type) {
      return chalk.red('Relatório inválido');
    }

    const renderers = {
      'monthly': this.renderMonthlyReport.bind(this),
      'category': this.renderCategoryReport.bind(this),
      'evolution': this.renderEvolutionReport.bind(this),
      'top': this.renderTopTransactionsReport.bind(this),
      'comparative': this.renderComparativeReport.bind(this),
      'pattern': this.renderPatternAnalysisReport.bind(this)
    };

    const renderer = renderers[report.type];
    if (!renderer) {
      return chalk.red(`Tipo de relatório desconhecido: ${report.type}`);
    }

    return renderer(report);
  }

  /**
   * Renderiza Relatório Mensal Detalhado
   */
  static renderMonthlyReport(report) {
    const { data, summary, period } = report;
    let output = '';

    // Cabeçalho
    output += '\n' + createBox(
      `${icons.chart} ${chalk.bold(report.getTitle())}\n${chalk.dim(period.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Resumo do Mês
    output += ChartRenderer.renderSectionTitle('RESUMO DO MÊS', '📅') + '\n';
    output += chalk.gray('┌' + '─'.repeat(58) + '┐') + '\n';

    const summaryLines = [
      `Total Receitas:     ${chalk.green(this._formatCurrency(summary.totalIncome))}  💰`,
      `Total Despesas:     ${chalk.red(this._formatCurrency(summary.totalExpense))}  💸`,
      `Saldo do Mês:       ${summary.balance >= 0 ? chalk.green(this._formatCurrency(summary.balance)) : chalk.red(this._formatCurrency(summary.balance))}  ${summary.balance >= 0 ? '✅' : '⚠️'}`,
      `Transações:         ${summary.transactionCount} registros`,
    ];

    // Adicionar média diária se houver dados
    if (data.dailyStats && data.dailyStats.averageDaily > 0) {
      summaryLines.push(
        `Média Diária:       ${this._formatCurrency(data.dailyStats.averageDaily)}/dia`
      );
    }

    // Adicionar maior gasto se houver
    if (data.dailyStats && data.dailyStats.maxExpenseDay) {
      const maxDay = data.dailyStats.maxExpenseDay;
      const dayFormatted = new Date(maxDay.day).getDate();
      summaryLines.push(
        `Maior Gasto:        ${this._formatCurrency(maxDay.expense)} (dia ${dayFormatted})`
      );
    }

    summaryLines.forEach(line => {
      output += chalk.gray('│ ') + line.padEnd(66) + chalk.gray('│') + '\n';
    });

    output += chalk.gray('└' + '─'.repeat(58) + '┘') + '\n\n';

    // Distribuição por Categoria
    if (data.categoryDistribution && data.categoryDistribution.length > 0) {
      output += ChartRenderer.renderSectionTitle('DISTRIBUIÇÃO POR CATEGORIA', '📊') + '\n';

      const maxTotal = Math.max(...data.categoryDistribution.map(c => c.total));

      data.categoryDistribution.slice(0, 5).forEach(cat => {
        const icon = cat.icon || '📂';
        const name = cat.categoryName.padEnd(15);
        const value = this._formatCurrency(cat.total).padStart(15);
        const percentage = `(${cat.percentage.toFixed(0)}%)`;

        // Criar barra proporcional
        const barLength = Math.round((cat.total / maxTotal) * 20);
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        const coloredBar = chalk.red(bar);

        output += `${icon} ${chalk.white(name)} ${coloredBar} ${chalk.white(value)} ${chalk.dim(percentage)}\n`;
      });

      output += '\n';
    }

    // Transações Recentes
    if (data.transactions && data.transactions.length > 0) {
      output += ChartRenderer.renderSectionTitle('TRANSAÇÕES RECENTES', '📋') + '\n';
      output += chalk.gray('┌' + '─'.repeat(10) + '┬' + '─'.repeat(17) + '┬' + '─'.repeat(9) + '┬' + '─'.repeat(14) + '┐') + '\n';
      output += chalk.gray('│ ') + chalk.white('Data'.padEnd(8)) + chalk.gray(' │ ') +
                chalk.white('Categoria'.padEnd(15)) + chalk.gray(' │ ') +
                chalk.white('Tipo'.padEnd(7)) + chalk.gray(' │ ') +
                chalk.white('Valor'.padEnd(12)) + chalk.gray(' │') + '\n';
      output += chalk.gray('├' + '─'.repeat(10) + '┼' + '─'.repeat(17) + '┼' + '─'.repeat(9) + '┼' + '─'.repeat(14) + '┤') + '\n';

      data.transactions.slice(0, 10).forEach(t => {
        const date = new Date(t.date);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        const icon = t.category.icon || (t.type === 'income' ? '📈' : '📉');
        const category = `${icon} ${t.category.name}`.substring(0, 15).padEnd(15);
        const typeStr = t.type === 'income' ? chalk.green('Receita') : chalk.red('Despesa');
        const value = this._formatCurrency(t.amount).padStart(12);
        const valueColored = t.type === 'income' ? chalk.green(value) : chalk.red(value);

        output += chalk.gray('│ ') + dateStr.padEnd(8) + chalk.gray(' │ ') +
                  category + chalk.gray(' │ ') +
                  typeStr.padEnd(15) + chalk.gray(' │ ') +
                  valueColored + chalk.gray(' │') + '\n';
      });

      output += chalk.gray('└' + '─'.repeat(10) + '┴' + '─'.repeat(17) + '┴' + '─'.repeat(9) + '┴' + '─'.repeat(14) + '┘') + '\n';

      if (data.transactions.length > 10) {
        output += chalk.dim(`... e mais ${data.transactions.length - 10} transações\n`);
      }
    } else {
      output += chalk.yellow('Nenhuma transação neste mês.\n');
    }

    return output;
  }

  /**
   * Renderiza Relatório por Categoria
   */
  static renderCategoryReport(report) {
    const { data, summary, period } = report;
    let output = '';

    // Cabeçalho
    const catInfo = data.category;
    output += '\n' + createBox(
      `${catInfo.icon} ${chalk.bold(catInfo.name)}\n${chalk.dim(period.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Resumo
    output += ChartRenderer.renderSectionTitle('RESUMO DA CATEGORIA', '📊') + '\n';
    output += chalk.gray('┌' + '─'.repeat(58) + '┐') + '\n';

    const summaryLines = [
      `Total Gasto:        ${chalk.red(this._formatCurrency(summary.total))}`,
      `Transações:         ${summary.transactionCount} registros`,
      `Ticket Médio:       ${this._formatCurrency(summary.averageTicket)}`,
      `Menor Valor:        ${this._formatCurrency(summary.minAmount)}`,
      `Maior Valor:        ${this._formatCurrency(summary.maxAmount)}`
    ];

    summaryLines.forEach(line => {
      output += chalk.gray('│ ') + line.padEnd(66) + chalk.gray('│') + '\n';
    });

    output += chalk.gray('└' + '─'.repeat(58) + '┘') + '\n\n';

    // Evolução Mensal
    if (data.monthlyEvolution && data.monthlyEvolution.length > 0) {
      output += ChartRenderer.renderSectionTitle('EVOLUÇÃO MENSAL', '📈') + '\n';

      const maxValue = Math.max(...data.monthlyEvolution.map(m => m.total));

      data.monthlyEvolution.forEach(month => {
        const label = `${month.monthName}/${month.year}`.padEnd(10);
        const barLength = maxValue > 0 ? Math.round((month.total / maxValue) * 30) : 0;
        const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
        const value = this._formatCurrency(month.total).padStart(15);
        const count = chalk.dim(`(${month.count} transações)`);

        output += `${label} ${chalk.cyan(bar)} ${chalk.white(value)} ${count}\n`;
      });

      output += '\n';
    }

    // Tendência Recente
    if (data.recentTrend) {
      const trend = data.recentTrend;
      output += ChartRenderer.renderSectionTitle('TENDÊNCIA RECENTE', '🔍') + '\n';

      const trendIcon = trend.trend === 'increasing' ? '↑' : trend.trend === 'decreasing' ? '↓' : '→';
      const trendColor = trend.trend === 'increasing' ? 'red' : trend.trend === 'decreasing' ? 'green' : 'yellow';
      const trendText = trend.trend === 'increasing' ? 'AUMENTANDO' : trend.trend === 'decreasing' ? 'DIMINUINDO' : 'ESTÁVEL';

      output += `${chalk[trendColor](trendIcon + ' ' + trendText)} ${chalk.dim('(últimos 3 meses vs 3 anteriores)')}\n`;
      output += `Variação: ${trend.variation >= 0 ? '+' : ''}${trend.variation.toFixed(1)}%\n\n`;
    }

    // Transações Recentes
    if (data.transactions && data.transactions.length > 0) {
      output += ChartRenderer.renderSectionTitle('TRANSAÇÕES RECENTES', '📋') + '\n';

      data.transactions.slice(0, 10).forEach(t => {
        const date = new Date(t.date);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
        const value = this._formatCurrency(t.amount);
        const desc = t.description || 'Sem descrição';

        output += `${chalk.dim(dateStr)} - ${chalk.white(value.padStart(15))} - ${chalk.gray(desc.substring(0, 30))}\n`;
      });

      if (data.transactions.length > 10) {
        output += chalk.dim(`... e mais ${data.transactions.length - 10} transações\n`);
      }
    }

    return output;
  }

  /**
   * Renderiza Relatório de Evolução Temporal
   */
  static renderEvolutionReport(report) {
    const { data, summary, period } = report;
    let output = '';

    // Cabeçalho
    output += '\n' + createBox(
      `${icons.chart} ${chalk.bold(report.getTitle())}\n${chalk.dim(period.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Gráfico de Evolução
    if (data.monthlyData && data.monthlyData.length > 0) {
      output += ChartRenderer.renderSectionTitle('EVOLUÇÃO MENSAL', '📈') + '\n';

      const maxBalance = Math.max(...data.monthlyData.map(m => Math.abs(m.balance)));

      data.monthlyData.forEach(month => {
        const label = `${month.monthName}/${String(month.year).slice(-2)}`.padEnd(8);
        const balance = month.balance;
        const isPositive = balance >= 0;

        // Criar barra proporcional ao saldo
        const barLength = maxBalance > 0 ? Math.round((Math.abs(balance) / maxBalance) * 20) : 0;
        const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
        const coloredBar = isPositive ? chalk.green(bar) : chalk.red(bar);

        const value = this._formatCurrency(Math.abs(balance)).padStart(12);
        const sign = isPositive ? '+' : '-';
        const valueColored = isPositive ? chalk.green(`${sign}${value}`) : chalk.red(`${sign}${value}`);

        output += `${label} ${coloredBar} ${valueColored}\n`;
      });

      output += '\n';
    }

    // Estatísticas
    output += ChartRenderer.renderSectionTitle('ESTATÍSTICAS', '📊') + '\n';
    output += chalk.gray('┌' + '─'.repeat(58) + '┐') + '\n';

    const stats = [
      `→ Saldo Médio:      ${summary.averageMonthlyBalance >= 0 ? chalk.green(this._formatCurrency(summary.averageMonthlyBalance)) : chalk.red(this._formatCurrency(Math.abs(summary.averageMonthlyBalance)))}`,
      `→ Melhor Mês:       ${summary.bestMonth ? `${summary.bestMonth.monthName}/${summary.bestMonth.year} (${chalk.green(this._formatCurrency(summary.bestMonth.balance))})` : 'N/A'}`,
      `→ Pior Mês:         ${summary.worstMonth ? `${summary.worstMonth.monthName}/${summary.worstMonth.year} (${chalk.red(this._formatCurrency(Math.abs(summary.worstMonth.balance)))})` : 'N/A'}`
    ];

    // Adicionar tendência
    if (data.trend) {
      const trendIcon = data.trend.type === 'growing' ? '↑' : data.trend.type === 'declining' ? '↓' : '→';
      const trendColor = data.trend.type === 'growing' ? 'green' : data.trend.type === 'declining' ? 'red' : 'yellow';
      const trendText = data.trend.type === 'growing' ? 'CRESCIMENTO' : data.trend.type === 'declining' ? 'QUEDA' : 'ESTÁVEL';

      stats.push(`→ Tendência:        ${chalk[trendColor](trendIcon + ' ' + trendText)} ${chalk.dim('(' + (data.trend.variation >= 0 ? '+' : '') + data.trend.variation.toFixed(1) + '%)')}`);
    }

    stats.push(`→ Saldo Acumulado:  ${data.trend && data.trend.finalAccumulated >= 0 ? chalk.green(this._formatCurrency(data.trend.finalAccumulated)) : chalk.red(this._formatCurrency(Math.abs(data.trend?.finalAccumulated || 0)))}`);

    stats.forEach(line => {
      output += chalk.gray('│ ') + line.padEnd(80) + chalk.gray('│') + '\n';
    });

    output += chalk.gray('└' + '─'.repeat(58) + '┘') + '\n';

    return output;
  }

  /**
   * Renderiza Relatório de Maiores Transações
   */
  static renderTopTransactionsReport(report) {
    const { data, summary, period } = report;
    let output = '';

    // Cabeçalho
    output += '\n' + createBox(
      `${icons.trophy} ${chalk.bold(report.getTitle())}\n${chalk.dim(period.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Top Despesas
    if (data.topExpenses && data.topExpenses.length > 0) {
      output += ChartRenderer.renderSectionTitle(`TOP ${data.limit} MAIORES DESPESAS`, '💸') + '\n';

      const totalTopExpenses = data.topExpenses.reduce((sum, t) => sum + t.amount, 0);

      data.topExpenses.forEach((t, index) => {
        const position = chalk.gray(`${index + 1}.`.padStart(3));
        const date = new Date(t.date);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        const icon = t.category.icon || '📉';
        const category = `${icon} ${t.category.name}`.substring(0, 18).padEnd(18);
        const value = this._formatCurrency(t.amount).padStart(15);
        const percentage = summary.totalExpense > 0 ? `(${((t.amount / summary.totalExpense) * 100).toFixed(1)}%)` : '';

        output += `${position} ${chalk.dim(dateStr)} ${category} ${chalk.red(value)} ${chalk.dim(percentage)}\n`;
      });

      output += chalk.dim(`\nTotal: ${this._formatCurrency(totalTopExpenses)} (${summary.totalExpense > 0 ? ((totalTopExpenses / summary.totalExpense) * 100).toFixed(1) : 0}% do total de despesas)\n`);
      output += '\n';
    } else {
      output += chalk.yellow('Nenhuma despesa no período selecionado.\n\n');
    }

    // Top Receitas
    if (data.topIncomes && data.topIncomes.length > 0) {
      output += ChartRenderer.renderSectionTitle(`TOP ${data.limit} MAIORES RECEITAS`, '💰') + '\n';

      const totalTopIncomes = data.topIncomes.reduce((sum, t) => sum + t.amount, 0);

      data.topIncomes.forEach((t, index) => {
        const position = chalk.gray(`${index + 1}.`.padStart(3));
        const date = new Date(t.date);
        const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        const icon = t.category.icon || '📈';
        const category = `${icon} ${t.category.name}`.substring(0, 18).padEnd(18);
        const value = this._formatCurrency(t.amount).padStart(15);
        const percentage = summary.totalIncome > 0 ? `(${((t.amount / summary.totalIncome) * 100).toFixed(1)}%)` : '';

        output += `${position} ${chalk.dim(dateStr)} ${category} ${chalk.green(value)} ${chalk.dim(percentage)}\n`;
      });

      output += chalk.dim(`\nTotal: ${this._formatCurrency(totalTopIncomes)} (${summary.totalIncome > 0 ? ((totalTopIncomes / summary.totalIncome) * 100).toFixed(1) : 0}% do total de receitas)\n`);
    } else {
      output += chalk.yellow('Nenhuma receita no período selecionado.\n');
    }

    return output;
  }

  /**
   * Renderiza Relatório Comparativo
   */
  static renderComparativeReport(report) {
    const { data, period } = report;
    let output = '';

    // Cabeçalho
    output += '\n' + createBox(
      `${icons.chart} ${chalk.bold(report.getTitle())}\n${chalk.dim(period.period1.label + ' vs ' + period.period2.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Comparação Geral
    output += ChartRenderer.renderSectionTitle('COMPARAÇÃO GERAL', '⚖️') + '\n';
    output += chalk.gray('┌' + '─'.repeat(20) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┐') + '\n';
    output += chalk.gray('│ ') + ''.padEnd(18) + chalk.gray(' │ ') +
              chalk.white(period.period1.label.substring(0, 13).padEnd(13)) + chalk.gray(' │ ') +
              chalk.white(period.period2.label.substring(0, 13).padEnd(13)) + chalk.gray(' │ ') +
              chalk.white('Diferença'.padEnd(13)) + chalk.gray(' │') + '\n';
    output += chalk.gray('├' + '─'.repeat(20) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┤') + '\n';

    // Receitas
    const incomeRow = this._buildComparisonRow(
      'Receitas',
      data.summary1.income,
      data.summary2.income,
      data.comparison.incomeDiff,
      'green'
    );
    output += incomeRow + '\n';

    // Despesas
    const expenseRow = this._buildComparisonRow(
      'Despesas',
      data.summary1.expense,
      data.summary2.expense,
      data.comparison.expenseDiff,
      'red'
    );
    output += expenseRow + '\n';

    // Saldo
    const balanceRow = this._buildComparisonRow(
      'Saldo',
      data.summary1.balance,
      data.summary2.balance,
      data.comparison.balanceDiff,
      data.comparison.balanceDiff >= 0 ? 'green' : 'red'
    );
    output += balanceRow + '\n';

    output += chalk.gray('└' + '─'.repeat(20) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┘') + '\n\n';

    // Insights
    if (data.insights && data.insights.length > 0) {
      output += ChartRenderer.renderSectionTitle('INSIGHTS', '💡') + '\n';

      data.insights.forEach(insight => {
        const icon = insight.severity === 'positive' ? '✅' : insight.severity === 'negative' ? '⚠️' : 'ℹ️';
        const color = insight.severity === 'positive' ? 'green' : insight.severity === 'negative' ? 'yellow' : 'cyan';

        output += `${icon} ${chalk[color](insight.message)}\n`;
      });

      output += '\n';
    }

    // Categorias com Maior Variação
    if (data.categoryComparison && data.categoryComparison.length > 0) {
      output += ChartRenderer.renderSectionTitle('CATEGORIAS COM MAIOR VARIAÇÃO', '📊') + '\n';

      data.categoryComparison.slice(0, 5).forEach(cat => {
        const icon = cat.icon || '📂';
        const name = cat.categoryName.padEnd(15);
        const diff = cat.difference;
        const diffFormatted = this._formatCurrency(Math.abs(diff)).padStart(12);
        const diffColored = diff >= 0 ? chalk.red(`+${diffFormatted}`) : chalk.green(`-${diffFormatted}`);
        const percentage = cat.variationPercent !== Infinity ? `(${cat.variationPercent >= 0 ? '+' : ''}${cat.variationPercent.toFixed(1)}%)` : '';

        output += `${icon} ${name} ${diffColored} ${chalk.dim(percentage)}\n`;
      });
    }

    return output;
  }

  /**
   * Renderiza Análise de Padrões
   */
  static renderPatternAnalysisReport(report) {
    const { data, summary, period } = report;
    let output = '';

    // Cabeçalho
    output += '\n' + createBox(
      `${icons.search} ${chalk.bold(report.getTitle())}\n${chalk.dim(period.label)}`,
      { borderColor: '#667eea', padding: 1 }
    ) + '\n\n';

    // Padrão por Dia da Semana
    if (data.dayOfWeekPattern && data.dayOfWeekPattern.data) {
      output += ChartRenderer.renderSectionTitle('GASTOS POR DIA DA SEMANA', '📅') + '\n';

      const maxExpense = Math.max(...data.dayOfWeekPattern.data.map(d => d.totalExpenses));

      data.dayOfWeekPattern.data.forEach(day => {
        const dayName = day.dayName.padEnd(5);
        const barLength = maxExpense > 0 ? Math.round((day.totalExpenses / maxExpense) * 25) : 0;
        const bar = '█'.repeat(barLength) + '░'.repeat(25 - barLength);
        const value = this._formatCurrency(day.totalExpenses).padStart(15);
        const count = chalk.dim(`(${day.transactionCount} transações)`);

        output += `${dayName} ${chalk.red(bar)} ${chalk.white(value)} ${count}\n`;
      });

      if (data.dayOfWeekPattern.maxExpenseDay) {
        output += chalk.dim(`\nDia com mais gastos: ${data.dayOfWeekPattern.maxExpenseDay.dayName}\n`);
      }

      output += '\n';
    }

    // Frequência por Categoria
    if (data.categoryFrequency && data.categoryFrequency.length > 0) {
      output += ChartRenderer.renderSectionTitle('CATEGORIAS MAIS FREQUENTES', '📊') + '\n';

      data.categoryFrequency.slice(0, 5).forEach((cat, index) => {
        const position = chalk.gray(`${index + 1}.`.padStart(3));
        const icon = cat.icon || '📂';
        const name = cat.categoryName.padEnd(15);
        const freq = `${cat.frequency}x`.padStart(6);
        const percentage = `${cat.frequencyPercent.toFixed(1)}%`.padStart(6);
        const avgTicket = this._formatCurrency(cat.averageTicket).padStart(15);

        output += `${position} ${icon} ${name} ${chalk.cyan(freq)} ${chalk.dim(percentage)} - Ticket: ${chalk.white(avgTicket)}\n`;
      });

      output += '\n';
    }

    // Análise de Ticket
    if (data.ticketAnalysis) {
      output += ChartRenderer.renderSectionTitle('ANÁLISE DE TICKET MÉDIO', '💳') + '\n';

      if (data.ticketAnalysis.expense) {
        const exp = data.ticketAnalysis.expense;
        output += chalk.red('Despesas:\n');
        output += `  Ticket Médio:   ${this._formatCurrency(exp.average)}\n`;
        output += `  Ticket Mínimo:  ${this._formatCurrency(exp.min)}\n`;
        output += `  Ticket Máximo:  ${this._formatCurrency(exp.max)}\n`;
        output += `  Mediana:        ${this._formatCurrency(exp.median)}\n\n`;
      }

      if (data.ticketAnalysis.income) {
        const inc = data.ticketAnalysis.income;
        output += chalk.green('Receitas:\n');
        output += `  Ticket Médio:   ${this._formatCurrency(inc.average)}\n`;
        output += `  Ticket Mínimo:  ${this._formatCurrency(inc.min)}\n`;
        output += `  Ticket Máximo:  ${this._formatCurrency(inc.max)}\n`;
        output += `  Mediana:        ${this._formatCurrency(inc.median)}\n\n`;
      }
    }

    // Padrão Temporal
    if (data.timePattern) {
      output += ChartRenderer.renderSectionTitle('PADRÃO TEMPORAL DO MÊS', '⏰') + '\n';

      const periods = ['início', 'meio', 'fim'];
      periods.forEach(periodName => {
        const periodData = data.timePattern[periodName];
        if (periodData) {
          const label = periodName.charAt(0).toUpperCase() + periodName.slice(1);
          const expense = this._formatCurrency(periodData.expense).padStart(15);
          const count = periodData.expenseCount;

          output += `${label.padEnd(8)} ${chalk.red(expense)} ${chalk.dim(`(${count} transações)`)}\n`;
        }
      });

      output += '\n';
    }

    // Resumo de Atividade
    output += ChartRenderer.renderSectionTitle('RESUMO DE ATIVIDADE', '📈') + '\n';
    output += `Taxa de Atividade: ${chalk.cyan(summary.activityRate.toFixed(1) + '%')} ${chalk.dim(`(${summary.activeDays} de ${summary.totalDays} dias)`)}\n`;
    output += `Média de Transações/Dia: ${chalk.cyan(summary.averageTransactionsPerDay.toFixed(1))}\n`;
    output += `Total de Transações: ${chalk.cyan(summary.totalTransactions)}\n`;

    return output;
  }

  /**
   * Constrói uma linha de comparação para tabela
   * @private
   */
  static _buildComparisonRow(label, value1, value2, diff, color = 'white') {
    const labelPadded = label.padEnd(18);
    const val1 = this._formatCurrency(Math.abs(value1)).padStart(13);
    const val2 = this._formatCurrency(Math.abs(value2)).padStart(13);
    const diffAbs = Math.abs(diff);
    const diffFormatted = this._formatCurrency(diffAbs).padStart(13);
    const sign = diff >= 0 ? '+' : '-';

    return chalk.gray('│ ') + chalk.white(labelPadded) + chalk.gray(' │ ') +
           val1 + chalk.gray(' │ ') +
           val2 + chalk.gray(' │ ') +
           chalk[color](`${sign}${diffFormatted}`) + chalk.gray(' │');
  }

  /**
   * Formata valor monetário
   * @private
   */
  static _formatCurrency(value) {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }

    const absValue = Math.abs(value);
    const formatted = absValue.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }
}
