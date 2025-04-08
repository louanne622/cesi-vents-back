FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV MONGODB_URI=mongodb://mongodb:27017/gateway_db
ENV PORT=5000
ENV FRONTEND_URL=http://localhost:3000
ENV JWT_SECRET=cesi_vents_backend_2025
ENV COOKIE_DOMAIN=localhost

EXPOSE 5000
CMD ["node", "server.js"]
