# ===================================================
# Estágio 1: Builder (Instalação, Lint e Preparação)
# ===================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
# Instala todas as dependências (incluindo dev para testes e lint)
RUN npm ci

COPY . .

# Executa linting e validação estática no estágio de build
RUN npx eslint src/ --ext .js

# Remove dependências de desenvolvimento para manter o bundle enxuto
RUN npm prune --omit=dev && npm cache clean --force

# ===================================================
# Estágio 2: Runner de Produção (Enxuto e Seguro)
# ===================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Garante permissões adequadas para o usuário não-root 'node' antes de trocar o usuário
RUN chown node:node /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Execução segura com usuário não-privilegiado 'node'
USER node

# Copia os node_modules já preparados diretamente do estágio builder
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

EXPOSE 3000

# Verificação interna de integridade do container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
