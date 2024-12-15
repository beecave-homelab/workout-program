# Use Node.js 23.3.0 as the base image
FROM node:23.3.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the Next.js application
RUN if [ "$NODE_ENV" = "production" ]; then npm run build; fi

# Expose ports for Next.js and API server
EXPOSE 3001 5001

# Start both Next.js and API server
CMD ["sh", "-c", "node server.js & if [ \"$NODE_ENV\" = \"production\" ]; then npm start; else npm run dev; fi"]
