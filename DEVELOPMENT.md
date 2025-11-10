# 🛠️ Guia de Desenvolvimento

Este documento contém informações técnicas para desenvolvedores que desejam contribuir ou entender a estrutura do projeto.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Arquitetura](#arquitetura)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Build](#build)
- [Contribuindo](#contribuindo)

## 🔧 Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- NeonDB Account (PostgreSQL serverless)
- Git

## 📦 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd gestaofinanceira

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do NeonDB

# Execute o setup interativo
npm run setup
```

## 🏗️ Arquitetura

O projeto segue os princípios da **Clean Architecture** (Arquitetura Limpa), dividida em 4 camadas:

### 1. Domain Layer (Domínio)
**Localização:** `src/domain/`

Contém as entidades e regras de negócio puras, independentes de frameworks ou bibliotecas externas.

```
src/domain/
├── entities/           # Entidades do domínio (User, Transaction, Budget, Goal, etc.)
└── repositories/       # Interfaces dos repositórios (IUserRepository, etc.)
```

**Princípios:**
- Sem dependências externas
- Lógica de negócio pura
- Validações de domínio

### 2. Application Layer (Aplicação)
**Localização:** `src/application/`

Orquestra a lógica de negócio através de casos de uso (Use Cases).

```
src/application/
├── use-cases/          # Casos de uso da aplicação
│   ├── transactions/
│   ├── budgets/
│   ├── goals/
│   ├── reports/
│   └── exports/
└── interfaces/         # Interfaces de serviços (IAuthService, etc.)
```

**Princípios:**
- Um Use Case = Uma funcionalidade
- Coordena entidades e repositórios
- Sem detalhes de implementação

### 3. Infrastructure Layer (Infraestrutura)
**Localização:** `src/infrastructure/`

Implementações concretas de repositórios, banco de dados e serviços externos.

```
src/infrastructure/
├── database/           # Conexão e repositórios do NeonDB
│   ├── NeonDatabase.js
│   ├── UserRepository.js
│   ├── TransactionRepository.js
│   └── ...
├── auth/              # Implementação de autenticação
│   └── NeonAuthService.js
└── services/          # Serviços externos
    └── PDFExportService.js
```

**Princípios:**
- Implementa interfaces do domínio
- Acesso ao banco de dados
- Integrações externas

### 4. Adapters Layer (Adaptadores)
**Localização:** `src/adapters/`

Interface com o usuário (CLI e Web).

```
src/adapters/
└── cli/
    ├── screens/        # Telas do terminal
    ├── components/     # Componentes reutilizáveis
    └── utils/          # Utilitários de UI
```

**Princípios:**
- Entrada e saída do sistema
- Sem lógica de negócio
- Apenas apresentação

## 📜 Scripts Disponíveis

### Desenvolvimento

```bash
# Inicia o terminal (versão CLI)
npm start

# Inicia o terminal com auto-reload
npm run dev

# Inicia a versão web (browser)
npm run start:web

# Inicia a versão web com auto-reload
npm run dev:web

# Setup inicial interativo
npm run setup
```

### Qualidade de Código

```bash
# Executar ESLint
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Verificar sintaxe de todos os arquivos
npm run check

# Build completo (lint + check + validações)
npm run build
```

### Testes

```bash
# Executar todos os testes
npm test

# Executar testes com watch mode
npm run test:watch
```

## 🎨 Padrões de Código

### ESLint

O projeto usa ESLint com as seguintes regras principais:

- **Indentação:** 2 espaços
- **Quotes:** Single quotes (')
- **Semicolons:** Obrigatório
- **Arrow Spacing:** Obrigatório
- **No Console:** Permitido (CLI app)

### Convenções de Nomenclatura

**Arquivos:**
- Classes: `PascalCase.js` (Ex: `UserRepository.js`)
- Use Cases: `PascalCaseUseCase.js` (Ex: `CreateTransactionUseCase.js`)
- Screens: `PascalCaseScreen.js` (Ex: `DashboardScreen.js`)
- Utils: `camelCase.js` (Ex: `colors.js`)

**Código:**
- Classes: `PascalCase`
- Funções/Métodos: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Variáveis: `camelCase`
- Private methods: `_camelCase` (prefixo _)

### Estrutura de Use Case

```javascript
export class ExampleUseCase {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(params) {
    // 1. Validação
    if (!params.id) {
      return { success: false, errors: ['ID obrigatório'] };
    }

    // 2. Lógica de negócio
    const result = await this.repository.doSomething(params);

    // 3. Retorno padronizado
    return {
      success: true,
      data: result
    };
  }
}
```

### Estrutura de Entity

```javascript
export class Example {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt || new Date();
  }

  // Validações
  validate() {
    const errors = [];

    if (!this.name) {
      errors.push('Nome é obrigatório');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Métodos de negócio
  calculateSomething() {
    // ...
  }
}
```

## 🧪 Testes

### Estrutura de Testes

```
test/
├── unit/              # Testes unitários
├── integration/       # Testes de integração
└── e2e/              # Testes end-to-end
```

### Exemplo de Teste

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Transaction } from '../src/domain/entities/Transaction.js';

describe('Transaction Entity', () => {
  it('should create a valid transaction', () => {
    const transaction = new Transaction({
      type: 'income',
      amount: 100,
      description: 'Test'
    });

    assert.strictEqual(transaction.type, 'income');
    assert.strictEqual(transaction.amount, 100);
  });

  it('should validate required fields', () => {
    const transaction = new Transaction({});
    const { isValid, errors } = transaction.validate();

    assert.strictEqual(isValid, false);
    assert.ok(errors.length > 0);
  });
});
```

## 🔨 Build

O processo de build executa:

1. **ESLint:** Verifica qualidade do código
2. **Syntax Check:** Valida sintaxe de todos os arquivos
3. **Structure Check:** Verifica estrutura Clean Architecture
4. **Dependencies Check:** Valida dependências instaladas

```bash
npm run build
```

**Saída esperada:**
```
✅ Lint passou
✅ Todos os arquivos estão sintaticamente corretos
✅ Estrutura Clean Architecture OK
✅ Dependências verificadas
✨ Build concluído com sucesso!
📦 Projeto pronto para produção
```

## 🤝 Contribuindo

### Workflow de Contribuição

1. **Fork** o repositório
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Checklist antes do PR

- [ ] Código segue os padrões do ESLint
- [ ] `npm run lint` passa sem erros
- [ ] `npm run check` passa sem erros
- [ ] `npm run build` passa com sucesso
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada (se necessário)
- [ ] README.md atualizado (se necessário)

### Commit Messages

Seguimos o padrão **Conventional Commits**:

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona/atualiza testes
chore: atualiza dependências/configs
```

**Exemplos:**
```
feat: adiciona exportação de relatórios em PDF
fix: corrige cálculo de saldo mensal
docs: atualiza guia de instalação
refactor: melhora performance do dashboard
```

## 🔍 Debugging

### VS Code

Adicione ao `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/src/index.js",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Terminal

```bash
node --inspect src/index.js
# Abra chrome://inspect no navegador
```

## 📚 Recursos Úteis

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [ESLint Docs](https://eslint.org/docs/latest/)
- [NeonDB Docs](https://neon.tech/docs/introduction)

## 📞 Suporte

- Issues: [GitHub Issues](https://github.com/seu-repo/issues)
- Discussões: [GitHub Discussions](https://github.com/seu-repo/discussions)

---

**Desenvolvido com ❤️ usando Node.js e NeonDB**
