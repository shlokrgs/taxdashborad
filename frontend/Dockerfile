# Dockerfile inside frontend/
FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY public ./public
COPY src ./src
COPY tailwind.config.js .
COPY index.css .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
