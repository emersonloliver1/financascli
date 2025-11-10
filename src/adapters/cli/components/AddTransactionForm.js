import { Input } from './Input.js';
import { QuickMenu } from './QuickMenu.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';

/**
 * Componente: Formulário para adicionar transação
 */
export class AddTransactionForm {
  constructor(user, transactionUseCases, categoryUseCases) {
    this.user = user;
    this.createTransactionUseCase = transactionUseCases.createTransactionUseCase;
    this.listCategoriesUseCase = categoryUseCases.listCategoriesUseCase;
  }

  /**
   * Exibe o formulário completo para criar uma transação
   * @param {string} preSelectedType - 'income' ou 'expense' (opcional)
   */
  async show(preSelectedType = null) {
    try {
      clearScreen();

      // 1. Seleção de Tipo (se não foi pré-selecionado)
      let type = preSelectedType;

      if (!type) {
        console.log('\n');
        console.log(createBox(
          `${icons.money} NOVA TRANSAÇÃO`,
          { borderColor: '#667eea', padding: 1 }
        ));
        console.log('\n');

        type = await QuickMenu.selectWithIcons(
          'Selecione o tipo',
          [
            { name: 'Receita', value: 'income', icon: '📈', color: 'green' },
            { name: 'Despesa', value: 'expense', icon: '📉', color: 'red' }
          ]
        );

        if (!type) {
          return null; // Cancelado
        }
      }

      clearScreen();

      // Header
      const typeIcon = type === 'income' ? '📈' : '📉';
      const typeName = type === 'income' ? 'RECEITA' : 'DESPESA';
      const typeColor = type === 'income' ? 'green' : 'red';

      console.log('\n');
      console.log(createBox(
        `${typeIcon} NOVA ${typeName}`,
        { borderColor: typeColor, padding: 1 }
      ));
      console.log('\n');

      // 2. Seleção de Categoria
      const categories = await this._loadCategories(type);

      if (categories.length === 0) {
        console.log(colors.error('\n❌ Nenhuma categoria encontrada para este tipo!\n'));
        console.log(colors.textDim('Crie categorias primeiro no menu "Categorias".\n'));
        await Input.pressKey();
        return null;
      }

      console.log(colors.info('📂 Selecione a categoria:\n'));

      const categoryOptions = categories.map(cat => ({
        name: `${cat.icon || '📁'} ${cat.name}`,
        value: cat.id,
        icon: cat.icon || '📁',
        color: cat.color || 'white'
      }));

      const categoryId = await QuickMenu.selectWithIcons('Categoria', categoryOptions);

      if (!categoryId) {
        return null; // Cancelado
      }

      const selectedCategory = categories.find(c => c.id === categoryId);

      clearScreen();
      console.log('\n');
      console.log(createBox(
        `${typeIcon} NOVA ${typeName}\n${colors.textDim(`Categoria: ${selectedCategory.icon} ${selectedCategory.name}`)}`,
        { borderColor: typeColor, padding: 1 }
      ));
      console.log('\n');

      // 3. Input de Valor
      console.log(colors.info('💰 Digite o valor:\n'));
      console.log(colors.textDim('  Ex: 100 ou 100.50 ou 1234.56\n'));

      const amountInput = await Input.prompt('R$ ');

      if (!amountInput || amountInput.trim() === '') {
        return null; // Cancelado
      }

      // Validar valor
      const amount = parseFloat(amountInput.replace(',', '.'));

      if (isNaN(amount) || amount <= 0) {
        console.log(colors.error('\n❌ Valor inválido! Deve ser maior que zero.\n'));
        await Input.pressKey();
        return await this.show(type);
      }

      clearScreen();
      console.log('\n');
      console.log(createBox(
        `${typeIcon} NOVA ${typeName}\n` +
        `${colors.textDim(`Categoria: ${selectedCategory.icon} ${selectedCategory.name}`)}\n` +
        `${colors.textDim(`Valor: R$ ${amount.toFixed(2).replace('.', ',')}`)}`,
        { borderColor: typeColor, padding: 1 }
      ));
      console.log('\n');

      // 4. Input de Descrição (opcional)
      console.log(colors.info('📝 Descrição (opcional, Enter para pular):\n'));
      console.log(colors.textDim('  Máximo 200 caracteres\n'));

      const description = await Input.prompt('Descrição: ');

      if (description && description.length > 200) {
        console.log(colors.error('\n❌ Descrição muito longa! Máximo 200 caracteres.\n'));
        await Input.pressKey();
        return await this.show(type);
      }

      clearScreen();
      console.log('\n');
      console.log(createBox(
        `${typeIcon} NOVA ${typeName}\n` +
        `${colors.textDim(`Categoria: ${selectedCategory.icon} ${selectedCategory.name}`)}\n` +
        `${colors.textDim(`Valor: R$ ${amount.toFixed(2).replace('.', ',')}`)}` +
        (description ? `\n${colors.textDim(`Descrição: ${description}`)}` : ''),
        { borderColor: typeColor, padding: 1 }
      ));
      console.log('\n');

      // 5. Seleção de Data
      console.log(colors.info('📅 Selecione a data:\n'));

      const dateChoice = await QuickMenu.selectWithIcons(
        'Data da transação',
        [
          { name: 'Hoje', value: 'today', icon: '📅', color: 'cyan' },
          { name: 'Ontem', value: 'yesterday', icon: '📅', color: 'blue' },
          { name: 'Personalizada', value: 'custom', icon: '📆', color: 'purple' }
        ]
      );

      if (!dateChoice) {
        return null; // Cancelado
      }

      let date;

      if (dateChoice === 'today') {
        date = new Date();
      } else if (dateChoice === 'yesterday') {
        date = new Date();
        date.setDate(date.getDate() - 1);
      } else {
        // Data personalizada
        clearScreen();
        console.log('\n');
        console.log(colors.info('📆 Digite a data (DD/MM/AAAA):\n'));
        console.log(colors.textDim('  Ex: 10/11/2025\n'));

        const dateInput = await Input.prompt('Data: ');

        if (!dateInput) {
          return null;
        }

        // Parse DD/MM/YYYY
        const parts = dateInput.split('/');
        if (parts.length !== 3) {
          console.log(colors.error('\n❌ Formato inválido! Use DD/MM/AAAA\n'));
          await Input.pressKey();
          return await this.show(type);
        }

        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Mês começa em 0
        const year = parseInt(parts[2]);

        date = new Date(year, month, day);

        if (isNaN(date.getTime())) {
          console.log(colors.error('\n❌ Data inválida!\n'));
          await Input.pressKey();
          return await this.show(type);
        }

        // Verificar se não é futuro
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date > tomorrow) {
          console.log(colors.error('\n❌ Data não pode ser no futuro!\n'));
          await Input.pressKey();
          return await this.show(type);
        }
      }

      // 6. Confirmação
      clearScreen();
      console.log('\n');

      const formattedDate = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      const formattedAmount = amount.toFixed(2).replace('.', ',');

      console.log(createBox(
        `${typeIcon} CONFIRMAR ${typeName}\n\n` +
        `${selectedCategory.icon || '📁'} Categoria: ${colors.bold(selectedCategory.name)}\n` +
        `💰 Valor: ${colors.bold(`R$ ${formattedAmount}`)}\n` +
        `📅 Data: ${colors.bold(formattedDate)}\n` +
        (description ? `📝 Descrição: ${colors.bold(description)}\n` : ''),
        { borderColor: typeColor, padding: 2 }
      ));
      console.log('\n');

      const confirm = await QuickMenu.selectWithIcons(
        'Deseja salvar?',
        [
          { name: 'Sim, salvar', value: true, icon: '✅', color: 'green' },
          { name: 'Não, cancelar', value: false, icon: '❌', color: 'red' }
        ]
      );

      if (!confirm) {
        console.log(colors.warning('\n⚠️  Transação cancelada!\n'));
        await Input.pressKey();
        return null;
      }

      // 7. Salvar transação
      console.log(colors.info('\n⏳ Salvando transação...\n'));

      const result = await this.createTransactionUseCase.execute({
        userId: this.user.id,
        type,
        categoryId,
        amount,
        description,
        date
      });

      clearScreen();

      if (result.success) {
        console.log('\n');
        console.log(createBox(
          `${icons.success} TRANSAÇÃO CRIADA COM SUCESSO!\n\n` +
          `${result.transaction.getSummary()}`,
          { borderColor: 'green', padding: 2 }
        ));
        console.log('\n');
        await Input.pressKey();
        return result.transaction;
      } else {
        console.log('\n');
        console.log(createBox(
          `${icons.error} ERRO AO CRIAR TRANSAÇÃO\n\n` +
          result.errors.join('\n'),
          { borderColor: 'red', padding: 2 }
        ));
        console.log('\n');
        await Input.pressKey();
        return null;
      }

    } catch (error) {
      console.log(colors.error(`\n❌ Erro: ${error.message}\n`));
      await Input.pressKey();
      return null;
    }
  }

  /**
   * Carrega categorias do tipo especificado
   * @private
   */
  async _loadCategories(type) {
    const result = await this.listCategoriesUseCase.execute({
      userId: this.user.id,
      type
    });

    if (!result.success) {
      return [];
    }

    return result.categories;
  }
}
