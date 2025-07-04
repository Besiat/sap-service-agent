#!/bin/bash
set -e

echo "Setting up tenant databases..."

# Wait for PostgreSQL to be ready
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USERNAME; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "PostgreSQL is ready!"

# Get tenant IDs from environment variable
if [ -z "$TENANT_IDS" ]; then
  echo "TENANT_IDS not set, using default tenant IDs"
  TENANT_IDS="550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001"
fi

# Convert comma-separated string to array
IFS=',' read -ra TENANT_ID_ARRAY <<< "$TENANT_IDS"

for TENANT_ID in "${TENANT_ID_ARRAY[@]}"; do
  # Trim whitespace
  TENANT_ID=$(echo "$TENANT_ID" | xargs)
  DB_NAME="sap_service_agent_${TENANT_ID}"
  
  echo "Creating database for tenant '$TENANT_ID': $DB_NAME"
  
  # Create database if it doesn't exist
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
  PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USERNAME $DB_NAME
  
  echo "Database $DB_NAME created/verified for tenant $TENANT_ID"
done

echo "All tenant databases are ready!"
