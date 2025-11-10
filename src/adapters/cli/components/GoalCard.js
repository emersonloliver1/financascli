import chalk from 'chalk';
import boxen from 'boxen';
import { GoalProgressBar } from './GoalProgressBar.js';

/**
 * Componente: Card de exibição de meta financeira
 */
export class GoalCard {
  /**
   * Renderiza um card completo de meta
   * @param {Object} goalData - Dados da meta com informações calculadas
   * @returns {string}
   */
  static render(goalData) {
    const lines = [];

    // Título com ícone
    const title = `${goalData.icon} ${chalk.bold.white(goalData.name)}`;
    lines.push(title);
    lines.push('');

    // Barra de progresso
    const progressBar = GoalProgressBar.renderDetailed(
      goalData.current_amount,
      goalData.target_amount,
      35
    );
    lines.push(progressBar);

    // Status
    const statusText = GoalProgressBar.getStatusText(
      goalData.progress.percentage,
      !!goalData.deadline,
      goalData.daysRemaining?.isOverdue
    );
    lines.push(`   ${statusText}`);
    lines.push('');

    // Informações de prazo
    if (goalData.deadline) {
      const deadlineInfo = GoalProgressBar.renderDeadlineInfo(
        new Date(goalData.deadline),
        goalData.daysRemaining?.days || 0
      );
      lines.push(`   ${deadlineInfo}`);
    }

    // Informações de previsão
    if (goalData.estimate) {
      const estimateInfo = GoalProgressBar.renderEstimateInfo(goalData.estimate);
      lines.push(`   ${estimateInfo}`);
    }

    // Média mensal
    if (goalData.avg_monthly_contribution && goalData.avg_monthly_contribution > 0) {
      const avgFormatted = GoalProgressBar.formatCurrency(
        parseFloat(goalData.avg_monthly_contribution)
      );
      lines.push(`   ${chalk.gray(`💰 Média mensal: ${avgFormatted}`)}`);
    } else if (goalData.monthly_contribution && goalData.monthly_contribution > 0) {
      const monthlyFormatted = GoalProgressBar.formatCurrency(
        parseFloat(goalData.monthly_contribution)
      );
      lines.push(`   ${chalk.gray(`💰 Meta mensal: ${monthlyFormatted}`)}`);
    }

    return lines.join('\n');
  }

  /**
   * Renderiza um card compacto de meta
   * @param {Object} goalData - Dados da meta
   * @returns {string}
   */
  static renderCompact(goalData) {
    const icon = goalData.icon || '🎯';
    const name = goalData.name.length > 25
      ? goalData.name.substring(0, 22) + '...'
      : goalData.name;

    const progressBar = GoalProgressBar.render(
      goalData.current_amount,
      goalData.target_amount,
      20
    );

    const currentFormatted = GoalProgressBar.formatCurrency(goalData.current_amount);
    const targetFormatted = GoalProgressBar.formatCurrency(goalData.target_amount);

    return `${icon} ${chalk.bold(name)}\n   ${progressBar}  ${currentFormatted} / ${targetFormatted}`;
  }

  /**
   * Renderiza uma lista de metas
   * @param {Array} goals - Array de metas
   * @param {boolean} compact - Se deve usar formato compacto
   * @returns {string}
   */
  static renderList(goals, compact = false) {
    if (goals.length === 0) {
      return chalk.yellow('\n   Nenhuma meta encontrada. Crie sua primeira meta!\n');
    }

    const cards = goals.map((goal, index) => {
      const card = compact ? this.renderCompact(goal) : this.render(goal);

      // Adicionar separador entre cards
      if (index < goals.length - 1) {
        return card + '\n' + chalk.gray('─'.repeat(60)) + '\n';
      }

      return card;
    });

    return '\n' + cards.join('\n') + '\n';
  }

  /**
   * Renderiza resumo de meta concluída
   * @param {Object} goalData - Dados da meta concluída
   * @returns {string}
   */
  static renderCompletedSummary(goalData) {
    const lines = [];

    lines.push(chalk.greenBright.bold(`✅ ${goalData.name}`));
    lines.push('');

    // Valor atingido
    const amountFormatted = GoalProgressBar.formatCurrency(goalData.target_amount);
    lines.push(chalk.green(`💰 Valor objetivo: ${amountFormatted}`));

    // Data de conclusão
    if (goalData.completed_at) {
      const completedDate = new Date(goalData.completed_at).toLocaleDateString('pt-BR');
      lines.push(chalk.gray(`📅 Concluída em: ${completedDate}`));
    }

    // Tempo levado
    if (goalData.days_to_complete) {
      const months = Math.floor(goalData.days_to_complete / 30);
      const days = goalData.days_to_complete % 30;

      let timeText = '⏱️ Tempo: ';
      if (months > 0) {
        timeText += `${months} ${months === 1 ? 'mês' : 'meses'}`;
        if (days > 0) timeText += ` e ${days} dias`;
      } else {
        timeText += `${days} dias`;
      }

      lines.push(chalk.gray(timeText));
    }

    // Número de contribuições
    if (goalData.contribution_count) {
      lines.push(chalk.gray(`📊 Contribuições: ${goalData.contribution_count}`));
    }

    return lines.join('\n');
  }

  /**
   * Renderiza card em um box decorado
   * @param {Object} goalData - Dados da meta
   * @param {Object} options - Opções do box
   * @returns {string}
   */
  static renderBoxed(goalData, options = {}) {
    const content = this.render(goalData);

    const boxOptions = {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: goalData.color || 'cyan',
      ...options
    };

    return boxen(content, boxOptions);
  }
}

export default GoalCard;
