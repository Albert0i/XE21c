
# --- Stage 1: Build & Dependencies ---
FROM node:24-slim AS builder

# Install unzip to extract local archives
RUN apt-get update && apt-get install -y --no-install-recommends \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create and switch to target directory for Oracle Instant Client
WORKDIR /opt/oracle

# Explicitly copy all zip files from host ./tool into the current working directory
COPY ./tool/*.zip ./

# Force overwrite (-o) to avoid interactive prompts due to META-INF file collisions
RUN unzip -o "*.zip" && rm *.zip

WORKDIR /app

# Copy dependency manifests first for efficient layer caching
COPY package*.json ./
RUN npm ci

# Copy the source code folder from host context ./src to image /app/src
COPY ./src ./src


# --- Stage 2: Production Runtime ---
FROM node:24-slim

# Install libaio1 runtime dependency required by the Oracle binary engines
RUN apt-get update && apt-get install -y --no-install-recommends \
    libaio1 \
    && rm -rf /var/lib/apt/lists/*

# Copy the pre-extracted Oracle Instant Client assets from the builder stage
COPY --from=builder /opt/oracle /opt/oracle

# Configure required environment paths cleanly without triggering warnings
ENV LD_LIBRARY_PATH=/opt/oracle/instantclient_23_26
ENV PATH=/opt/oracle/instantclient_23_26:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

WORKDIR /app

# Copy production node_modules and code assets from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose internal application port
EXPOSE 3000

# Set Node environment flag to production
ENV NODE_ENV=production

# Application runtime entry point
CMD ["node", "src/api.js"]

#
# docker build -t albert0i/oracle-db-api-gateway:1.0 -f Dockerfile .
#
