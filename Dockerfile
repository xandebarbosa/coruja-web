# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
# Adiciona biblioteca necessária para alguns pacotes nativos
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia apenas os arquivos de dependência para aproveitar o cache do Docker
COPY package.json package-lock.json ./
RUN npm ci

# Estágio 2: Construção (Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita a telemetria do Next.js (boa prática em CI/CD e Docker)
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build da aplicação
RUN npm run build

# Estágio 3: Imagem de Produção (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um usuário não-root por questões de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos necessários do estágio de build
COPY --from=builder /app/public ./public
# Copia a pasta standalone gerada pelo build otimizado
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Define o usuário criado
USER nextjs

# Expõe a porta que a aplicação vai utilizar
EXPOSE 3009
ENV PORT 3009
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação
CMD ["node", "server.js"]