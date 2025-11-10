# 💰 Sistema de Gestão Financeira Pessoal

Sistema de gestão financeira pessoal com interface de terminal elegante, colorida e interativa.

## 🚀 Características

- ✨ Interface de terminal bonita e colorida
- ⚡ **Navegação INSTANTÂNEA por números (1-9)** - sem precisar pressionar ENTER!
- 🌐 **Versão Web idêntica** ao terminal - mesmo código, acesso via browser
- 🔐 Sistema de autenticação seguro com bcrypt
- 📊 Gestão de receitas e despesas
- 📂 **Sistema completo de categorias** com 45 categorias pré-cadastradas
- 🌳 **Subcategorias** (hierarquia de 1 nível)
- ✏️ **CRUD completo** de categorias personalizadas
- 💾 Armazenamento no NeonDB (PostgreSQL)
- 🏗️ Arquitetura Clean Architecture com adapters
- 🎨 Terminal-Kit para UI avançada

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **NeonDB** - Banco de dados PostgreSQL serverless
- **bcryptjs** - Hash seguro de senhas
- **Terminal-Kit** - Navegação numérica instantânea e UI avançada
- **Inquirer** - Formulários interativos
- **xterm.js** - Emulador de terminal no browser
- **Socket.io** - WebSocket para versão web
- **node-pty** - Pseudo-terminal para web
- **Chalk** - Cores no terminal
- **Figlet** - ASCII art
- **Boxen** - Caixas decorativas

## 📁 Estrutura do Projeto

```
gestaofinanceira/
├── src/
│   ├── domain/              # Entidades e regras de negócio
│   │   ├── entities/
│   │   │   └── User.js
│   │   └── repositories/
│   │       └── IUserRepository.js
│   ├── application/         # Casos de uso
│   │   ├── use-cases/
│   │   │   ├── RegisterUserUseCase.js
│   │   │   └── LoginUserUseCase.js
│   │   └── interfaces/
│   │       └── IAuthService.js
│   ├── infrastructure/      # Implementações
│   │   ├── database/
│   │   │   ├── NeonDatabase.js
│   │   │   └── UserRepository.js
│   │   └── auth/
│   │       └── NeonAuthService.js
│   ├── adapters/           # 🆕 Camada de adaptadores (Clean Architecture)
│   │   └── cli/            # Interface CLI
│   │       ├── screens/
│   │       │   ├── AuthScreen.js
│   │       │   └── MainScreen.js
│   │       ├── components/
│   │       │   ├── Input.js
│   │       │   └── QuickMenu.js  # 🆕 Navegação numérica
│   │       └── utils/
│   │           ├── colors.js
│   │           └── banner.js
│   └── index.js            # Arquivo principal CLI
├── public/                 # 🆕 Arquivos web
│   └── terminal.html       # Interface web (xterm.js)
├── server-web.js           # 🆕 Servidor web (Socket.io + node-pty)
├── scripts/
│   └── setup.js
├── .env.example
├── package.json
└── README.md
```

## 🎯 Instalação

### 1. Clone o repositório (ou use o diretório atual)

```bash
cd gestaofinanceira
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Você pode usar o script de setup interativo:

```bash
npm run setup
```

Ou copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp .env.example .env
```

**Obtenha sua Connection String do NeonDB:**
1. Acesse https://console.neon.tech/
2. Selecione o projeto "financas"
3. Copie a Connection String
4. Cole no arquivo `.env`

### 4. Inicie a aplicação

#### 🖥️ **Versão Terminal (local):**
```bash
npm start
```

Ou com auto-reload:
```bash
npm run dev
```

#### 🌐 **Versão Web (browser):**
```bash
npm run start:web
```

Depois acesse: **http://localhost:3000**

Ou com auto-reload:
```bash
npm run dev:web
```

> **💡 Dica:** As duas versões são IDÊNTICAS! A versão web emula o terminal no navegador usando xterm.js

## 📖 Como Usar

### Primeiro Acesso

1. Execute `npm start` (terminal) ou `npm run start:web` (browser)
2. **Pressione 2** para "Criar Nova Conta" ⚡ (INSTANTÂNEO!)
3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirmação de senha
4. Sua conta será criada e você será automaticamente logado

### Login

1. Execute `npm start` (terminal) ou `npm run start:web` (browser)
2. **Pressione 1** para "Fazer Login" ⚡ (INSTANTÂNEO!)
3. Insira seu email e senha
4. Você será direcionado ao menu principal

### 🎮 Navegação

#### **Menus Numéricos (NOVO!):**
- **Pressione o NÚMERO (1-9)** da opção desejada
- ⚡ **Ação INSTANTÂNEA** - sem pressionar ENTER!
- Exemplo: Menu principal → Pressiona **1** → Entra direto em "Nova Receita"

#### **Formulários:**
- Use **ENTER** para confirmar inputs
- Use **TAB** para alternar entre campos
- Use **setas (↑/↓)** em listas tradicionais

#### **Atalhos:**
- **CTRL+C** - Sair a qualquer momento
- **ESC** - Voltar (quando disponível)

### 🌐 Versão Web

A versão web funciona **exatamente igual** ao terminal:
1. Abra **http://localhost:3000** no navegador
2. Use o terminal emulado normalmente
3. **Pressione números (1-9)** para navegar
4. Funciona em desktop, tablet e mobile!

### 📂 Gerenciamento de Categorias

O sistema inclui **45 categorias pré-cadastradas** organizadas em:

**💸 Despesas (10 categorias principais):**
- 🍔 Alimentação (5 subcategorias: Supermercado, Restaurante, Delivery, Lanchonete, Padaria)
- 🚗 Transporte (5 subcategorias: Combustível, Manutenção, Público, Uber/Táxi, Estacionamento)
- 🏠 Moradia (7 subcategorias: Aluguel, Condomínio, IPTU, Energia, Água, Internet, Gás)
- 💳 Contas e Serviços (5 subcategorias: Telefone, TV, Streaming, Seguros, Impostos)
- 👕 Vestuário (3 subcategorias: Roupas, Calçados, Acessórios)
- 🏥 Saúde (5 subcategorias: Plano, Medicamentos, Consultas, Exames, Academia)
- 🎓 Educação (4 subcategorias: Mensalidade, Cursos, Livros, Material)
- 🎮 Lazer (5 subcategorias: Cinema, Shows, Viagens, Hobbies, Games)
- 👨‍👩‍👧 Família (3 subcategorias: Presentes, Pets, Creche)
- 🔧 Manutenção (3 subcategorias: Casa, Eletrônicos, Móveis)

**💰 Receitas (5 categorias principais):**
- 💰 Salário (4 subcategorias: Fixo, Bônus, 13º, Comissão)
- 💼 Freelance (2 subcategorias: Projetos, Consultorias)
- 📈 Investimentos (3 subcategorias: Dividendos, Juros, Rendimentos)
- 🏪 Negócio Próprio (2 subcategorias: Vendas, Serviços)
- 🎁 Outros (3 subcategorias: Presentes recebidos, Reembolsos, Prêmios)

**Você também pode:**
- ➕ Criar suas próprias categorias e subcategorias
- ✏️ Editar categorias personalizadas (nome, ícone, cor)
- 🗑️ Deletar categorias (com validação de transações vinculadas)
- 📋 Listar todas as categorias organizadas em hierarquia

**Observações:**
- Categorias padrão **não podem ser editadas ou deletadas**
- Subcategorias são limitadas a **1 nível** de profundidade
- Categorias globais são compartilhadas por todos os usuários

## 🏗️ Arquitetura Clean Architecture

O projeto segue os princípios da Clean Architecture:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Utils)           │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│        Application Layer                │
│     (Use Cases, Interfaces)             │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Domain Layer                   │
│    (Entities, Repositories)             │
└─────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Infrastructure Layer               │
│   (Database, Auth, External Services)   │
└─────────────────────────────────────────┘
```

### Camadas:

- **Domain**: Entidades e interfaces de repositórios (regras de negócio puras)
- **Application**: Casos de uso que orquestram a lógica de negócio
- **Infrastructure**: Implementações concretas (banco de dados, autenticação)
- **Presentation**: Interface do usuário (telas e componentes do terminal)

## 🔒 Segurança

- Senhas são validadas (mínimo 6 caracteres)
- Hash seguro de senhas com bcrypt (10 rounds)
- Emails são validados com regex
- Conexão SSL com o NeonDB
- Senhas nunca são armazenadas em texto puro

## 📝 Próximas Funcionalidades

- [ ] Adicionar receitas
- [ ] Adicionar despesas
- [ ] Visualizar transações
- [ ] Relatórios financeiros
- [ ] Filtros e busca
- [ ] Exportação de dados
- [ ] Dashboard com gráficos
- [ ] Orçamentos por categoria
- [ ] Metas financeiras

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

ISC

## 👨‍💻 Autor

Desenvolvido com ❤️ usando Node.js e NeonDB
# financascli
