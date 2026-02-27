# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files for layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Angular app for production (SSR)
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Railway uses PORT env variable
ENV PORT=4000

EXPOSE ${PORT}

# Start the SSR server
CMD ["node", "dist/frontend/server/server.mjs"]
