# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Create non-root user 'tidepool'
RUN addgroup -S tidepool && adduser -S tidepool -G tidepool

# Copy build artifacts and server entrypoint
COPY --from=build /app/build ./build
COPY --from=build /app/server.mjs ./server.mjs
COPY --from=build /app/package*.json ./

# Install production-only dependencies from lockfile
RUN npm ci --omit=dev

# Expose port
EXPOSE 3000

# Switch to non-root user
USER tidepool

# Run the server
CMD ["node", "server.mjs"]
