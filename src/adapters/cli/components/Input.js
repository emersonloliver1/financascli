import inquirer from 'inquirer';
import { colors, icons } from '../utils/colors.js';

/**
 * Componente de input interativo
 */
export class Input {
  /**
   * Input de texto simples
   */
  static async text(message, defaultValue = '') {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: defaultValue
      }
    ]);

    return answer.value;
  }

  /**
   * Input de email
   */
  static async email(message = 'Email') {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: `${icons.email} ${message}:`,
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            return 'Por favor, insira um email válido';
          }
          return true;
        }
      }
    ]);

    return answer.email;
  }

  /**
   * Input de senha
   */
  static async password(message = 'Senha') {
    const answer = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: `${icons.lock} ${message}:`,
        mask: '*',
        validate: (input) => {
          if (input.length < 6) {
            return 'A senha deve ter no mínimo 6 caracteres';
          }
          return true;
        }
      }
    ]);

    return answer.password;
  }

  /**
   * Input de confirmação de senha
   */
  static async confirmPassword(originalPassword) {
    const answer = await inquirer.prompt([
      {
        type: 'password',
        name: 'confirmPassword',
        message: `${icons.lock} Confirme a senha:`,
        mask: '*',
        validate: (input) => {
          if (input !== originalPassword) {
            return 'As senhas não coincidem';
          }
          return true;
        }
      }
    ]);

    return answer.confirmPassword;
  }

  /**
   * Menu de seleção
   */
  static async select(message, choices) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        pageSize: 10
      }
    ]);

    return answer.selected;
  }

  /**
   * Confirmação sim/não
   */
  static async confirm(message) {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: false
      }
    ]);

    return answer.confirmed;
  }

  /**
   * Input numérico
   */
  static async number(message, min = 0, max = Infinity) {
    const answer = await inquirer.prompt([
      {
        type: 'number',
        name: 'value',
        message,
        validate: (input) => {
          if (isNaN(input)) {
            return 'Por favor, insira um número válido';
          }
          if (input < min || input > max) {
            return `O valor deve estar entre ${min} e ${max}`;
          }
          return true;
        }
      }
    ]);

    return answer.value;
  }

  /**
   * Pressione qualquer tecla para continuar
   */
  static async pressKey(message = 'Pressione ENTER para continuar') {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: colors.textDim(message)
      }
    ]);
  }
}

export default Input;
