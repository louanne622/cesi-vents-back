FROM node:18
WORKDIR /event-service
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI=mongodb://mongodb:27017/event_db
ENV PORT=5002
ENV AUTH_SERVICE_URL=http://auth-service:5002
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 5002
CMD ["node", "server.js"]
