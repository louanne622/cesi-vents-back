FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI=mongodb://mongodb:27017/ticket_db
ENV PORT_SERVICE_TICKET=5003
ENV AUTH_SERVICE_URL=http://auth-service:5001
ENV EVENT_SERVICE_URL=http://event-service:5002
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 5003
CMD ["node", "server.js"]
