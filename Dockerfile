# Use Node.js 21 (Latest with full support for your dependencies)
FROM node:21-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose API port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start:prod"] 