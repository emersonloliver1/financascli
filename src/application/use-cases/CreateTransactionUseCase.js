import { Transaction } from '../../domain/entities/Transaction.js';

/**
 * Caso de uso: Criar nova transação
 */
export class CreateTransactionUseCase {
  constructor(transactionRepository, categoryRepository) {
    this.transactionRepository = transactionRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a criação de uma nova transação
   * @param {Object} transactionData - { userId, type, categoryId, amount, description, date }
   * @returns {Promise<{success: boolean, transaction?: Transaction, errors?: string[]}>}
   */
  async execute({ userId, type, categoryId, amount, description = '', date }) {
    const errors = [];

    try {
      // Validar e formatar amount (pode vir como string)
      let parsedAmount = amount;
      if (typeof amount === 'string') {
        // Remover formatação monetária (R$, pontos, vírgulas)
        parsedAmount = amount
          .replace(/R\$/g, '')
          .replace(/\./g, '')
          .replace(',', '.')
          .trim();
        parsedAmount = parseFloat(parsedAmount);
      }

      // Validar e formatar data
      let parsedDate = date;
      if (typeof date === 'string') {
        parsedDate = new Date(date);
      }

      // Criar e validar entidade Transaction
      const transaction = new Transaction({
        userId,
        type,
        categoryId,
        amount: parsedAmount,
        description: description || '',
        date: parsedDate
      });

      const validation = transaction.validate();

      if (!validation.isValid) {
        errors.push(...validation.errors);
      }

      // Se houver erros de validação, retornar
      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Verificar se a categoria existe e pertence ao usuário
      const category = await this.categoryRepository.findById(categoryId);

      if (!category) {
        return { success: false, errors: ['Categoria não encontrada'] };
      }

      // Verificar se a categoria pertence ao usuário ou é global
      if (!category.isGlobal() && category.userId !== userId) {
        return {
          success: false,
          errors: ['Você não pode usar categorias de outros usuários']
        };
      }

      // Verificar se o tipo da transação é compatível com a categoria
      if (category.type !== type) {
        const categoryTypeName = category.type === 'income' ? 'receitas' : 'despesas';
        const transactionTypeName = type === 'income' ? 'receita' : 'despesa';
        return {
          success: false,
          errors: [`A categoria "${category.name}" é para ${categoryTypeName}, mas você está tentando criar uma ${transactionTypeName}`]
        };
      }

      // Criar transação
      const createdTransaction = await this.transactionRepository.create(transaction);

      return { success: true, transaction: createdTransaction };

    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao criar transação: ${error.message}`]
      };
    }
  }
}
