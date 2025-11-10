import chalk from 'chalk';
import gradient from 'gradient-string';

/**
 * Utilitários de cores e estilos para o terminal
 */

// Gradientes personalizados
export const gradients = {
  primary: gradient(['#667eea', '#764ba2']),
  success: gradient(['#56ab2f', '#a8e063']),
  error: gradient(['#eb3349', '#f45c43']),
  warning: gradient(['#f2994a', '#f2c94c']),
  info: gradient(['#4facfe', '#00f2fe']),
  financial: gradient(['#11998e', '#38ef7d'])
};

// Cores temáticas
export const colors = {
  primary: chalk.hex('#667eea'),
  secondary: chalk.hex('#764ba2'),
  success: chalk.hex('#56ab2f'),
  error: chalk.hex('#eb3349'),
  warning: chalk.hex('#f2994a'),
  info: chalk.hex('#4facfe'),

  // Cores financeiras
  income: chalk.hex('#38ef7d'),
  expense: chalk.hex('#eb3349'),

  // UI
  text: chalk.white,
  textDim: chalk.gray,
  highlight: chalk.bold.cyan,
  selected: chalk.bold.hex('#667eea')
};

// Ícones
export const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  money: '💰',
  income: '📈',
  expense: '📉',
  user: '👤',
  lock: '🔒',
  email: '📧',
  arrow: '→',
  check: '✓',
  cross: '✗',
  star: '⭐',
  rocket: '🚀'
};

// Estilos de texto
export const styles = {
  title: (text) => gradients.primary.multiline(text),
  subtitle: (text) => colors.textDim(text),
  highlight: (text) => colors.highlight(text),
  success: (text) => colors.success(text),
  error: (text) => colors.error(text),
  warning: (text) => colors.warning(text),
  info: (text) => colors.info(text),
  bold: (text) => chalk.bold(text),
  dim: (text) => chalk.dim(text),

  // Valores financeiros
  currency: (value) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

    return value >= 0 ? colors.income(formatted) : colors.expense(formatted);
  }
};

export default {
  gradients,
  colors,
  icons,
  styles
};
