FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev 2>/dev/null || true
COPY server.js .
RUN mkdir -p public
COPY index.html public/
EXPOSE 8380
CMD ["node", "server.js"]
