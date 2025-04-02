FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI=mongodb://mongodb:27017/auth_db
ENV PORT=3001
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3001
CMD ["node", "server.js"]
