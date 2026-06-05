# Estágio 1: Instalação de dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json ./
RUN npm ci

# Estágio 2: Construção (Build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita a telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Executa o build da aplicação (o arquivo .env será lido aqui para as variáveis NEXT_PUBLIC_)
RUN npm run build

# Estágio 3: Imagem de Produção (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria um usuário não-root por questões de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos estáticos e a pasta standalone gerada pelo build
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Define o usuário criado
USER nextjs

# Expõe a porta que a aplicação vai utilizar
EXPOSE 3009
ENV PORT 3009
ENV HOSTNAME "0.0.0.0"

# Comando para iniciar a aplicação standalone
CMD ["node", "server.js"]