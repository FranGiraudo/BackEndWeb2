FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm install --include=dev

COPY . .

RUN npx prisma generate

# Compilar TypeScript directamente sin nest CLI
RUN node_modules/.bin/tsc -p tsconfig.build.json

RUN ls dist/main.js || ls dist/src/main.js

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
