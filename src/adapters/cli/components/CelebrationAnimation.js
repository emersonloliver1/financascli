import chalk from 'chalk';
import boxen from 'boxen';
import { GoalProgressBar } from './GoalProgressBar.js';

/**
 * Componente: Animação de celebração ao atingir meta
 */
export class CelebrationAnimation {
  /**
   * Exibe animação de celebração ao atingir uma meta
   * @param {Object} goalData - Dados da meta concluída
   * @param {Object} contribution - Dados da contribuição que completou a meta
   */
  static async show(goalData, contribution = null) {
    // Limpar tela
    console.clear();

    // Frame 1: Fogos de artifício
    this.showFireworks();

    await this.sleep(800);

    // Frame 2: Mensagem de parabéns
    console.clear();
    this.showCongratulations(goalData, contribution);

    await this.sleep(1500);

    // Frame 3: Estatísticas
    console.clear();
    this.showStats(goalData);
  }

  /**
   * Mostra fogos de artifício ASCII
   */
  static showFireworks() {
    const fireworks = `
    ${chalk.yellow('        ✨     ✨     ✨')}
    ${chalk.cyan('      ✨  🎊  ✨  🎊  ✨')}
    ${chalk.magenta('    ✨  🎊  🎊  🎊  🎊  ✨')}
    ${chalk.blue('  ✨  🎊  🎊  🎊  🎊  🎊  ✨')}
    ${chalk.green('    ✨  🎊  🎊  🎊  🎊  ✨')}
    ${chalk.yellow('      ✨  🎊  ✨  🎊  ✨')}
    ${chalk.cyan('        ✨     ✨     ✨')}
    `;

    const boxContent = boxen(fireworks, {
      padding: 2,
      margin: 2,
      borderStyle: 'double',
      borderColor: 'yellow',
      backgroundColor: 'black'
    });

    console.log(boxContent);
  }

  /**
   * Mostra mensagem de parabéns
   * @param {Object} goalData - Dados da meta
   * @param {Object} contribution - Dados da contribuição
   */
  static showCongratulations(goalData, contribution) {
    const lines = [];

    lines.push(chalk.greenBright.bold('🎉 PARABÉNS! 🎉'));
    lines.push('');
    lines.push(chalk.white.bold(`Você atingiu sua meta: ${goalData.name}!`));
    lines.push('');

    if (contribution) {
      const amountFormatted = GoalProgressBar.formatCurrency(contribution.amount);
      lines.push(chalk.gray(`Última contribuição: ${amountFormatted}`));
      lines.push('');
    }

    const targetFormatted = GoalProgressBar.formatCurrency(goalData.target_amount);
    lines.push(chalk.green(`✅ Valor objetivo atingido: ${targetFormatted}`));

    const message = lines.join('\n');

    const boxContent = boxen(message, {
      padding: 2,
      margin: 2,
      borderStyle: 'double',
      borderColor: 'green',
      backgroundColor: 'black',
      textAlignment: 'center'
    });

    console.log(boxContent);
  }

  /**
   * Mostra estatísticas da meta concluída
   * @param {Object} goalData - Dados da meta
   */
  static showStats(goalData) {
    const lines = [];

    lines.push(chalk.cyan.bold('📊 ESTATÍSTICAS DA META'));
    lines.push('');

    // Valor objetivo
    const targetFormatted = GoalProgressBar.formatCurrency(goalData.target_amount);
    lines.push(`${chalk.white('→ Valor objetivo:')} ${chalk.green.bold(targetFormatted)}`);

    // Tempo levado
    if (goalData.created_at) {
      const createdDate = new Date(goalData.created_at);
      const completedDate = new Date(goalData.completed_at || new Date());
      const diffTime = Math.abs(completedDate - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;

      let timeText = '';
      if (months > 0) {
        timeText = `${months} ${months === 1 ? 'mês' : 'meses'}`;
        if (days > 0) timeText += ` e ${days} dias`;
      } else {
        timeText = `${days} dias`;
      }

      lines.push(`${chalk.white('→ Tempo levado:')} ${chalk.cyan(timeText)}`);
    }

    // Número de contribuições
    if (goalData.contribution_count > 0) {
      lines.push(`${chalk.white('→ Contribuições:')} ${chalk.cyan(goalData.contribution_count + ' depósitos')}`);
    }

    // Média mensal
    if (goalData.avg_monthly_contribution && goalData.avg_monthly_contribution > 0) {
      const avgFormatted = GoalProgressBar.formatCurrency(
        parseFloat(goalData.avg_monthly_contribution)
      );
      lines.push(`${chalk.white('→ Média mensal:')} ${chalk.cyan(avgFormatted)}`);
    }

    // Total contribuído
    if (goalData.total_contributed) {
      const totalFormatted = GoalProgressBar.formatCurrency(goalData.total_contributed);
      lines.push(`${chalk.white('→ Total contribuído:')} ${chalk.green(totalFormatted)}`);
    }

    lines.push('');
    lines.push(chalk.yellow('✨ Continue assim e alcance seus próximos objetivos!'));

    const message = lines.join('\n');

    const boxContent = boxen(message, {
      padding: 2,
      margin: 2,
      borderStyle: 'round',
      borderColor: 'cyan'
    });

    console.log(boxContent);
  }

  /**
   * Mostra sugestão de próxima meta
   * @param {Object} nextGoal - Próxima meta sugerida
   */
  static showNextGoalSuggestion(nextGoal) {
    if (!nextGoal) return;

    const lines = [];

    lines.push(chalk.yellow.bold('🎯 Próxima meta sugerida:'));
    lines.push('');

    const progressBar = GoalProgressBar.renderMini(nextGoal.progress.percentage);
    lines.push(`   ${nextGoal.icon} ${chalk.bold(nextGoal.name)}`);
    lines.push(`   ${progressBar}`);

    console.log('\n' + lines.join('\n') + '\n');
  }

  /**
   * Helper: sleep
   * @param {number} ms - Milissegundos
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exibe celebração simplificada (sem animação)
   * @param {Object} goalData - Dados da meta
   */
  static showSimple(goalData) {
    const lines = [];

    lines.push('');
    lines.push(chalk.greenBright.bold('🎉 PARABÉNS! Meta atingida! 🎉'));
    lines.push('');
    lines.push(chalk.white.bold(goalData.name));
    lines.push('');

    const targetFormatted = GoalProgressBar.formatCurrency(goalData.target_amount);
    lines.push(chalk.green(`✅ Valor: ${targetFormatted}`));
    lines.push('');

    console.log(lines.join('\n'));
  }
}

export default CelebrationAnimation;
