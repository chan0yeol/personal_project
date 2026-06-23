FROM node:20-alpine
ENV LANG=C.UTF-8 LC_ALL=C.UTF-8
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
EXPOSE 3100
CMD ["node", "src/index.js"]
