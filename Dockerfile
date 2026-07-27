FROM node:22-alpine AS build

WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma ./prisma
COPY backend/shared ./backend/shared
COPY contracts ./contracts
COPY ai ./ai
COPY libs ./libs
COPY services ./services
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache openssl ffmpeg
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

ARG SERVICE=api-gateway
ENV SERVICE=${SERVICE}
CMD ["sh", "-c", "node dist/services/${SERVICE}/src/main.js"]
