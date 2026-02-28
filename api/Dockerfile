FROM node:20-alpine

WORKDIR /app/api

COPY api/package.json api/package-lock.json* ./
RUN npm install

COPY api/ ./

EXPOSE 4000

CMD ["npm", "run", "dev"]
