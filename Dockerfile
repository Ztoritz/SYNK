# --- Stage 1: Build Application ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Install dependencies (optimized caching)
COPY package.json ./
# If you have package-lock.json, uncomment the next line and allow npm ci
# COPY package-lock.json ./ 
RUN npm install 

# 2. Copy source code and build
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# 1. Copy build output from Stage 1 to Nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. Copy custom Nginx configuration (for React routing support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Expose port 80
EXPOSE 80

# 4. Start Nginx
CMD ["nginx", "-g", "daemon off;"]
