import chalk from 'chalk';
import { colors } from '../utils/colors.js';

/**
 * Componente para renderizar gráficos ASCII no terminal
 */
export class ChartRenderer {
  /**
   * Renderiza uma barra de progresso ASCII
   * @param {number} value - Valor atual
   * @param {number} max - Valor máximo
   * @param {number} width - Largura da barra em caracteres
   * @param {Object} options - Opções de customização
   * @returns {string}
   */
  static renderProgressBar(value, max, width = 20, options = {}) {
    const {
      filledChar = '█',
      emptyChar = '░',
      color = 'cyan',
      showPercentage = true,
      brackets = false
    } = options;

    const percentage = max > 0 ? (value / max) * 100 : 0;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const filledPart = chalk[color](filledChar.repeat(filled));
    const emptyPart = chalk.gray(emptyChar.repeat(empty));

    let bar = filledPart + emptyPart;

    if (brackets) {
      bar = chalk.gray('[') + bar + chalk.gray(']');
    }

    if (showPercentage) {
      bar += ` ${chalk.dim(percentage.toFixed(1) + '%')}`;
    }

    return bar;
  }

  /**
   * Renderiza um gráfico de barras horizontais
   * @param {string} label - Rótulo da barra
   * @param {number} value - Valor
   * @param {number} maxValue - Valor máximo (para escala)
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderHorizontalBar(label, value, maxValue, options = {}) {
    const {
      width = 30,
      color = 'cyan',
      showValue = true,
      labelWidth = 15
    } = options;

    const barLength = maxValue > 0 ? Math.round((value / maxValue) * width) : 0;
    const bar = '█'.repeat(barLength) + '░'.repeat(width - barLength);

    const paddedLabel = label.padEnd(labelWidth);
    const coloredBar = chalk[color](bar);

    let result = `${paddedLabel} ${coloredBar}`;

    if (showValue) {
      const formatted = this._formatCurrency(value);
      result += ` ${chalk.white(formatted)}`;
    }

    return result;
  }

  /**
   * Renderiza indicador de tendência
   * @param {number} current - Valor atual
   * @param {number} previous - Valor anterior
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderTrendIndicator(current, previous, options = {}) {
    const {
      showPercentage = true,
      invertColors = false // Se true, aumentar = vermelho, diminuir = verde
    } = options;

    if (!previous || previous === 0) {
      return chalk.yellow('→ NOVO');
    }

    const diff = ((current - previous) / previous) * 100;
    let symbol = '→';
    let status = 'ESTÁVEL';
    let colorFunc = chalk.yellow;

    if (diff > 5) {
      symbol = '↑';
      status = 'AUMENTOU';
      colorFunc = invertColors ? chalk.red : chalk.green;
    } else if (diff < -5) {
      symbol = '↓';
      status = 'DIMINUIU';
      colorFunc = invertColors ? chalk.green : chalk.red;
    }

    let result = `${symbol} ${status}`;

    if (showPercentage && diff !== 0) {
      result += ` ${chalk.dim('(')}${Math.abs(diff).toFixed(1)}%${chalk.dim(')')}`;
    }

    return colorFunc(result);
  }

  /**
   * Renderiza evolução mensal (últimos 6 meses)
   * @param {Array} monthlyData - Dados mensais
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderMonthlyTrend(monthlyData, options = {}) {
    const {
      width = 25,
      showBalance = false
    } = options;

    if (!monthlyData || monthlyData.length === 0) {
      return chalk.dim('Sem dados de evolução mensal');
    }

    // Encontrar o valor máximo para escala
    const maxValue = Math.max(
      ...monthlyData.map(m => Math.max(m.income || 0, m.expense || 0))
    );

    let output = '';

    monthlyData.forEach((month, index) => {
      const monthLabel = month.monthName || `Mês ${month.month}`;

      // Barra de receita
      const incomeBar = this.renderHorizontalBar(
        `${monthLabel} Rec`,
        month.income || 0,
        maxValue,
        { width, color: 'green', showValue: true, labelWidth: 12 }
      );

      // Barra de despesa
      const expenseBar = this.renderHorizontalBar(
        '     Desp',
        month.expense || 0,
        maxValue,
        { width, color: 'red', showValue: true, labelWidth: 12 }
      );

      output += incomeBar + '\n';
      output += expenseBar + '\n';

      // Saldo (opcional)
      if (showBalance) {
        const balance = (month.income || 0) - (month.expense || 0);
        const balanceColor = balance >= 0 ? 'green' : 'red';
        const balanceText = `     Saldo: ${this._formatCurrency(balance)}`;
        output += chalk[balanceColor](balanceText) + '\n';
      }

      // Separador entre meses (exceto último)
      if (index < monthlyData.length - 1) {
        output += '\n';
      }
    });

    return output;
  }

  /**
   * Renderiza top categorias com barras
   * @param {Array} categories - Lista de categorias
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderTopCategories(categories, options = {}) {
    const {
      width = 20,
      showPercentage = true,
      showCount = false
    } = options;

    if (!categories || categories.length === 0) {
      return chalk.dim('Nenhuma categoria com gastos no mês');
    }

    let output = '';

    categories.forEach((cat, index) => {
      const position = chalk.gray(`${index + 1}.`);
      const icon = cat.icon || '📂';
      const name = (cat.name || 'Sem nome').padEnd(15);
      const value = this._formatCurrency(cat.total || 0);

      // Barra de progresso baseada na porcentagem
      const bar = this.renderProgressBar(
        cat.percentage || 0,
        100,
        width,
        {
          color: this._getCategoryBarColor(index),
          showPercentage,
          filledChar: '█',
          emptyChar: '░'
        }
      );

      let line = `${position} ${icon} ${name} ${chalk.white(value.padStart(15))}  ${bar}`;

      // Adicionar contagem se solicitado
      if (showCount && cat.count) {
        line += chalk.dim(` (${cat.count} transações)`);
      }

      output += line;

      if (index < categories.length - 1) {
        output += '\n';
      }
    });

    return output;
  }

  /**
   * Renderiza card de resumo (box com informações)
   * @param {string} title - Título do card
   * @param {Object} data - Dados do card
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderSummaryCard(title, data, options = {}) {
    const {
      width = 30,
      titleColor = 'cyan'
    } = options;

    const topBorder = '┌' + '─'.repeat(width - 2) + '┐';
    const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';

    let output = chalk.gray(topBorder) + '\n';

    // Título
    const paddedTitle = ` ${title}`.padEnd(width - 2);
    output += chalk.gray('│') + chalk[titleColor].bold(paddedTitle) + chalk.gray('│') + '\n';
    output += chalk.gray('├' + '─'.repeat(width - 2) + '┤') + '\n';

    // Dados
    Object.entries(data).forEach(([key, value]) => {
      const keyPadded = ` ${key}:`.padEnd(Math.floor(width / 2));
      const valuePadded = value.toString().padStart(Math.floor(width / 2) - 2);
      const line = (keyPadded + valuePadded).padEnd(width - 2);
      output += chalk.gray('│') + line + chalk.gray('│') + '\n';
    });

    output += chalk.gray(bottomBorder);

    return output;
  }

  /**
   * Renderiza linha de indicadores
   * @param {Array} indicators - Lista de indicadores {label, value, icon}
   * @returns {string}
   */
  static renderIndicators(indicators) {
    if (!indicators || indicators.length === 0) {
      return '';
    }

    return indicators.map(ind => {
      const icon = ind.icon || '→';
      const label = ind.label || '';
      const value = ind.value || '';

      return `${icon} ${chalk.white(label)}: ${chalk.cyan(value)}`;
    }).join('\n');
  }

  /**
   * Formata valor monetário
   * @private
   */
  static _formatCurrency(value) {
    const absValue = Math.abs(value);
    const formatted = absValue.toFixed(2).replace('.', ',');
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${parts.join(',')}`;
  }

  /**
   * Retorna cor da barra baseado na posição
   * @private
   */
  static _getCategoryBarColor(index) {
    const colors = ['red', 'yellow', 'magenta', 'blue', 'cyan'];
    return colors[index % colors.length];
  }

  /**
   * Renderiza um valor com cor baseado em positivo/negativo
   * @param {number} value - Valor
   * @param {Object} options - Opções
   * @returns {string}
   */
  static renderColoredValue(value, options = {}) {
    const {
      invertColors = false,
      showSign = false
    } = options;

    const formatted = this._formatCurrency(value);
    const isPositive = value >= 0;

    let colorFunc = isPositive
      ? (invertColors ? colors.error : colors.success)
      : (invertColors ? colors.success : colors.error);

    let result = formatted;

    if (showSign) {
      const sign = isPositive ? '+' : '-';
      result = `${sign}${formatted}`;
    }

    return colorFunc(result);
  }

  /**
   * Renderiza um separador visual
   * @param {number} width - Largura
   * @param {string} char - Caractere
   * @returns {string}
   */
  static renderSeparator(width = 60, char = '─') {
    return chalk.gray(char.repeat(width));
  }

  /**
   * Renderiza título de seção
   * @param {string} text - Texto do título
   * @param {string} icon - Ícone
   * @returns {string}
   */
  static renderSectionTitle(text, icon = '') {
    const fullText = icon ? `${icon} ${text}` : text;
    return chalk.bold.cyan(fullText);
  }
}
