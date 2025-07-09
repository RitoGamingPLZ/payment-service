FROM node:22-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY --chown=nodejs:nodejs . .

RUN npx prisma generate

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]