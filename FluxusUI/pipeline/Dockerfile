# Stage 1: Build the Angular application
FROM node:16-alpine as build

WORKDIR /app

# Copy the package.json and package-lock.json files
RUN cd ../
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application source code
COPY . .

# Build the Angular application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy the build output from Stage 1
COPY --from=build /app/dist/ /usr/share/nginx/html

# Copy custom nginx configuration (if needed)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default port for serving the application
EXPOSE 81

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
