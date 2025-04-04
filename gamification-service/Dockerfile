FROM node:18
WORKDIR /app
COPY . .
RUN npm install
ENV MONGODB_URI=mongodb://mongodb:27017/gamification_db
ENV PORT=3004
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 3004
CMD ["node", "server.js"]
