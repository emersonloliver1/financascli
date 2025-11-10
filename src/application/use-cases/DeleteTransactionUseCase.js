/**
 * Caso de uso: Deletar transação
 */
export class DeleteTransactionUseCase {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  /**
   * Executa a exclusão de uma transação
   * @param {Object} params - { id: string, userId: string }
   * @returns {Promise<{success: boolean, errors?: string[]}>}
   */
  async execute({ id, userId }) {
    try {
      // Validar parâmetros
      if (!id || !userId) {
        return { success: false, errors: ['ID e UserId são obrigatórios'] };
      }

      // Buscar transação existente
      const transaction = await this.transactionRepository.findById(id);

      if (!transaction) {
        return { success: false, errors: ['Transação não encontrada'] };
      }

      // Verificar permissão
      if (!transaction.isDeletable(userId)) {
        return {
          success: false,
          errors: ['Você não tem permissão para deletar esta transação']
        };
      }

      // Deletar transação
      const deleted = await this.transactionRepository.delete(id);

      if (!deleted) {
        return { success: false, errors: ['Erro ao deletar transação'] };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        errors: [`Erro ao deletar transação: ${error.message}`]
      };
    }
  }
}
