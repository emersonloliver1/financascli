import chalk from 'chalk';

/**
 * Componente: Barra de progresso de meta financeira
 */
export class GoalProgressBar {
  /**
   * Renderiza uma barra de progresso colorida para meta
   * @param {number} current - Valor atual
   * @param {number} target - Valor objetivo
   * @param {number} width - Largura da barra em caracteres (default: 30)
   * @returns {string}
   */
  static render(current, target, width = 30) {
    const percentage = (current / target) * 100;
    const filled = Math.min(Math.round((percentage / 100) * width), width);

    // Determinar cor baseada no percentual (diferente de budget - verde é bom!)
    let color;
    let icon;

    if (percentage >= 100) {
      color = 'greenBright';  // ✅ Verde brilhante - Concluído!
      icon = '✅';
    } else if (percentage >= 80) {
      color = 'yellow';       // 🟠 Amarelo - Quase lá!
      icon = '🔥';
    } else if (percentage >= 50) {
      color = 'cyan';         // 🟡 Ciano - No caminho certo
      icon = '📈';
    } else if (percentage >= 25) {
      color = 'blue';         // 🔵 Azul - Começando
      icon = '💪';
    } else {
      color = 'gray';         // ⚪ Cinza - Início
      icon = '🎯';
    }

    // Construir barra
    const bar = chalk[color]('█'.repeat(filled)) +
                chalk.gray('░'.repeat(Math.max(0, width - filled)));

    // Formatar percentual
    const pctText = percentage > 999 ? '999+%' : `${percentage.toFixed(1)}%`;

    return `${bar} ${pctText} ${icon}`;
  }

  /**
   * Renderiza barra com informações detalhadas
   * @param {number} current - Valor atual
   * @param {number} target - Valor objetivo
   * @param {number} width - Largura da barra
   * @returns {string}
   */
  static renderDetailed(current, target, width = 30) {
    const percentage = (current / target) * 100;
    const bar = this.render(current, target, width);
    const remaining = Math.max(target - current, 0);

    // Formatar valores
    const currentFormatted = this.formatCurrency(current);
    const targetFormatted = this.formatCurrency(target);
    const remainingFormatted = this.formatCurrency(remaining);

    // Construir linha
    let line = `${bar}  ${currentFormatted} / ${targetFormatted}`;

    // Adicionar informação extra
    if (percentage >= 100) {
      line += chalk.greenBright(' ✨ Meta atingida!');
    } else {
      line += chalk.gray(` • Faltam ${remainingFormatted}`);
    }

    return line;
  }

  /**
   * Renderiza mini barra de progresso (mais compacta)
   * @param {number} percentage - Percentual concluído
   * @param {number} width - Largura da barra (default: 20)
   * @returns {string}
   */
  static renderMini(percentage, width = 20) {
    const filled = Math.min(Math.round((percentage / 100) * width), width);

    // Determinar cor
    let color;
    if (percentage >= 100) color = 'greenBright';
    else if (percentage >= 80) color = 'yellow';
    else if (percentage >= 50) color = 'cyan';
    else if (percentage >= 25) color = 'blue';
    else color = 'gray';

    // Construir barra mini
    const bar = chalk[color]('▓'.repeat(filled)) +
                chalk.gray('░'.repeat(Math.max(0, width - filled)));

    const pctText = `${Math.min(percentage, 999).toFixed(0)}%`;

    return `${bar} ${pctText}`;
  }

  /**
   * Retorna o ícone de status baseado no percentual
   * @param {number} percentage
   * @returns {string}
   */
  static getStatusIcon(percentage) {
    if (percentage >= 100) return '✅';
    if (percentage >= 80) return '🔥';
    if (percentage >= 50) return '📈';
    if (percentage >= 25) return '💪';
    return '🎯';
  }

  /**
   * Retorna texto de status baseado no percentual
   * @param {number} percentage
   * @param {boolean} hasDeadline - Se tem prazo definido
   * @param {boolean} isOverdue - Se está atrasado
   * @returns {string}
   */
  static getStatusText(percentage, hasDeadline = false, isOverdue = false) {
    if (percentage >= 100) {
      return chalk.greenBright.bold('✨ CONCLUÍDA!');
    }

    if (isOverdue) {
      return chalk.red.bold('⚠️ PRAZO VENCIDO');
    }

    if (percentage >= 80) {
      return chalk.yellow.bold('🔥 QUASE LÁ!');
    }

    if (percentage >= 50) {
      return chalk.cyan('📈 BOM PROGRESSO');
    }

    if (percentage >= 25) {
      return chalk.blue('💪 CAMINHANDO');
    }

    return chalk.gray('🎯 INICIANDO');
  }

  /**
   * Formata valor monetário
   * @param {number} value
   * @returns {string}
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Renderiza linha de informação de prazo
   * @param {Date} deadline - Data do prazo
   * @param {number} daysRemaining - Dias restantes
   * @returns {string}
   */
  static renderDeadlineInfo(deadline, daysRemaining) {
    if (!deadline) {
      return chalk.gray('📅 Sem prazo definido');
    }

    const dateFormatted = deadline.toLocaleDateString('pt-BR');

    if (daysRemaining < 0) {
      const daysOverdue = Math.abs(daysRemaining);
      return chalk.red(`⚠️ Prazo vencido há ${daysOverdue} dia(s) (${dateFormatted})`);
    }

    if (daysRemaining === 0) {
      return chalk.yellow.bold(`⏰ Prazo HOJE! (${dateFormatted})`);
    }

    if (daysRemaining <= 7) {
      return chalk.yellow(`⏰ Prazo em ${daysRemaining} dia(s) (${dateFormatted})`);
    }

    if (daysRemaining <= 30) {
      return chalk.cyan(`📅 Prazo em ${daysRemaining} dia(s) (${dateFormatted})`);
    }

    return chalk.gray(`📅 Prazo: ${dateFormatted} (${daysRemaining} dias)`);
  }

  /**
   * Renderiza informação de previsão de conclusão
   * @param {Object} estimate - Objeto de estimativa
   * @param {Date} estimate.date - Data estimada
   * @param {number} estimate.monthsNeeded - Meses necessários
   * @param {boolean} estimate.isOnTrack - Se está no prazo
   * @returns {string}
   */
  static renderEstimateInfo(estimate) {
    if (!estimate) {
      return chalk.gray('📊 Defina uma contribuição mensal para ver a previsão');
    }

    const dateFormatted = estimate.date.toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    });

    const monthsText = estimate.monthsNeeded === 1
      ? '1 mês'
      : `${estimate.monthsNeeded} meses`;

    if (estimate.isOnTrack) {
      return chalk.green(`📈 Previsão: Concluir em ${dateFormatted} (${monthsText}) ✓`);
    } else {
      return chalk.red(`📈 Previsão: Concluir em ${dateFormatted} (${monthsText}) ⚠️ atrasado`);
    }
  }
}

export default GoalProgressBar;
