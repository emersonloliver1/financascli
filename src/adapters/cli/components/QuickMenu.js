import terminalKit from 'terminal-kit';
const term = terminalKit.terminal;

/**
 * Componente de menu com seleção numérica instantânea
 * Usa Terminal-Kit para capturar teclas sem necessidade de ENTER
 */
export class QuickMenu {
  /**
   * Exibe menu com seleção por números (1-9)
   * @param {string} titulo - Título do menu
   * @param {Array} opcoes - Array de opções {name, value}
   * @returns {Promise<string>} Valor da opção selecionada
   */
  static async select(titulo, opcoes) {
    return new Promise((resolve, reject) => {
      // Limpar tela e exibir título
      term.clear();
      term('\n');
      term.bold.cyan(titulo);
      term('\n\n');

      // Exibir opções numeradas
      opcoes.forEach((opcao, index) => {
        const numero = index + 1;
        term.bold.white(`  ${numero}. `);
        term.yellow(`${opcao.name}\n`);
      });

      term('\n');
      term.dim('Pressione o número da opção (ou CTRL+C para sair): ');

      // Capturar input do teclado
      term.grabInput({ mouse: false });

      const cleanup = () => {
        term.grabInput(false);
        term.removeListener('key', keyHandler);
      };

      const keyHandler = (name, _matches, _data) => {
        // CTRL+C para sair
        if (name === 'CTRL_C') {
          cleanup();
          term('\n\n');
          term.red('👋 Saindo...\n\n');
          process.exit(0);
        }

        // Verificar se é um número válido
        const num = parseInt(name);

        if (!isNaN(num) && num >= 1 && num <= opcoes.length) {
          cleanup();
          term.green('✓');
          term('\n\n');
          resolve(opcoes[num - 1].value);
        }
        // Ignora outras teclas silenciosamente
      };

      term.on('key', keyHandler);

      // Timeout de segurança (5 minutos)
      setTimeout(() => {
        cleanup();
        reject(new Error('Timeout: menu inativo por muito tempo'));
      }, 300000);
    });
  }

  /**
   * Exibe menu com opções coloridas e ícones
   * @param {string} titulo - Título do menu
   * @param {Array} opcoes - Array de opções {name, value, icon, color}
   * @returns {Promise<string>} Valor da opção selecionada
   */
  static async selectWithIcons(titulo, opcoes) {
    return new Promise((resolve, reject) => {
      term.clear();
      term('\n');
      term.bold.cyan(titulo);
      term('\n\n');

      // Exibir opções numeradas com ícones e cores
      opcoes.forEach((opcao, index) => {
        const numero = index + 1;
        const icon = opcao.icon || '▶';
        const color = opcao.color || 'yellow';

        term.bold.white(`  ${numero}. `);

        // Aplicar cor baseado no valor
        switch (color) {
        case 'red':
          term.red(`${icon} ${opcao.name}\n`);
          break;
        case 'green':
          term.green(`${icon} ${opcao.name}\n`);
          break;
        case 'blue':
          term.blue(`${icon} ${opcao.name}\n`);
          break;
        case 'cyan':
          term.cyan(`${icon} ${opcao.name}\n`);
          break;
        case 'magenta':
          term.magenta(`${icon} ${opcao.name}\n`);
          break;
        case 'white':
          term.white(`${icon} ${opcao.name}\n`);
          break;
        case 'gray':
          term.gray(`${icon} ${opcao.name}\n`);
          break;
        case 'brightRed':
          term.brightRed(`${icon} ${opcao.name}\n`);
          break;
        case 'brightGreen':
          term.brightGreen(`${icon} ${opcao.name}\n`);
          break;
        case 'brightYellow':
          term.brightYellow(`${icon} ${opcao.name}\n`);
          break;
        case 'brightBlue':
          term.brightBlue(`${icon} ${opcao.name}\n`);
          break;
        case 'brightCyan':
          term.brightCyan(`${icon} ${opcao.name}\n`);
          break;
        case 'brightMagenta':
          term.brightMagenta(`${icon} ${opcao.name}\n`);
          break;
        case 'yellow':
        default:
          term.yellow(`${icon} ${opcao.name}\n`);
          break;
        }
      });

      term('\n');
      term.dim('Pressione o número: ');

      term.grabInput({ mouse: false });

      const cleanup = () => {
        term.grabInput(false);
        term.removeListener('key', keyHandler);
      };

      const keyHandler = (name) => {
        if (name === 'CTRL_C') {
          cleanup();
          term('\n\n');
          term.red('👋 Saindo...\n\n');
          process.exit(0);
        }

        const num = parseInt(name);

        if (!isNaN(num) && num >= 1 && num <= opcoes.length) {
          cleanup();
          term.green('✓');
          term('\n\n');
          resolve(opcoes[num - 1].value);
        }
      };

      term.on('key', keyHandler);

      setTimeout(() => {
        cleanup();
        reject(new Error('Timeout'));
      }, 300000);
    });
  }

  /**
   * Limpa a tela
   */
  static clear() {
    term.clear();
  }

  /**
   * Exibe mensagem de sucesso
   */
  static success(message) {
    term.green('✓ ');
    term.white(message);
    term('\n');
  }

  /**
   * Exibe mensagem de erro
   */
  static error(message) {
    term.red('✗ ');
    term.white(message);
    term('\n');
  }

  /**
   * Exibe mensagem de aviso
   */
  static warning(message) {
    term.yellow('⚠ ');
    term.white(message);
    term('\n');
  }

  /**
   * Exibe mensagem de informação
   */
  static info(message) {
    term.cyan('ℹ ');
    term.white(message);
    term('\n');
  }
}

export default QuickMenu;
