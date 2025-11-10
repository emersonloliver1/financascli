import { Input } from '../components/Input.js';
import { QuickMenu } from '../components/QuickMenu.js';
import { GoalCard } from '../components/GoalCard.js';
import { GoalProgressBar } from '../components/GoalProgressBar.js';
import { CelebrationAnimation } from '../components/CelebrationAnimation.js';
import {
  clearScreen,
  createBox,
  createSeparator,
  successMessage,
  errorMessage,
  warningMessage
} from '../utils/banner.js';
import { colors, icons, styles } from '../utils/colors.js';
import ora from 'ora';
import chalk from 'chalk';

/**
 * Tela de gerenciamento de metas financeiras
 */
export class GoalScreen {
  constructor(user, goalUseCases) {
    this.user = user;
    this.createGoalUseCase = goalUseCases.createGoal;
    this.listGoalsUseCase = goalUseCases.listGoals;
    this.updateGoalUseCase = goalUseCases.updateGoal;
    this.deleteGoalUseCase = goalUseCases.deleteGoal;
    this.addContributionUseCase = goalUseCases.addContribution;
    this.completeGoalUseCase = goalUseCases.completeGoal;
    this.getGoalStatsUseCase = goalUseCases.getGoalStats;
  }

  /**
   * Exibe menu principal de metas
   */
  async show() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `🎯 ${styles.bold('METAS FINANCEIRAS')}\n${colors.textDim('Defina e acompanhe suas metas de economia')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');
    console.log(createSeparator());
    console.log('\n');

    const choice = await QuickMenu.selectWithIcons(
      '🎯 O QUE DESEJA FAZER?',
      [
        { name: 'Minhas Metas', value: 'list', icon: '📊', color: 'cyan' },
        { name: 'Criar Nova Meta', value: 'create', icon: '➕', color: 'green' },
        { name: 'Adicionar Contribuição', value: 'contribute', icon: '💰', color: 'yellow' },
        { name: 'Editar Meta', value: 'edit', icon: '✏️', color: 'blue' },
        { name: 'Gerenciar Meta', value: 'manage', icon: '⚙️', color: 'magenta' },
        { name: 'Estatísticas', value: 'stats', icon: '📈', color: 'cyan' },
        { name: 'Histórico de Metas', value: 'history', icon: '📜', color: 'gray' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      ]
    );

    switch (choice) {
    case 'list':
      await this.showList();
      return await this.show();
    case 'create':
      await this.showCreate();
      return await this.show();
    case 'contribute':
      await this.showAddContribution();
      return await this.show();
    case 'edit':
      await this.showEdit();
      return await this.show();
    case 'manage':
      await this.showManage();
      return await this.show();
    case 'stats':
      await this.showStats();
      return await this.show();
    case 'history':
      await this.showHistory();
      return await this.show();
    case 'back':
      return 'back';
    }
  }

  /**
   * Lista metas ativas
   */
  async showList() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `🎯 ${styles.bold('MINHAS METAS ATIVAS')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando metas...').start();

    try {
      const goals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });
      spinner.stop();

      if (goals.length === 0) {
        console.log(chalk.yellow('\n   Nenhuma meta ativa. Crie sua primeira meta!\n'));
      } else {
        // Exibir resumo
        const totalSaved = goals.reduce((sum, g) => sum + parseFloat(g.current_amount), 0);
        const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount), 0);
        const totalRemaining = totalTarget - totalSaved;

        console.log(chalk.cyan.bold('📊 RESUMO:'));
        console.log(chalk.white(`   → ${goals.length} meta(s) ativa(s)`));
        console.log(chalk.green(`   → Total economizado: ${GoalProgressBar.formatCurrency(totalSaved)}`));
        console.log(chalk.yellow(`   → Meta total: ${GoalProgressBar.formatCurrency(totalTarget)}`));
        console.log(chalk.gray(`   → Falta economizar: ${GoalProgressBar.formatCurrency(totalRemaining)}`));
        console.log('\n' + createSeparator() + '\n');

        // Exibir cada meta
        console.log(GoalCard.renderList(goals, false));
      }

      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      spinner.stop();
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Cria nova meta
   */
  async showCreate() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `➕ ${styles.bold('CRIAR NOVA META')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    try {
      // Nome da meta
      const name = await Input.text('Nome da meta (ex: Viagem para Europa):', {
        validate: (value) => value.trim().length >= 3 || 'Nome deve ter pelo menos 3 caracteres'
      });

      // Valor objetivo
      const targetAmount = await Input.number('Valor objetivo (R$):', {
        validate: (value) => value > 0 || 'Valor deve ser maior que zero'
      });

      // Prazo (opcional)
      const hasDeadline = await Input.confirm('Deseja definir um prazo?');

      let deadline = null;
      if (hasDeadline) {
        deadline = await Input.date('Data limite (DD/MM/AAAA):', {
          validate: (value) => {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date > today || 'Data deve ser futura';
          }
        });
      }

      // Contribuição mensal estimada (opcional)
      const hasMonthlyContribution = await Input.confirm(
        'Deseja definir uma contribuição mensal estimada?'
      );

      let monthlyContribution = null;
      if (hasMonthlyContribution) {
        monthlyContribution = await Input.number('Contribuição mensal estimada (R$):', {
          validate: (value) => value > 0 || 'Valor deve ser maior que zero'
        });
      }

      // Confirmar criação
      console.log('\n' + chalk.cyan.bold('📋 RESUMO DA META:'));
      console.log(chalk.white(`   Nome: ${name}`));
      console.log(chalk.green(`   Valor objetivo: ${GoalProgressBar.formatCurrency(targetAmount)}`));
      if (deadline) {
        console.log(chalk.yellow(`   Prazo: ${new Date(deadline).toLocaleDateString('pt-BR')}`));
      }
      if (monthlyContribution) {
        console.log(chalk.blue(`   Contribuição mensal: ${GoalProgressBar.formatCurrency(monthlyContribution)}`));
      }
      console.log('');

      const confirm = await Input.confirm('Confirmar criação da meta?');

      if (!confirm) {
        console.log(warningMessage('Meta não criada.'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Criar meta
      const spinner = ora('Criando meta...').start();

      const goal = await this.createGoalUseCase.execute(this.user.id, {
        name,
        targetAmount,
        deadline,
        monthlyContribution
      });

      spinner.stop();

      console.log(successMessage('✅ Meta criada com sucesso!'));
      console.log('\n' + GoalCard.render({
        ...goal,
        icon: '🎯',
        progress: { percentage: 0, current: 0, target: targetAmount, remaining: targetAmount },
        current_amount: 0
      }));

      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Adiciona contribuição a uma meta
   */
  async showAddContribution() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `💰 ${styles.bold('ADICIONAR CONTRIBUIÇÃO')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    try {
      // Listar metas ativas
      const spinner = ora('Carregando metas...').start();
      const goals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });
      spinner.stop();

      if (goals.length === 0) {
        console.log(chalk.yellow('\n   Nenhuma meta ativa. Crie uma meta primeiro!\n'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Selecionar meta
      const goalChoices = goals.map(g => ({
        name: `${g.icon} ${g.name} (${GoalProgressBar.formatCurrency(g.current_amount)} / ${GoalProgressBar.formatCurrency(g.target_amount)})`,
        value: g.id
      }));

      const goalId = await QuickMenu.select('Selecione a meta:', goalChoices);

      const selectedGoal = goals.find(g => g.id === goalId);

      // Exibir meta selecionada
      console.log('\n' + GoalCard.render(selectedGoal) + '\n');

      // Valor da contribuição
      const amount = await Input.number('Valor da contribuição (R$):', {
        validate: (value) => value !== 0 || 'Valor não pode ser zero'
      });

      // Descrição (opcional)
      const hasDescription = await Input.confirm('Adicionar descrição?');

      let description = null;
      if (hasDescription) {
        description = await Input.text('Descrição:');
      }

      // Confirmar
      const typeText = amount > 0 ? 'depósito' : 'retirada';
      const amountFormatted = GoalProgressBar.formatCurrency(Math.abs(amount));

      const confirm = await Input.confirm(
        `Confirmar ${typeText} de ${amountFormatted}?`
      );

      if (!confirm) {
        console.log(warningMessage('Contribuição cancelada.'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Adicionar contribuição
      const contributionSpinner = ora(`Adicionando ${typeText}...`).start();

      const result = await this.addContributionUseCase.execute(
        goalId,
        amount,
        description,
        this.user.id
      );

      contributionSpinner.stop();

      // Verificar se meta foi concluída
      if (result.celebration) {
        await CelebrationAnimation.show(result.goal, result.contribution);

        // Buscar próxima meta
        const allGoals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });
        if (allGoals.length > 0) {
          CelebrationAnimation.showNextGoalSuggestion(allGoals[0]);
        }
      } else {
        console.log(successMessage(`✅ ${typeText} registrado com sucesso!`));
        console.log('\n' + chalk.cyan.bold('📊 PROGRESSO ATUALIZADO:'));
        console.log(GoalProgressBar.renderDetailed(
          result.goal.currentAmount,
          result.goal.targetAmount,
          40
        ));
        console.log('');
      }

      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Edita uma meta
   */
  async showEdit() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `✏️ ${styles.bold('EDITAR META')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    try {
      // Listar metas ativas
      const spinner = ora('Carregando metas...').start();
      const goals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });
      spinner.stop();

      if (goals.length === 0) {
        console.log(chalk.yellow('\n   Nenhuma meta ativa para editar.\n'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Selecionar meta
      const goalChoices = goals.map(g => ({
        name: `${g.icon} ${g.name}`,
        value: g.id
      }));

      const goalId = await QuickMenu.select('Selecione a meta para editar:', goalChoices);
      const selectedGoal = goals.find(g => g.id === goalId);

      // Exibir meta atual
      console.log('\n' + chalk.cyan.bold('📋 META ATUAL:'));
      console.log(GoalCard.render(selectedGoal));
      console.log('');

      // Campos editáveis
      const updateData = {};

      // Nome
      if (await Input.confirm('Alterar nome?')) {
        updateData.name = await Input.text('Novo nome:', {
          default: selectedGoal.name,
          validate: (value) => value.trim().length >= 3 || 'Nome deve ter pelo menos 3 caracteres'
        });
      }

      // Valor objetivo
      if (await Input.confirm('Alterar valor objetivo?')) {
        updateData.targetAmount = await Input.number('Novo valor objetivo (R$):', {
          default: parseFloat(selectedGoal.target_amount),
          validate: (value) => value > 0 || 'Valor deve ser maior que zero'
        });
      }

      // Prazo
      if (await Input.confirm('Alterar prazo?')) {
        const removeDeadline = await Input.confirm('Remover prazo?');

        if (removeDeadline) {
          updateData.deadline = null;
        } else {
          updateData.deadline = await Input.date('Nova data limite (DD/MM/AAAA):');
        }
      }

      // Contribuição mensal
      if (await Input.confirm('Alterar contribuição mensal estimada?')) {
        const removeContribution = await Input.confirm('Remover contribuição mensal?');

        if (removeContribution) {
          updateData.monthlyContribution = null;
        } else {
          updateData.monthlyContribution = await Input.number('Nova contribuição mensal (R$):', {
            validate: (value) => value > 0 || 'Valor deve ser maior que zero'
          });
        }
      }

      // Confirmar
      if (Object.keys(updateData).length === 0) {
        console.log(warningMessage('Nenhuma alteração realizada.'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      const confirm = await Input.confirm('Confirmar alterações?');

      if (!confirm) {
        console.log(warningMessage('Edição cancelada.'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Atualizar meta
      const updateSpinner = ora('Atualizando meta...').start();
      await this.updateGoalUseCase.execute(goalId, updateData);
      updateSpinner.stop();

      console.log(successMessage('✅ Meta atualizada com sucesso!'));
      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Gerencia status da meta (concluir, cancelar, reativar)
   */
  async showManage() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `⚙️ ${styles.bold('GERENCIAR META')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    try {
      // Listar todas as metas
      const spinner = ora('Carregando metas...').start();
      const activeGoals = await this.listGoalsUseCase.execute(this.user.id, { status: 'active' });
      const completedGoals = await this.listGoalsUseCase.execute(this.user.id, { status: 'completed' });
      spinner.stop();

      const allGoals = [...activeGoals, ...completedGoals];

      if (allGoals.length === 0) {
        console.log(chalk.yellow('\n   Nenhuma meta encontrada.\n'));
        await Input.pause('\nPressione ENTER para continuar...');
        return;
      }

      // Selecionar meta
      const goalChoices = allGoals.map(g => ({
        name: `${g.icon} ${g.name} [${g.status}]`,
        value: g.id
      }));

      const goalId = await QuickMenu.select('Selecione a meta:', goalChoices);
      const selectedGoal = allGoals.find(g => g.id === goalId);

      // Menu de ações
      const actions = [];

      if (selectedGoal.status === 'active') {
        actions.push(
          { name: 'Marcar como Concluída', value: 'complete', icon: '✅', color: 'green' },
          { name: 'Cancelar Meta', value: 'cancel', icon: '❌', color: 'red' }
        );
      } else if (selectedGoal.status === 'completed') {
        actions.push(
          { name: 'Reativar Meta', value: 'reactivate', icon: '🔄', color: 'yellow' }
        );
      }

      actions.push(
        { name: 'Deletar Meta', value: 'delete', icon: '🗑️', color: 'red' },
        { name: 'Voltar', value: 'back', icon: '⬅️', color: 'gray' }
      );

      const action = await QuickMenu.selectWithIcons('Escolha uma ação:', actions);

      switch (action) {
      case 'complete':
        await this.completeGoal(goalId, 'completed');
        break;
      case 'cancel':
        await this.completeGoal(goalId, 'cancelled');
        break;
      case 'reactivate':
        await this.completeGoal(goalId, 'active');
        break;
      case 'delete':
        await this.deleteGoal(goalId);
        break;
      case 'back':
        return;
      }
    } catch (error) {
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Marca meta como concluída/cancelada/reativada
   */
  async completeGoal(goalId, newStatus) {
    const statusText = {
      completed: 'concluída',
      cancelled: 'cancelada',
      active: 'reativada'
    };

    const confirm = await Input.confirm(`Confirmar que deseja marcar a meta como ${statusText[newStatus]}?`);

    if (!confirm) {
      console.log(warningMessage('Operação cancelada.'));
      await Input.pause('\nPressione ENTER para continuar...');
      return;
    }

    const spinner = ora('Atualizando status...').start();

    try {
      await this.completeGoalUseCase.execute(goalId, newStatus, this.user.id);
      spinner.stop();

      console.log(successMessage(`✅ Meta ${statusText[newStatus]} com sucesso!`));
      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  /**
   * Deleta uma meta
   */
  async deleteGoal(goalId) {
    const confirm = await Input.confirm(
      chalk.red('⚠️ Deletar meta? Esta ação não pode ser desfeita!')
    );

    if (!confirm) {
      console.log(warningMessage('Exclusão cancelada.'));
      await Input.pause('\nPressione ENTER para continuar...');
      return;
    }

    const spinner = ora('Deletando meta...').start();

    try {
      await this.deleteGoalUseCase.execute(goalId, this.user.id);
      spinner.stop();

      console.log(successMessage('✅ Meta deletada com sucesso!'));
      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  /**
   * Exibe estatísticas das metas
   */
  async showStats() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `📈 ${styles.bold('ESTATÍSTICAS DAS METAS')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Calculando estatísticas...').start();

    try {
      const stats = await this.getGoalStatsUseCase.execute(this.user.id);
      spinner.stop();

      // Resumo geral
      console.log(chalk.cyan.bold('📊 RESUMO GERAL:'));
      console.log(chalk.white(`   → Total de metas: ${stats.totalGoals}`));
      console.log(chalk.green(`   → Metas ativas: ${stats.activeCount}`));
      console.log(chalk.greenBright(`   → Metas concluídas: ${stats.completedCount}`));
      console.log(chalk.red(`   → Metas canceladas: ${stats.cancelledCount}`));
      console.log(chalk.yellow(`   → Taxa de sucesso: ${stats.successRate}%`));
      console.log('');

      // Valores
      console.log(chalk.cyan.bold('💰 VALORES:'));
      console.log(chalk.green(`   → Total economizado: ${GoalProgressBar.formatCurrency(stats.totalSaved)}`));
      console.log(chalk.yellow(`   → Falta economizar: ${GoalProgressBar.formatCurrency(stats.totalRemaining)}`));
      console.log(chalk.blue(`   → Contribuições este mês: ${GoalProgressBar.formatCurrency(stats.thisMonthContributions)}`));
      console.log(chalk.cyan(`   → Média mensal: ${GoalProgressBar.formatCurrency(stats.monthlyAverage)}`));
      console.log('');

      // Meta mais próxima
      if (stats.closestGoal) {
        console.log(chalk.cyan.bold('🎯 META MAIS PRÓXIMA:'));
        const goalData = {
          ...stats.closestGoal,
          icon: '🏆',
          progress: stats.closestGoal.calculateProgress()
        };
        console.log(GoalCard.renderCompact(goalData));
        console.log('');
      }

      // Metas recentes concluídas
      if (stats.recentCompletedGoals && stats.recentCompletedGoals.length > 0) {
        console.log(chalk.cyan.bold('✅ METAS RECENTES CONCLUÍDAS:'));
        stats.recentCompletedGoals.forEach(goal => {
          console.log(GoalCard.renderCompletedSummary(goal));
          console.log('');
        });
      }

      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      spinner.stop();
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }

  /**
   * Exibe histórico de metas concluídas
   */
  async showHistory() {
    clearScreen();
    console.log('\n');
    console.log(createBox(
      `📜 ${styles.bold('HISTÓRICO DE METAS')}`,
      { borderColor: '#4ade80', padding: 1 }
    ));
    console.log('\n');

    const spinner = ora('Carregando histórico...').start();

    try {
      const completedGoals = await this.listGoalsUseCase.execute(this.user.id, { status: 'completed' });
      spinner.stop();

      if (completedGoals.length === 0) {
        console.log(chalk.yellow('\n   Nenhuma meta concluída ainda. Continue economizando!\n'));
      } else {
        console.log(chalk.green.bold(`✅ ${completedGoals.length} meta(s) concluída(s)\n`));

        completedGoals.forEach((goal, index) => {
          console.log(GoalCard.renderCompletedSummary(goal));
          if (index < completedGoals.length - 1) {
            console.log(chalk.gray('─'.repeat(60)));
          }
          console.log('');
        });
      }

      await Input.pause('\nPressione ENTER para continuar...');
    } catch (error) {
      spinner.stop();
      console.error(errorMessage(error.message));
      await Input.pause('\nPressione ENTER para continuar...');
    }
  }
}

export default GoalScreen;
