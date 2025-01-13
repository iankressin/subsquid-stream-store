FROM node:20-slim

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

# COPY ./src ./src
# COPY ./package.json ./package.json
# COPY ./package-lock.json ./package-lock.json
# COPY ./tsconfig.json ./tsconfig.json

# Add this before npm install to debug
RUN ls -la
RUN ls -la stream-store
RUN cat package.json

RUN npm install

RUN npm run build

CMD ["npm", "run", "start:producer"]