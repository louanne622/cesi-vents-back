FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV MONGODB_URI=mongodb://mongodb:27017/promotion_db
ENV PORT=5007
ENV JWT_SECRET=cesi_vents_backend_2025
EXPOSE 5007

CMD ["node", "server.js"]
