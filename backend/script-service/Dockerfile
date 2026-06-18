FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY backend ./backend
COPY contracts ./contracts
COPY ai ./ai
RUN npm install
RUN npx prisma generate
EXPOSE 3002
CMD ["npx", "ts-node", "backend/script-service/src/main.ts"]
