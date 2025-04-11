FROM node:18
WORKDIR /auth-service
COPY package*.json ./
RUN npm install
COPY . .

# Créer le dossier uploads/profiles et définir les permissions
RUN mkdir -p uploads/profiles && \
    chmod -R 777 uploads

ENV MONGODB_URI_AUTH=mongodb://mongodb:27017/auth_db
ENV PORT_SERVICE_AUTH=5001
ENV JWT_ACCESS_SECRET=cesi_vents_access_token
ENV JWT_REFRESH_SECRET=cesi_vents_refresh_token
ENV FRONTEND_URL=http://localhost:3000
EXPOSE 5001
CMD ["node", "server.js"]
