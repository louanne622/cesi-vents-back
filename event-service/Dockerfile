FROM node:18
WORKDIR /event-service
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI=mongodb://mongodb:27017/event_db
ENV PORT=3003
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3003
CMD ["node", "server.js"]
