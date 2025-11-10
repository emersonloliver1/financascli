import chalk from 'chalk';
import { BudgetProgressBar } from './BudgetProgressBar.js';
import { createBox, createSeparator } from '../utils/banner.js';
import { colors, styles } from '../utils/colors.js';

/**
 * Componente: Lista de orçamentos
 */
export class BudgetList {
  /**
   * Renderiza lista de orçamentos
   * @param {Array} budgets - Array de entidades Budget enriquecidas
   * @param {Object} options - {showDetails?: boolean, compact?: boolean}
   */
  static render(budgets, options = {}) {
    if (!budgets || budgets.length === 0) {
      console.log(chalk.gray('\n  Nenhum orçamento encontrado.\n'));
      return;
    }

    const showDetails = options.showDetails !== false;
    const compact = options.compact === true;

    console.log('');

    budgets.forEach((budget, index) => {
      if (compact) {
        this._renderCompactItem(budget, index);
      } else {
        this._renderDetailedItem(budget, index);
      }
    });

    // Resumo
    if (!compact && budgets.length > 1) {
      this._renderSummary(budgets);
    }
  }

  /**
   * Renderiza item de orçamento de forma compacta
   * @private
   */
  static _renderCompactItem(budget, index) {
    const icon = budget.categoryIcon || '💰';
    const name = budget.categoryName || 'Categoria';
    const period = budget.formattedPeriod || budget.getFormattedPeriod();

    const usage = budget.usage || budget.calculateUsage();
    const bar = BudgetProgressBar.render(usage.spent, usage.limit, 25);

    console.log(`  ${chalk.gray(`[${index + 1}]`)} ${icon} ${chalk.bold(name)} ${chalk.gray(`(${period})`)}`);
    console.log(`      ${bar}`);
    console.log('');
  }

  /**
   * Renderiza item de orçamento com detalhes completos
   * @private
   */
  static _renderDetailedItem(budget, index) {
    const icon = budget.categoryIcon || '💰';
    const name = budget.categoryName || 'Categoria';
    const period = budget.formattedPeriod || budget.getFormattedPeriod();

    const usage = budget.usage || budget.calculateUsage();
    const spent = budget.getFormattedAmount(usage.spent);
    const limit = budget.getFormattedAmount(usage.limit);
    const remaining = budget.getFormattedAmount(Math.abs(usage.remaining));

    // Cabeçalho
    console.log(`  ${chalk.gray(`[${index + 1}]`)} ${icon} ${styles.bold(name)} ${chalk.gray(`(${period})`)}`);

    // Barra de progresso
    const bar = BudgetProgressBar.render(usage.spent, usage.limit, 30);
    console.log(`      ${bar}  ${spent} / ${limit}`);

    // Status e valor restante
    const statusText = BudgetProgressBar.getStatusText(usage.percentage);
    if (usage.exceeded) {
      console.log(`      ${statusText} • ${chalk.red(`Excedido em ${remaining}`)}`);
    } else {
      console.log(`      ${statusText} • ${chalk.gray(`Restam ${remaining}`)}`);
    }

    // Projeção (se houver)
    if (budget.projection) {
      const proj = budget.projection;

      if (proj.willExceed && !usage.exceeded) {
        const projDate = new Date(proj.exceedDate);
        const dateStr = budget.getFormattedDate(projDate);
        console.log(`      ${chalk.yellow(`⚠️  Projeção: estouro em ${dateStr}`)}`);
      }
    }

    console.log('');
  }

  /**
   * Renderiza resumo geral dos orçamentos
   * @private
   */
  static _renderSummary(budgets) {
    const totalLimit = budgets.reduce((sum, b) => {
      const usage = b.usage || b.calculateUsage();
      return sum + usage.limit;
    }, 0);

    const totalSpent = budgets.reduce((sum, b) => {
      const usage = b.usage || b.calculateUsage();
      return sum + usage.spent;
    }, 0);

    const totalRemaining = totalLimit - totalSpent;
    const avgPercentage = (totalSpent / totalLimit) * 100;

    // Contar por status
    const stats = {
      safe: 0,
      caution: 0,
      warning: 0,
      exceeded: 0
    };

    budgets.forEach(b => {
      const level = b.alertLevel || b.getAlertLevel();
      stats[level] = (stats[level] || 0) + 1;
    });

    console.log(createSeparator());
    console.log('');
    console.log(chalk.bold('  📊 RESUMO GERAL'));
    console.log('');
    console.log(`  → ${chalk.cyan(budgets.length)} orçamentos ativos`);
    console.log(`  → Total orçado: ${styles.currency(totalLimit)}`);
    console.log(`  → Total gasto: ${styles.currency(totalSpent)}`);

    if (totalRemaining >= 0) {
      console.log(`  → Economia: ${chalk.green(this._formatCurrency(totalRemaining))} (${(100 - avgPercentage).toFixed(1)}%)`);
    } else {
      console.log(`  → Excesso: ${chalk.red(this._formatCurrency(Math.abs(totalRemaining)))} (${(avgPercentage - 100).toFixed(1)}%)`);
    }

    console.log('');
    console.log(`  Status: ${chalk.green(`${stats.safe} OK`)} • ${chalk.yellow(`${stats.caution} Alerta`)} • ${chalk.yellow(`${stats.warning} Atenção`)} • ${chalk.red(`${stats.exceeded} Excedido`)}`);
    console.log('');
  }

  /**
   * Renderiza widget resumido de orçamentos (para dashboard)
   */
  static renderWidget(budgets) {
    if (!budgets || budgets.length === 0) {
      console.log(createBox(
        '💰 ORÇAMENTOS\n\n' +
        chalk.gray('Nenhum orçamento ativo'),
        { borderColor: '#667eea', padding: 1 }
      ));
      return;
    }

    // Pegar apenas orçamentos em alerta ou excedidos
    const inAlert = budgets.filter(b => {
      const usage = b.usage || b.calculateUsage();
      return usage.percentage >= 50;
    }).slice(0, 3); // Mostrar no máximo 3

    let content = '💰 ORÇAMENTOS\n\n';

    if (inAlert.length === 0) {
      content += chalk.green('✅ Todos os orçamentos OK!');
    } else {
      content += chalk.yellow(`⚠️  ${inAlert.length} orçamento(s) em alerta:\n\n`);

      inAlert.forEach(budget => {
        const icon = budget.categoryIcon || '💰';
        const name = budget.categoryName || 'Categoria';
        const usage = budget.usage || budget.calculateUsage();
        const miniBar = BudgetProgressBar.renderMini(usage.percentage, 15);

        content += `${icon} ${name}\n`;
        content += `${miniBar}\n\n`;
      });
    }

    console.log(createBox(content.trim(), { borderColor: '#667eea', padding: 1 }));
  }

  /**
   * Formata valor em moeda
   * @private
   */
  static _formatCurrency(value) {
    const formatted = value.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }
}

export default BudgetList;
