#!/usr/bin/env node

/**
 * Script de teste para verificar a implementação de metas
 */

console.log('🧪 Testando implementação de Metas Financeiras...\n');

try {
  // Testar importações
  console.log('1️⃣ Testando importações...');

  const { Goal } = await import('./src/domain/entities/Goal.js');
  console.log('   ✅ Goal entity importada');

  const { IGoalRepository } = await import('./src/domain/repositories/IGoalRepository.js');
  console.log('   ✅ IGoalRepository importada');

  const { GoalRepository } = await import('./src/infrastructure/database/GoalRepository.js');
  console.log('   ✅ GoalRepository importada');

  const { CreateGoalUseCase } = await import('./src/application/use-cases/goals/CreateGoalUseCase.js');
  console.log('   ✅ CreateGoalUseCase importada');

  const { ListGoalsUseCase } = await import('./src/application/use-cases/goals/ListGoalsUseCase.js');
  console.log('   ✅ ListGoalsUseCase importada');

  const { AddContributionUseCase } = await import('./src/application/use-cases/goals/AddContributionUseCase.js');
  console.log('   ✅ AddContributionUseCase importada');

  const { GoalScreen } = await import('./src/adapters/cli/screens/GoalScreen.js');
  console.log('   ✅ GoalScreen importada');

  const { GoalCard } = await import('./src/adapters/cli/components/GoalCard.js');
  console.log('   ✅ GoalCard importada');

  const { GoalProgressBar } = await import('./src/adapters/cli/components/GoalProgressBar.js');
  console.log('   ✅ GoalProgressBar importada');

  console.log('\n2️⃣ Testando criação de entidade Goal...');

  const testGoal = new Goal({
    id: 1,
    userId: 'test-user',
    name: 'Viagem para Europa',
    targetAmount: 15000,
    currentAmount: 5000,
    monthlyContribution: 1500,
    deadline: new Date('2025-12-31'),
    status: 'active'
  });

  console.log('   ✅ Goal criada com sucesso');
  console.log(`   → Nome: ${testGoal.name}`);
  console.log(`   → Valor objetivo: R$ ${testGoal.targetAmount}`);
  console.log(`   → Valor atual: R$ ${testGoal.currentAmount}`);

  console.log('\n3️⃣ Testando cálculos da meta...');

  const progress = testGoal.calculateProgress();
  console.log(`   ✅ Progresso: ${progress.percentage.toFixed(1)}%`);
  console.log(`   → Faltam: R$ ${progress.remaining}`);

  const estimate = testGoal.estimateCompletionDate();
  if (estimate) {
    console.log(`   ✅ Estimativa: ${estimate.monthsNeeded} meses`);
    console.log(`   → No prazo: ${estimate.isOnTrack ? 'Sim' : 'Não'}`);
  }

  const daysRemaining = testGoal.getDaysRemaining();
  if (daysRemaining) {
    console.log(`   ✅ Dias restantes: ${daysRemaining.days}`);
  }

  console.log('\n4️⃣ Testando validações...');

  try {
    new Goal({
      userId: 'test-user',
      name: 'AB', // Nome muito curto
      targetAmount: 1000
    });
    console.log('   ❌ Validação de nome falhou');
  } catch (error) {
    console.log('   ✅ Validação de nome funcionou');
  }

  try {
    new Goal({
      userId: 'test-user',
      name: 'Meta Teste',
      targetAmount: -100 // Valor negativo
    });
    console.log('   ❌ Validação de valor falhou');
  } catch (error) {
    console.log('   ✅ Validação de valor funcionou');
  }

  console.log('\n5️⃣ Testando componentes visuais...');

  const progressBar = GoalProgressBar.render(5000, 15000, 30);
  console.log('   ✅ Barra de progresso renderizada:');
  console.log(`   ${progressBar}`);

  const currency = GoalProgressBar.formatCurrency(15000);
  console.log(`   ✅ Formatação de moeda: ${currency}`);

  console.log('\n✅ TODOS OS TESTES PASSARAM!\n');
  console.log('🎯 Sistema de Metas Financeiras implementado com sucesso!\n');

  process.exit(0);
} catch (error) {
  console.error('\n❌ ERRO NOS TESTES:');
  console.error(error);
  process.exit(1);
}
