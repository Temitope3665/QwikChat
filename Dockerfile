# --- Stage 1: Backend Build ---
FROM rust:1.84-slim AS backend-builder
WORKDIR /app

# Install build dependencies for SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev pkg-config && rm -rf /var/lib/apt/lists/*

# Copy Cargo files to cache dependencies
COPY Cargo.toml Cargo.lock ./
# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy backend source and build the actual binary
COPY src ./src
COPY migrations ./migrations
COPY diesel.toml ./diesel.toml
RUN cargo build --release

# --- Stage 2: Final Runtime ---
FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libsqlite3-0 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from the backend-builder
COPY --from=backend-builder /app/target/release/rust-next-chat /app/chat-server

# Create data directory for the volume
RUN mkdir -p /data

# Set environment variable for the database location
ENV DATABASE_URL=/data/chat.db

# Expose the port used by the Actix server
EXPOSE 8080

# Run the backend server
CMD ["/app/chat-server"]
