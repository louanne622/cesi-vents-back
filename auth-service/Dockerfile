FROM node:18
WORKDIR /auth-service
COPY package*.json ./
RUN npm install
COPY . .

# Créer le dossier uploads/profiles et définir les permissions
RUN mkdir -p uploads/profiles && \
    chmod -R 777 uploads

ENV MONGODB_URI_AUTH=mongodb://mongodb:27017/auth_db
ENV PORT_SERVICE_AUTH=3001
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3001
CMD ["node", "server.js"]
