# Use Node.js LTS
FROM node:20-slim

# Instalar dependências do sistema necessárias para node-pty
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório da aplicação
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 3000

# Variável de ambiente para porta
ENV WEB_PORT=3000

# Comando para iniciar
CMD ["npm", "run", "start:web"]
