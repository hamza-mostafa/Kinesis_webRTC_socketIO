FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node","src/server.js"]
