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
  constructor(registerUseCase, loginUseCase, userRepository) {
    this.registerUseCase = registerUseCase;
    this.loginUseCase = loginUseCase;
    this.userRepository = userRepository;
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
    
    // Exibir banner visual
    const banner = await createBanner();
    console.log(banner);
    console.log('');

    console.log(styles.title(`
🔐 LOGIN
`));
    console.log(createSeparator());
    console.log('');

    try {
      // Capturar credenciais
      const usernameOrEmail = await Input.text('Username ou Email:');
      const password = await Input.password('Senha');

      // Spinner de loading
      const spinner = ora({
        text: 'Autenticando...',
        color: 'cyan'
      }).start();

      // Executar login
      const result = await this.loginUseCase.execute({ usernameOrEmail, password });

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
      console.log('
');
      console.log(successMessage(`Bem-vindo de volta, ${result.user.name}! ${icons.success}`));
      console.log('
');

      // Verificar se o usuário tem username cadastrado
      if (!result.user.username) {
        console.log(createBox(
          `${icons.info} Você ainda não tem um username cadastrado!

` +
          `Com um username, você pode fazer login de forma mais rápida e fácil.
` +
          `Exemplo: ao invés de usar seu email, use apenas "joao123"`,
          { borderColor: 'yellow' }
        ));
        console.log('
');

        const wantsUsername = await Input.confirm('Deseja cadastrar um username agora?');
        
        if (wantsUsername) {
          const newUser = await this.setupUsername(result.user);
          if (newUser) {
            result.user = newUser;
          }
        }
      }

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
    
    // Exibir banner visual
    const banner = await createBanner();
    console.log(banner);
    console.log('
');
    
    console.log(styles.title('
🚀 CRIAR NOVA CONTA
'));
    console.log(createSeparator());
    console.log('
');

    try {
      // Capturar dados do usuário
      const name = await Input.text(`${icons.user} Nome completo:`);
      const email = await Input.email('Email');
      
      console.log('
');
      const wantsUsername = await Input.confirm('Deseja criar um username agora? (Você pode criar depois)');
      
      let username = null;
      if (wantsUsername) {
        username = await Input.text('Username (letras, números e _ apenas):');
      }

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
        username,
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

  /**
   * Configura username para usuário existente
   */
  async setupUsername(user) {
    try {
      console.log('
');
      console.log(styles.title('📝 CADASTRAR USERNAME
'));
      console.log(createSeparator());
      console.log('
');
      console.log(createBox(
        `${icons.info} Regras para o username:

` +
        `• Apenas letras, números e underscore (_)
` +
        `• Mínimo de 3 caracteres
` +
        `• Máximo de 20 caracteres
` +
        `• Deve ser único`,
        { borderColor: 'cyan' }
      ));
      console.log('
');

      let username;
      let isValid = false;

      while (!isValid) {
        username = await Input.text('Digite seu username:');

        // Validar formato
        if (username.length < 3) {
          console.log('
');
          console.log(errorMessage('Username deve ter pelo menos 3 caracteres'));
          console.log('
');
          continue;
        }

        if (username.length > 20) {
          console.log('
');
          console.log(errorMessage('Username deve ter no máximo 20 caracteres'));
          console.log('
');
          continue;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          console.log('
');
          console.log(errorMessage('Username deve conter apenas letras, números e underscore'));
          console.log('
');
          continue;
        }

        // Verificar se username já existe
        const existingUser = await this.userRepository.findByUsername(username);
        if (existingUser) {
          console.log('
');
          console.log(errorMessage('Username já está em uso. Tente outro.'));
          console.log('
');
          continue;
        }

        isValid = true;
      }

      // Spinner de loading
      const spinner = ora({
        text: 'Cadastrando username...',
        color: 'cyan'
      }).start();

      // Atualizar username no banco
      const updatedUser = await this.userRepository.updateUsername(user.id, username);

      spinner.stop();

      console.log('
');
      console.log(successMessage(`Username "${username}" cadastrado com sucesso! ${icons.success}`));
      console.log('
');

      return updatedUser;
    } catch (error) {
      console.log('
');
      console.log(errorMessage(`Erro ao cadastrar username: ${error.message}`));
      console.log('
');
      return null;
    }
  }
}

export default AuthScreen;
