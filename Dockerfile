# Build Stage
FROM node:20-slim AS builder

WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install --legacy-peer-deps

COPY src/ ./src

RUN npm run build

# Production Stage
FROM node:20-slim AS runner

WORKDIR /app

# Install system dependencies for Puppeteer (Chromium)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome Stable to ensure all sandbox/rendering requirements are met
RUN apt-get update && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variable to use the installed Google Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

COPY package*.json ./

RUN npm install --only=production --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
