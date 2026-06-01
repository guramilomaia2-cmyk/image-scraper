FROM ghcr.io/puppeteer/puppeteer:21.9.0

# Switch to root to install dependencies or adjust permissions if needed
USER root

# Define working directory
WORKDIR /usr/src/app

# Copy package.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
