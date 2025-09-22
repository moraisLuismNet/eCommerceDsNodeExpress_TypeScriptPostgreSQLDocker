#!/bin/sh

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -U postgres; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 1
done

# Run the initialization script
echo "Running initialization script..."
psql -U postgres -d eCommerceDs -f /docker-entrypoint-initdb.d/01-init.sql

echo "Database initialized successfully"
