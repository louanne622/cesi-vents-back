FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI_CLUB=mongodb://mongodb:27017/clubs_db
ENV PORT=5005
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 5005
CMD ["node", "server.js"]
