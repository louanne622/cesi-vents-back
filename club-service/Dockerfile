FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI_CLUB=mongodb://mongodb:27017/club_db
ENV PORT_SERVICE_CLUB=3002
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3002
CMD ["node", "server.js"]
