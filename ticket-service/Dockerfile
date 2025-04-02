FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI=mongodb://mongodb:27017/ticket_db
ENV PORT_SERVICE_TICKET=3003
ENV EVENT_SERVICE_URL=http://event-service:3002
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3003
CMD ["node", "server.js"]
