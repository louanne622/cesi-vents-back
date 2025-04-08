FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI_BDE_MEMBERSHIP=mongodb://mongodb:27017/bde_membership_db
ENV PORT_SERVICE_BDE_MEMBERSHIP=5006
ENV AUTH_SERVICE_URL=http://auth-service:5000
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 5006
CMD ["node", "server.js"]
