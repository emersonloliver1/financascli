import ora from 'ora';
import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import {
  clearScreen,
  createBanner,
  createBox,
  successMessage,
  errorMessage,
  createSeparator
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';

/**
 * Tela de autenticação (Login/Registro)
 */
export class AuthScreen {
  constructor(registerUseCase, loginUseCase) {
    this.registerUseCase = registerUseCase;
    this.loginUseCase = loginUseCase;
  }

  /**
   * Exibe o menu inicial de autenticação
   */
  async show() {
    // Exibir banner
    const banner = await createBanner();
    console.log(banner);
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    // Menu de opções com seleção numérica instantânea
    const choice = await QuickMenu.selectWithIcons(
      '💰 O QUE DESEJA FAZER?',
      [
        { name: 'Fazer Login', value: 'login', icon: '🔐', color: 'cyan' },
        { name: 'Criar Nova Conta', value: 'register', icon: '🚀', color: 'green' },
        { name: 'Sair', value: 'exit', icon: '❌', color: 'red' }
      ]
    );

    switch (choice) {
      case 'login':
        return await this.showLogin();
      case 'register':
        return await this.showRegister();
      case 'exit':
        return null;
    }
  }

  /**
   * Exibe a tela de login
   */
  async showLogin() {
    clearScreen();
    console.log(styles.title('\n🔐 LOGIN\n'));
    console.log(createSeparator());
    console.log('\n');

    try {
      // Capturar credenciais
      const email = await Input.email('Email');
      const password = await Input.password('Senha');

      // Spinner de loading
      const spinner = ora({
        text: 'Autenticando...',
        color: 'cyan'
      }).start();

      // Executar login
      const result = await this.loginUseCase.execute({ email, password });

      spinner.stop();

      if (!result.success) {
        console.log('\n');
        console.log(errorMessage(result.errors.join('\n')));
        console.log('\n');

        const retry = await Input.confirm('Tentar novamente?');
        if (retry) {
          return await this.showLogin();
        } else {
          return await this.show();
        }
      }

      // Sucesso!
      console.log('\n');
      console.log(successMessage(`Bem-vindo de volta, ${result.user.name}! ${icons.success}`));
      console.log('\n');

      await Input.pressKey();

      return result.user;
    } catch (error) {
      console.log('\n');
      console.log(errorMessage(`Erro inesperado: ${error.message}`));
      console.log('\n');
      await Input.pressKey();
      return await this.show();
    }
  }

  /**
   * Exibe a tela de registro
   */
  async showRegister() {
    clearScreen();
    console.log(styles.title('\n🚀 CRIAR NOVA CONTA\n'));
    console.log(createSeparator());
    console.log('\n');

    try {
      // Capturar dados do usuário
      const name = await Input.text(`${icons.user} Nome completo:`);
      const email = await Input.email('Email');
      const password = await Input.password('Senha (mínimo 6 caracteres)');
      const confirmPassword = await Input.confirmPassword(password);

      // Spinner de loading
      const spinner = ora({
        text: 'Criando sua conta...',
        color: 'cyan'
      }).start();

      // Executar registro
      const result = await this.registerUseCase.execute({
        name,
        email,
        password,
        confirmPassword
      });

      spinner.stop();

      if (!result.success) {
        console.log('\n');
        console.log(errorMessage(result.errors.join('\n')));
        console.log('\n');

        const retry = await Input.confirm('Tentar novamente?');
        if (retry) {
          return await this.showRegister();
        } else {
          return await this.show();
        }
      }

      // Sucesso!
      console.log('\n');
      console.log(successMessage(`Conta criada com sucesso! ${icons.success}`));
      console.log('\n');
      console.log(createBox(
        `${icons.star} Bem-vindo, ${result.user.name}!\n\n` +
        `Sua conta foi criada e você já está logado.`,
        { borderColor: 'green' }
      ));
      console.log('\n');

      await Input.pressKey();

      return result.user;
    } catch (error) {
      console.log('\n');
      console.log(errorMessage(`Erro inesperado: ${error.message}`));
      console.log('\n');
      await Input.pressKey();
      return await this.show();
    }
  }
}

export default AuthScreen;
