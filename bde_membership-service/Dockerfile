FROM node:18
WORKDIR /bde_membership-service
COPY package*.json ./
RUN npm install
COPY . .
ENV MONGODB_URI_BDE_MEMBERSHIP=mongodb://mongodb:27017/bde_membership_db
ENV PORT_SERVICE_BDE_MEMBERSHIP=3006
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3006
CMD ["node", "server.js"]
