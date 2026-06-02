FROM node:22-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instalar TODAS las deps (incluidas dev) para poder compilar TypeScript
RUN npm install --include=dev

COPY . .

RUN npx prisma generate
RUN npm run build

# Verificar que el build produjo dist/main.js
RUN ls dist/main.js

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
