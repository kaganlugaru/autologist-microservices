# Dockerfile для backend на Render
FROM node:18
WORKDIR /app
COPY . /app
RUN npm install
RUN apt-get update && apt-get install -y python3 python3-pip
RUN pip3 install -r requirements.txt
CMD ["node", "server.js"]
