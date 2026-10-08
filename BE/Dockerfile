FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY db ./db
USER node
EXPOSE 4000
CMD ["node", "src/index.js"]
