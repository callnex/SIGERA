FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* .npmrc ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
