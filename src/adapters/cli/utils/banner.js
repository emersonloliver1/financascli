import figlet from 'figlet';
import boxen from 'boxen';
import chalk from 'chalk';
import { gradients, colors, styles } from './colors.js';

/**
 * Cria um banner ASCII art bonito para o aplicativo
 */
export async function createBanner() {
  return new Promise((resolve, reject) => {
    figlet('Financas', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    }, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      const coloredBanner = gradients.financial.multiline(data);
      const subtitle = styles.subtitle('Sistema de Gestão Financeira Pessoal');

      const fullBanner = `${coloredBanner}\n${' '.repeat(20)}${subtitle}`;

      resolve(fullBanner);
    });
  });
}

/**
 * Cria uma caixa decorativa para mensagens
 */
export function createBox(content, options = {}) {
  const defaultOptions = {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: '#667eea',
    ...options
  };

  return boxen(content, defaultOptions);
}

/**
 * Cria um menu visual
 */
export function createMenu(title, options, currentIndex = 0) {
  let menu = `\n${styles.bold(colors.primary(title))}\n\n`;

  options.forEach((option, index) => {
    const isSelected = index === currentIndex;
    const prefix = isSelected ? colors.selected('❯') : ' ';
    const text = isSelected
      ? colors.selected(option.label)
      : colors.text(option.label);
    const key = colors.textDim(`[${option.key}]`);

    menu += `${prefix} ${key} ${text}\n`;
  });

  return menu;
}

/**
 * Cria um separador visual
 */
export function createSeparator(char = '─', width = 50) {
  return colors.textDim(char.repeat(width));
}

/**
 * Cria uma mensagem de sucesso
 */
export function successMessage(message) {
  return createBox(
    `${chalk.green('✓')} ${chalk.bold(message)}`,
    { borderColor: 'green' }
  );
}

/**
 * Cria uma mensagem de erro
 */
export function errorMessage(message) {
  return createBox(
    `${chalk.red('✗')} ${chalk.bold(message)}`,
    { borderColor: 'red' }
  );
}

/**
 * Cria uma mensagem de informação
 */
export function infoMessage(message) {
  return createBox(
    `${chalk.blue('ℹ')} ${message}`,
    { borderColor: 'blue' }
  );
}

/**
 * Cria uma mensagem de aviso
 */
export function warningMessage(message) {
  return createBox(
    `${chalk.yellow('⚠')} ${message}`,
    { borderColor: 'yellow' }
  );
}

/**
 * Limpa o terminal
 */
export function clearScreen() {
  console.clear();
}

export default {
  createBanner,
  createBox,
  createMenu,
  createSeparator,
  successMessage,
  errorMessage,
  infoMessage,
  warningMessage,
  clearScreen
};
