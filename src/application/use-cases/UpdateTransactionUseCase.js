import { Transaction } from '../../domain/entities/Transaction.js';

/**
 * Caso de uso: Atualizar transação existente
 */
export class UpdateTransactionUseCase {
  constructor(transactionRepository, categoryRepository) {
    this.transactionRepository = transactionRepository;
    this.categoryRepository = categoryRepository;
  }

  /**
   * Executa a atualização de uma transação
   * @param {Object} params - {
   *   id: string,
   *   userId: string,
   *   data: {
   *     type?: string,
   *     categoryId?: string,
   *     amount?: number,
   *     description?: string,
   *     date?: Date|string
   *   }
   * }
   * @returns {Promise<{success: boolean, transaction?: Transaction, errors?: string[]}>}
   */
  async execute({ id, userId, data }) {
    try {
      // Validar parâmetros
      if (!id || !userId) {
        return { success: false, errors: ['ID e UserId são obrigatórios'] };
      }

      if (!data || Object.keys(data).length === 0) {
        return { success: false, errors: ['Nenhum dado para atualizar'] };
      }

      // Buscar transação existente
      const existingTransaction = await this.transactionRepository.findById(id);

      if (!existingTransaction) {
        return { success: false, errors: ['Transação não encontrada'] };
      }

      // Verificar permissão
      if (!existingTransaction.isEditable(userId)) {
        return {
          success: false,
          errors: ['Você não tem permissão para editar esta transação']
        };
      }

      // Preparar dados para atualização
      const updateData = { ...data };

      // Validar e formatar amount se fornecido
      if (updateData.amount !== undefined) {
        let parsedAmount = updateData.amount;
        if (typeof parsedAmount === 'string') {
          parsedAmount = parsedAmount
            .replace(/R\$/g, '')
            .replace(/\./g, '')
            .replace(',', '.')
            .trim();
          parsedAmount = parseFloat(parsedAmount);
        }
        updateData.amount = parsedAmount;

        if (isNaN(updateData.amount) || updateData.amount <= 0) {
          return { success: false, errors: ['Valor inválido'] };
        }
      }

      // Validar e formatar data se fornecida
      if (updateData.date !== undefined) {
        if (typeof updateData.date === 'string') {
          updateData.date = new Date(updateData.date);
        }

        if (isNaN(updateData.date.getTime())) {
          return { success: false, errors: ['Data inválida'] };
        }

        // Data não pode ser no futuro
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (updateData.date > tomorrow) {
          return { success: false, errors: ['Data não pode ser no futuro'] };
        }
      }

      // Se está mudando a categoria, validar
      if (updateData.categoryId && updateData.categoryId !== existingTransaction.categoryId) {
        const newCategory = await this.categoryRepository.findById(updateData.categoryId);

        if (!newCategory) {
          return { success: false, errors: ['Nova categoria não encontrada'] };
        }

        // Verificar se a categoria pertence ao usuário ou é global
        if (!newCategory.isGlobal() && newCategory.userId !== userId) {
          return {
            success: false,
            errors: ['Você não pode usar categorias de outros usuários']
          };
        }

        // Verificar se o tipo da transação é compatível com a nova categoria
        const transactionType = updateData.type || existingTransaction.type;
        if (newCategory.type !== transactionType) {
          const categoryTypeName = newCategory.type === 'income' ? 'receitas' : 'despesas';
          const transactionTypeName = transactionType === 'income' ? 'receita' : 'despesa';
          return {
            success: false,
            errors: [`A categoria "${newCategory.name}" é para ${categoryTypeName}, mas a transação é uma ${transactionTypeName}`]
          };
        }
      }

      // Validar tipo se estiver mudando
      if (updateData.type && !['income', 'expense'].includes(updateData.type)) {
        return { success: false, errors: ['Tipo inválido. Use "income" ou "expense"'] };
      }

      // Validar descrição
      if (updateData.description !== undefined && updateData.description.length > 200) {
        return { success: false, errors: ['Descrição deve ter no máximo 200 caracteres'] };
      }

      // Atualizar transação
      const updatedTransaction = await this.transactionRepository.update(id, updateData);

      return { success: true, transaction: updatedTransaction };

    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao atualizar transação: ${error.message}`]
      };
    }
  }
}
