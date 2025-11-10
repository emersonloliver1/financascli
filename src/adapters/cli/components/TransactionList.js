import { Input } from './Input.js';
import { QuickMenu } from './QuickMenu.js';
import {
  clearScreen,
  createBox,
  createSeparator
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';

/**
 * Componente: Lista de transações com paginação
 */
export class TransactionList {
  constructor(user, transactionUseCases) {
    this.user = user;
    this.listTransactionsUseCase = transactionUseCases.listTransactionsUseCase;
    this.deleteTransactionUseCase = transactionUseCases.deleteTransactionUseCase;
    this.getTransactionByIdUseCase = transactionUseCases.getTransactionByIdUseCase;
  }

  /**
   * Exibe a lista de transações
   * @param {Object} options - { page, limit, filters }
   */
  async show(options = {}) {
    const { page = 1, limit = 10, filters = {} } = options;

    try {
      clearScreen();

      // Header
      console.log('\n');
      console.log(createBox(
        `${icons.money} MINHAS TRANSAÇÕES`,
        { borderColor: '#667eea', padding: 1 }
      ));
      console.log('\n');

      // Carregar transações
      console.log(colors.info('⏳ Carregando transações...\n'));

      const result = await this.listTransactionsUseCase.execute({
        userId: this.user.id,
        page,
        limit,
        filters
      });

      clearScreen();

      if (!result.success) {
        console.log(colors.error(`\n❌ ${result.errors.join('\n')}\n`));
        await Input.pressKey();
        return;
      }

      // Header com resumo
      console.log('\n');
      console.log(createBox(
        `${icons.money} MINHAS TRANSAÇÕES\n\n` +
        `${colors.success(`📈 Receitas: R$ ${this._formatMoney(result.summary.totalIncome)}`)}\n` +
        `${colors.error(`📉 Despesas: R$ ${this._formatMoney(result.summary.totalExpense)}`)}\n` +
        `${colors.info(`💰 Saldo: R$ ${this._formatMoney(result.summary.balance)}`)}`,
        { borderColor: '#667eea', padding: 1 }
      ));
      console.log('\n');

      // Transações
      if (result.transactions.length === 0) {
        console.log(createBox(
          `${icons.warning} NENHUMA TRANSAÇÃO ENCONTRADA\n\n` +
          'Adicione sua primeira transação no menu principal!',
          { borderColor: 'yellow', padding: 2 }
        ));
        console.log('\n');
        await Input.pressKey();
        return;
      }

      // Exibir tabela de transações
      this._renderTable(result.transactions);

      // Paginação
      console.log('\n');
      console.log(colors.textDim(
        `Página ${result.pagination.page} de ${result.pagination.totalPages} | ` +
        `Total: ${result.pagination.total} transações`
      ));
      console.log('\n');
      console.log(createSeparator());
      console.log('\n');

      // Menu de ações
      const actions = [
        { name: 'Ver Detalhes', value: 'view', icon: '👁️', color: 'cyan' },
        { name: 'Deletar', value: 'delete', icon: '🗑️', color: 'red' }
      ];

      // Adicionar navegação de página
      if (result.pagination.page > 1) {
        actions.unshift({ name: '← Página Anterior', value: 'prev', icon: '◀️', color: 'blue' });
      }

      if (result.pagination.page < result.pagination.totalPages) {
        actions.push({ name: 'Próxima Página →', value: 'next', icon: '▶️', color: 'blue' });
      }

      actions.push({ name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' });

      const action = await QuickMenu.selectWithIcons('O que deseja fazer?', actions);

      if (!action || action === 'back') {
        return;
      }

      if (action === 'prev') {
        return await this.show({ page: page - 1, limit, filters });
      }

      if (action === 'next') {
        return await this.show({ page: page + 1, limit, filters });
      }

      if (action === 'view') {
        await this._showDetails(result.transactions);
        return await this.show({ page, limit, filters });
      }

      if (action === 'delete') {
        await this._deleteTransaction(result.transactions);
        return await this.show({ page, limit, filters });
      }

    } catch (error) {
      console.log(colors.error(`\n❌ Erro: ${error.message}\n`));
      await Input.pressKey();
    }
  }

  /**
   * Renderiza tabela de transações
   * @private
   */
  _renderTable(transactions) {
    console.log(colors.bold('┌─────────────┬──────┬────────────────────┬──────────────────┬──────────────┐'));
    console.log(colors.bold('│ Data        │ Tipo │ Categoria          │ Descrição        │ Valor        │'));
    console.log(colors.bold('├─────────────┼──────┼────────────────────┼──────────────────┼──────────────┤'));

    transactions.forEach(transaction => {
      const date = this._pad(transaction.getFormattedDate(), 11);
      const typeIcon = transaction.isIncome() ? '📈' : '📉';
      const type = this._pad(typeIcon, 4);
      const category = this._pad(`${transaction.categoryIcon || '📁'} ${transaction.categoryName || 'Sem categoria'}`.substring(0, 18), 18);
      const description = this._pad((transaction.description || '-').substring(0, 16), 16);

      const amountColor = transaction.isIncome() ? colors.success : colors.error;
      const amountFormatted = transaction.getSignedAmount();
      const amount = this._pad(amountFormatted, 12);

      console.log(
        `│ ${date} │ ${type} │ ${category} │ ${description} │ ${amountColor(amount)} │`
      );
    });

    console.log(colors.bold('└─────────────┴──────┴────────────────────┴──────────────────┴──────────────┘'));
  }

  /**
   * Exibe detalhes de uma transação
   * @private
   */
  async _showDetails(transactions) {
    clearScreen();
    console.log('\n');
    console.log(colors.info('👁️  Selecione a transação para ver detalhes:\n'));

    const options = transactions.map((t, index) => ({
      name: t.getSummary(),
      value: t.id,
      icon: t.isIncome() ? '📈' : '📉',
      color: t.isIncome() ? 'green' : 'red'
    }));

    const transactionId = await QuickMenu.selectWithIcons('Transação', options);

    if (!transactionId) {
      return;
    }

    // Buscar detalhes completos
    const result = await this.getTransactionByIdUseCase.execute({
      id: transactionId,
      userId: this.user.id
    });

    clearScreen();

    if (!result.success) {
      console.log(colors.error(`\n❌ ${result.errors.join('\n')}\n`));
      await Input.pressKey();
      return;
    }

    const t = result.transaction;

    console.log('\n');
    console.log(createBox(
      `${icons.money} DETALHES DA TRANSAÇÃO\n\n` +
      `${t.isIncome() ? '📈' : '📉'} Tipo: ${colors.bold(t.isIncome() ? 'Receita' : 'Despesa')}\n` +
      `${t.categoryIcon || '📁'} Categoria: ${colors.bold(t.categoryName)}\n` +
      `💰 Valor: ${colors.bold(t.getSignedAmount())}\n` +
      `📅 Data: ${colors.bold(t.getFormattedDate())}\n` +
      (t.description ? `📝 Descrição: ${colors.bold(t.description)}\n` : '') +
      `\n${colors.textDim(`Criado em: ${t.createdAt.toLocaleString('pt-BR')}`)}` +
      `\n${colors.textDim(`Atualizado em: ${t.updatedAt.toLocaleString('pt-BR')}`)}`,
      { borderColor: t.isIncome() ? 'green' : 'red', padding: 2 }
    ));
    console.log('\n');

    await Input.pressKey();
  }

  /**
   * Deleta uma transação
   * @private
   */
  async _deleteTransaction(transactions) {
    clearScreen();
    console.log('\n');
    console.log(colors.error('🗑️  Selecione a transação para DELETAR:\n'));

    const options = transactions.map(t => ({
      name: t.getSummary(),
      value: t.id,
      icon: '🗑️',
      color: 'red'
    }));

    const transactionId = await QuickMenu.selectWithIcons('Transação', options);

    if (!transactionId) {
      return;
    }

    const transaction = transactions.find(t => t.id === transactionId);

    // Confirmação
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `${icons.warning} CONFIRMAR EXCLUSÃO\n\n` +
      'Deseja realmente deletar?\n\n' +
      `${transaction.getSummary()}`,
      { borderColor: 'red', padding: 2 }
    ));
    console.log('\n');

    const confirm = await QuickMenu.selectWithIcons(
      'Tem certeza?',
      [
        { name: 'Sim, deletar', value: true, icon: '✅', color: 'red' },
        { name: 'Não, cancelar', value: false, icon: '❌', color: 'gray' }
      ]
    );

    if (!confirm) {
      return;
    }

    // Deletar
    console.log(colors.info('\n⏳ Deletando transação...\n'));

    const result = await this.deleteTransactionUseCase.execute({
      id: transactionId,
      userId: this.user.id
    });

    clearScreen();

    if (result.success) {
      console.log('\n');
      console.log(createBox(
        `${icons.success} TRANSAÇÃO DELETADA COM SUCESSO!`,
        { borderColor: 'green', padding: 2 }
      ));
      console.log('\n');
    } else {
      console.log('\n');
      console.log(createBox(
        `${icons.error} ERRO AO DELETAR TRANSAÇÃO\n\n` +
        result.errors.join('\n'),
        { borderColor: 'red', padding: 2 }
      ));
      console.log('\n');
    }

    await Input.pressKey();
  }

  /**
   * Formata valor monetário
   * @private
   */
  _formatMoney(value) {
    return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /**
   * Adiciona padding em string
   * @private
   */
  _pad(str, length) {
    const s = String(str);
    return s + ' '.repeat(Math.max(0, length - s.length));
  }
}
