# Use an official Node.js runtime as a parent image (choose a suitable version)
# Alpine versions are smaller
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first
# This leverages Docker's layer caching. If these files don't change,
# Docker won't re-run npm install in subsequent builds.
COPY package*.json ./
# COPY yarn.lock ./ # Uncomment if using yarn

# Install app dependencies
# Use 'npm ci' for cleaner installs in CI/CD environments, it requires a package-lock.json
# RUN npm ci --only=production # Example for production build
RUN npm install
# RUN yarn install --frozen-lockfile # Uncomment if using yarn

# Bundle app source inside Docker image
COPY . .

# Make port ${PORT} available to the world outside this container
# The actual port mapping happens in docker-compose.yml
# Use ARG to get PORT from build-time or default
ARG PORT=3001
EXPOSE ${PORT}

# Define environment variable default (can be overridden by docker-compose)
ENV NODE_ENV=development

# Command to run the application
# Use nodemon for development to auto-restart on file changes
# Make sure nodemon is installed: npm install --save-dev nodemon
# Adjust the command based on your package.json scripts or entry file
CMD ["npm", "run", "dev"]
# Use "node server.js" or "npm start" for production
# CMD [ "node", "server.js" ]