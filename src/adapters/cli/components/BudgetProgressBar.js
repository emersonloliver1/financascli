import chalk from 'chalk';

/**
 * Componente: Barra de progresso de orçamento
 */
export class BudgetProgressBar {
  /**
   * Renderiza uma barra de progresso colorida
   * @param {number} spent - Valor gasto
   * @param {number} limit - Valor limite
   * @param {number} width - Largura da barra em caracteres (default: 30)
   * @returns {string}
   */
  static render(spent, limit, width = 30) {
    const percentage = (spent / limit) * 100;
    const filled = Math.min(Math.round((percentage / 100) * width), width);

    // Determinar cor baseada no percentual
    let color;
    let icon;

    if (percentage >= 100) {
      color = 'red';        // 🔴 Vermelho - Excedido
      icon = '🔴';
    } else if (percentage >= 80) {
      color = 'yellow';     // 🟠 Laranja - Atenção
      icon = '⚠️';
    } else if (percentage >= 50) {
      color = 'yellow';     // 🟡 Amarelo - Alerta
      icon = '🟡';
    } else {
      color = 'green';      // 🟢 Verde - OK
      icon = '✅';
    }

    // Construir barra
    const bar = chalk[color]('█'.repeat(filled)) +
                chalk.gray('░'.repeat(Math.max(0, width - filled)));

    // Formatar percentual
    const pctText = percentage > 999 ? '999+%' : `${percentage.toFixed(1)}%`;

    return `${bar} ${pctText} ${icon}`;
  }

  /**
   * Renderiza barra de progresso com informações detalhadas
   * @param {Object} budget - Entidade Budget com dados de uso
   * @param {number} width - Largura da barra
   * @returns {string}
   */
  static renderDetailed(budget, width = 30) {
    const usage = budget.usage || budget.calculateUsage();
    const bar = this.render(usage.spent, usage.limit, width);

    // Formatar valores
    const spent = budget.getFormattedAmount(usage.spent);
    const limit = budget.getFormattedAmount(usage.limit);
    const remaining = budget.getFormattedAmount(usage.remaining);

    // Construir linha
    let line = `${bar}  ${spent} / ${limit}`;

    // Adicionar valor restante ou excedido
    if (usage.exceeded) {
      const excess = budget.getFormattedAmount(Math.abs(usage.remaining));
      line += chalk.red(` (excedido em ${excess})`);
    } else {
      line += chalk.gray(` (restam ${remaining})`);
    }

    return line;
  }

  /**
   * Renderiza mini barra de progresso (mais compacta)
   * @param {number} percentage - Percentual usado
   * @param {number} width - Largura da barra (default: 20)
   * @returns {string}
   */
  static renderMini(percentage, width = 20) {
    const filled = Math.min(Math.round((percentage / 100) * width), width);

    // Determinar cor
    let color;
    if (percentage >= 100) color = 'red';
    else if (percentage >= 80) color = 'yellow';
    else if (percentage >= 50) color = 'yellow';
    else color = 'green';

    // Construir barra mini
    const bar = chalk[color]('▓'.repeat(filled)) +
                chalk.gray('░'.repeat(Math.max(0, width - filled)));

    const pctText = `${Math.min(percentage, 999).toFixed(0)}%`;

    return `${bar} ${pctText}`;
  }

  /**
   * Retorna apenas o ícone de status baseado no percentual
   * @param {number} percentage
   * @returns {string}
   */
  static getStatusIcon(percentage) {
    if (percentage >= 100) return '🔴';
    if (percentage >= 80) return '⚠️';
    if (percentage >= 50) return '🟡';
    return '✅';
  }

  /**
   * Retorna texto de status baseado no percentual
   * @param {number} percentage
   * @returns {string}
   */
  static getStatusText(percentage) {
    if (percentage >= 100) return chalk.red.bold('EXCEDIDO');
    if (percentage >= 80) return chalk.yellow.bold('ATENÇÃO');
    if (percentage >= 50) return chalk.yellow('ALERTA');
    return chalk.green('OK');
  }
}

export default BudgetProgressBar;
