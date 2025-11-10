/**
 * Export Screen
 *
 * Tela de exportação de dados
 * Parte da Adapters Layer (CLI)
 *
 * @class ExportScreen
 */
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ExportScreen {
  /**
   * Inicializa a tela de exportação
   *
   * @param {Object} exportUseCases - Use cases de exportação
   * @param {ExportTransactionsToPDFUseCase} exportUseCases.transactions
   * @param {ExportReportToPDFUseCase} exportUseCases.report
   */
  constructor(exportUseCases) {
    this.exportTransactionsUseCase = exportUseCases.transactions;
    this.exportReportUseCase = exportUseCases.report;
  }

  /**
   * Exibe o menu principal de exportação
   *
   * @param {Object} user - Usuário logado
   */
  async show(user) {
    console.clear();
    this.showHeader();

    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'O que deseja exportar?',
          choices: [
            {
              name: `${chalk.cyan('📄')} Exportar Transações`,
              value: 'transactions'
            },
            {
              name: `${chalk.green('📊')} Exportar Relatório`,
              value: 'report'
            },
            new inquirer.Separator(),
            {
              name: `${chalk.gray('⬅️  Voltar')}`,
              value: 'back'
            }
          ]
        }
      ]);

      if (action === 'back') {
        return;
      }

      if (action === 'transactions') {
        await this.exportTransactions(user);
      } else if (action === 'report') {
        await this.exportReport(user);
      }

      // Aguardar antes de mostrar menu novamente
      await this.waitForContinue();
      console.clear();
      this.showHeader();
    }
  }

  /**
   * Exporta transações para PDF
   *
   * @param {Object} user - Usuário logado
   */
  async exportTransactions(user) {
    console.clear();
    this.showHeader();

    console.log(chalk.cyan.bold('\n📄 Exportar Transações\n'));

    // 1. Selecionar período
    const { period } = await inquirer.prompt([
      {
        type: 'list',
        name: 'period',
        message: 'Selecione o período:',
        choices: [
          { name: 'Mês Atual', value: 'current-month' },
          { name: 'Mês Anterior', value: 'last-month' },
          { name: 'Últimos 3 Meses', value: 'last-3-months' },
          { name: 'Últimos 6 Meses', value: 'last-6-months' },
          { name: 'Ano Atual', value: 'current-year' },
          { name: 'Personalizado', value: 'custom' }
        ]
      }
    ]);

    let filters = { period };

    // Se personalizado, perguntar datas
    if (period === 'custom') {
      const dates = await inquirer.prompt([
        {
          type: 'input',
          name: 'startDate',
          message: 'Data inicial (DD/MM/AAAA):',
          validate: (input) => {
            return this.isValidDate(input) || 'Data inválida. Use DD/MM/AAAA';
          }
        },
        {
          type: 'input',
          name: 'endDate',
          message: 'Data final (DD/MM/AAAA):',
          validate: (input) => {
            return this.isValidDate(input) || 'Data inválida. Use DD/MM/AAAA';
          }
        }
      ]);

      filters = {
        startDate: this.parseDate(dates.startDate),
        endDate: this.parseDate(dates.endDate)
      };
    }

    // 2. Filtrar por tipo
    const { typeFilter } = await inquirer.prompt([
      {
        type: 'list',
        name: 'typeFilter',
        message: 'Filtrar por tipo:',
        choices: [
          { name: 'Todas as Transações', value: 'all' },
          { name: 'Apenas Receitas', value: 'income' },
          { name: 'Apenas Despesas', value: 'expense' }
        ]
      }
    ]);

    if (typeFilter !== 'all') {
      filters.type = typeFilter;
    }

    // 3. Confirmar exportação
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Confirma a exportação?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('\n⚠️  Exportação cancelada.\n'));
      return;
    }

    // 4. Gerar PDF
    const spinner = ora('Gerando PDF...').start();

    try {
      const result = await this.exportTransactionsUseCase.execute(
        user.id,
        filters,
        { includeSummary: true }
      );

      spinner.succeed(chalk.green('PDF gerado com sucesso!'));

      // Mostrar informações
      console.log(chalk.gray('\n─────────────────────────────────────'));
      console.log(chalk.white(`📁 Arquivo: ${chalk.cyan(result.filename)}`));
      console.log(chalk.white(`📂 Local: ${chalk.cyan(result.filepath)}`));
      console.log(chalk.white(`📄 Páginas: ${chalk.cyan(result.pages)}`));
      console.log(chalk.white(`📊 Transações: ${chalk.cyan(result.transactionCount)}`));
      console.log(chalk.white(`💾 Tamanho: ${chalk.cyan(this.formatFileSize(result.size))}`));
      console.log(chalk.gray('─────────────────────────────────────\n'));

      // Mostrar resumo
      if (result.summary) {
        this.showSummary(result.summary);
      }

      // Perguntar se quer abrir o PDF
      const { openFile } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openFile',
          message: 'Deseja abrir o PDF agora?',
          default: true
        }
      ]);

      if (openFile) {
        await this.openPDF(result.filepath);
      }
    } catch (error) {
      spinner.fail(chalk.red('Erro ao gerar PDF'));
      console.log(chalk.red(`\n❌ ${error.message}\n`));
    }
  }

  /**
   * Exporta relatório para PDF
   *
   * @param {Object} user - Usuário logado
   */
  async exportReport(user) {
    console.clear();
    this.showHeader();

    console.log(chalk.cyan.bold('\n📊 Exportar Relatório\n'));

    // 1. Selecionar tipo de relatório
    const { reportType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'reportType',
        message: 'Selecione o tipo de relatório:',
        choices: [
          { name: '📅 Relatório Mensal', value: 'monthly' },
          { name: '📂 Relatório por Categoria', value: 'category' },
          { name: '📈 Relatório de Evolução', value: 'evolution' },
          { name: '🏆 Maiores Transações', value: 'top' },
          { name: '⚖️  Relatório Comparativo', value: 'comparative' },
          { name: '🔍 Análise de Padrões', value: 'patterns' }
        ]
      }
    ]);

    // 2. Opções específicas do relatório
    const options = await this.getReportOptions(reportType);

    // 3. Confirmar exportação
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Confirma a exportação?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('\n⚠️  Exportação cancelada.\n'));
      return;
    }

    // 4. Gerar PDF
    const spinner = ora('Gerando relatório PDF...').start();

    try {
      const result = await this.exportReportUseCase.execute(
        user.id,
        reportType,
        options
      );

      spinner.succeed(chalk.green('Relatório PDF gerado com sucesso!'));

      // Mostrar informações
      console.log(chalk.gray('\n─────────────────────────────────────'));
      console.log(chalk.white(`📁 Arquivo: ${chalk.cyan(result.filename)}`));
      console.log(chalk.white(`📂 Local: ${chalk.cyan(result.filepath)}`));
      console.log(chalk.white(`📄 Páginas: ${chalk.cyan(result.pages)}`));
      console.log(chalk.white(`💾 Tamanho: ${chalk.cyan(this.formatFileSize(result.size))}`));
      console.log(chalk.gray('─────────────────────────────────────\n'));

      // Perguntar se quer abrir o PDF
      const { openFile } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openFile',
          message: 'Deseja abrir o PDF agora?',
          default: true
        }
      ]);

      if (openFile) {
        await this.openPDF(result.filepath);
      }
    } catch (error) {
      spinner.fail(chalk.red('Erro ao gerar relatório PDF'));
      console.log(chalk.red(`\n❌ ${error.message}\n`));
    }
  }

  /**
   * Obtém opções específicas do relatório
   *
   * @param {string} reportType - Tipo do relatório
   * @returns {Promise<Object>} Opções do relatório
   */
  async getReportOptions(reportType) {
    const options = {};

    switch (reportType) {
    case 'monthly': {
      const { month } = await inquirer.prompt([
        {
          type: 'input',
          name: 'month',
          message: 'Mês (MM/AAAA ou deixe vazio para mês atual):',
          validate: (input) => {
            if (!input) return true;
            return this.isValidMonth(input) || 'Mês inválido. Use MM/AAAA';
          }
        }
      ]);

      if (month) {
        options.month = this.parseMonth(month);
      }
      break;
    }
    case 'evolution': {
      const { months } = await inquirer.prompt([
        {
          type: 'input',
          name: 'months',
          message: 'Quantos meses analisar? (padrão: 6)',
          default: '6',
          validate: (input) => {
            const num = parseInt(input);
            return (num > 0 && num <= 24) || 'Digite um número entre 1 e 24';
          }
        }
      ]);

      options.months = parseInt(months);
      break;
    }
    case 'top': {
      const { limit } = await inquirer.prompt([
        {
          type: 'input',
          name: 'limit',
          message: 'Quantas transações mostrar? (padrão: 10)',
          default: '10',
          validate: (input) => {
            const num = parseInt(input);
            return (num > 0 && num <= 50) || 'Digite um número entre 1 e 50';
          }
        }
      ]);

      options.limit = parseInt(limit);
      break;
    }
    }

    return options;
  }

  /**
   * Mostra resumo financeiro
   *
   * @param {Object} summary - Resumo financeiro
   */
  showSummary(summary) {
    console.log(chalk.white.bold('💰 Resumo Financeiro:\n'));

    console.log(
      chalk.green(`   Receitas:  R$ ${this.formatMoney(summary.totalIncome)} `) +
      chalk.gray(`(${summary.incomeCount || 0} transações)`)
    );

    console.log(
      chalk.red(`   Despesas:  R$ ${this.formatMoney(summary.totalExpense)} `) +
      chalk.gray(`(${summary.expenseCount || 0} transações)`)
    );

    const balanceColor = summary.balance >= 0 ? chalk.green : chalk.red;
    console.log(
      balanceColor(`   Saldo:     R$ ${this.formatMoney(Math.abs(summary.balance))}`)
    );

    console.log(chalk.gray(`   Total:     ${summary.count} transações\n`));
  }

  /**
   * Abre o PDF no visualizador padrão
   *
   * @param {string} filepath - Caminho do arquivo
   */
  async openPDF(filepath) {
    const spinner = ora('Abrindo PDF...').start();

    try {
      const platform = process.platform;

      let command;
      if (platform === 'darwin') {
        command = `open "${filepath}"`;
      } else if (platform === 'win32') {
        command = `start "" "${filepath}"`;
      } else {
        command = `xdg-open "${filepath}"`;
      }

      await execAsync(command);
      spinner.succeed(chalk.green('PDF aberto!'));
    } catch (error) {
      spinner.fail(chalk.yellow('Não foi possível abrir o PDF automaticamente'));
      console.log(chalk.gray(`\nAbra manualmente: ${filepath}\n`));
    }
  }

  /**
   * Mostra cabeçalho da tela
   */
  showHeader() {
    console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║     📤  EXPORTAÇÃO DE DADOS  📤      ║'));
    console.log(chalk.cyan.bold('╚═══════════════════════════════════════╝\n'));
  }

  /**
   * Aguarda usuário pressionar ENTER
   */
  async waitForContinue() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Pressione ENTER para continuar...'
      }
    ]);
  }

  /**
   * Valida data no formato DD/MM/AAAA
   *
   * @param {string} dateStr - String da data
   * @returns {boolean} True se válida
   */
  isValidDate(dateStr) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);

    if (!match) return false;

    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === parseInt(year) &&
      date.getMonth() === parseInt(month) - 1 &&
      date.getDate() === parseInt(day)
    );
  }

  /**
   * Valida mês no formato MM/AAAA
   *
   * @param {string} monthStr - String do mês
   * @returns {boolean} True se válido
   */
  isValidMonth(monthStr) {
    const regex = /^(\d{2})\/(\d{4})$/;
    const match = monthStr.match(regex);

    if (!match) return false;

    const [, month, year] = match;
    return parseInt(month) >= 1 && parseInt(month) <= 12;
  }

  /**
   * Converte string DD/MM/AAAA para Date
   *
   * @param {string} dateStr - String da data
   * @returns {Date} Data
   */
  parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
  }

  /**
   * Converte string MM/AAAA para YYYY-MM
   *
   * @param {string} monthStr - String do mês
   * @returns {string} Mês no formato YYYY-MM
   */
  parseMonth(monthStr) {
    const [month, year] = monthStr.split('/');
    return `${year}-${month}`;
  }

  /**
   * Formata valor monetário
   *
   * @param {number} value - Valor
   * @returns {string} Valor formatado
   */
  formatMoney(value) {
    return parseFloat(value || 0)
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Formata tamanho de arquivo
   *
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  formatFileSize(bytes) {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  }
}
