# Stage 1: Build the Angular application
FROM node:18-alpine AS build
WORKDIR /app

# Copy dependency manifests and install
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Clear out the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy your compiled Angular app from Stage 1 into Nginx
# NOTE: Angular usually outputs to dist/<project-name>. 
# If your app outputs to 'dist/fluxus/browser' or just 'dist', update the path below accordingly.
COPY --from=build /app/dist/fluxus /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]