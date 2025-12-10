FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200"]
