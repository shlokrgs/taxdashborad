# frontend/Dockerfile

FROM node:20

WORKDIR /app

# Copy only necessary files (not from frontend/ but from current dir)
COPY package*.json ./

RUN npm install

# Now copy everything else
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
