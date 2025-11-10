import { database } from './src/infrastructure/database/NeonDatabase.js';
import { UserRepository } from './src/infrastructure/database/UserRepository.js';
import { NeonAuthService } from './src/infrastructure/auth/NeonAuthService.js';

async function testUsernameLogin() {
  try {
    console.log('🧪 Testando sistema de login com username...\n');

    // Conectar ao banco
    await database.connect();

    const userRepository = new UserRepository(database);
    const authService = new NeonAuthService(userRepository, database);

    // 1. Buscar usuário existente
    console.log('1️⃣ Buscando usuário existente...');
    const user = await userRepository.findByEmail('emersonfilho953@gmail.com');
    console.log('   ✅ Usuário encontrado:', user.name);
    console.log('   Username atual:', user.username || '(não definido)');
    console.log('');

    // 2. Se não tem username, adicionar um
    if (!user.username) {
      console.log('2️⃣ Adicionando username de teste...');
      const updatedUser = await userRepository.updateUsername(user.id, 'emerson_teste');
      console.log('   ✅ Username atualizado:', updatedUser.username);
      console.log('');
    }

    // 3. Testar login com username
    console.log('3️⃣ Testando login com username...');
    const loginResult = await authService.login({
      usernameOrEmail: 'emerson_teste',
      password: '123456' // Use sua senha real aqui
    });

    if (loginResult.success) {
      console.log('   ✅ Login com username bem-sucedido!');
      console.log('   Usuário:', loginResult.user.name);
    } else {
      console.log('   ❌ Falha no login:', loginResult.error);
    }
    console.log('');

    // 4. Testar login com email
    console.log('4️⃣ Testando login com email...');
    const loginResult2 = await authService.login({
      usernameOrEmail: 'emersonfilho953@gmail.com',
      password: '123456' // Use sua senha real aqui
    });

    if (loginResult2.success) {
      console.log('   ✅ Login com email bem-sucedido!');
      console.log('   Usuário:', loginResult2.user.name);
    } else {
      console.log('   ❌ Falha no login:', loginResult2.error);
    }
    console.log('');

    // 5. Verificar se pode buscar por username
    console.log('5️⃣ Testando busca por username...');
    const foundUser = await userRepository.findByUsername('emerson_teste');
    if (foundUser) {
      console.log('   ✅ Usuário encontrado por username!');
      console.log('   Nome:', foundUser.name);
      console.log('   Email:', foundUser.email);
    } else {
      console.log('   ❌ Usuário não encontrado');
    }
    console.log('');

    console.log('✅ Todos os testes concluídos!');

    await database.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    await database.close();
    process.exit(1);
  }
}

testUsernameLogin();
