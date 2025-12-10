FROM node:20-alpine AS base

WORKDIR /app

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/patients?schema=public
ARG MAILTRAP_HOST=localhost
ARG MAILTRAP_PORT=2525
ARG MAILTRAP_USER=dummy
ARG MAILTRAP_PASS=dummy
ARG MAIL_FROM="Patient Registration <noreply@example.com>"

ENV DATABASE_URL=${DATABASE_URL} \
    MAILTRAP_HOST=${MAILTRAP_HOST} \
    MAILTRAP_PORT=${MAILTRAP_PORT} \
    MAILTRAP_USER=${MAILTRAP_USER} \
    MAILTRAP_PASS=${MAILTRAP_PASS} \
    MAIL_FROM=${MAIL_FROM}

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "run", "start"]
