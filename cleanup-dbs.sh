#!/bin/bash

# Function to clean specific tables in a database
clean_database() {
    local host=$1
    local port=$2
    local db="postgres"
    local user="postgres"
    local password="postgres"
    local tables=("${@:3}")  # Get all arguments after the first two as table names

    echo "Cleaning database at $host:$port"
    export PGPASSWORD=$password

    # Build the TRUNCATE command for specific tables
    local truncate_cmd=""
    for table in "${tables[@]}"; do
        truncate_cmd+="TRUNCATE TABLE $table CASCADE;"
    done

    # Execute the truncate command
    psql -h $host -p $port -U $user -d $db -c "$truncate_cmd"
}

# Clean specific tables in each database
clean_database "db-accounts" "5432" "addresses" "accounts"
clean_database "db-orders" "5432" "order_items" "orders" "destination_accounts" "products"
clean_database "db-eventstore" "5432" "rejot_events.events"

echo "All specified tables cleaned successfully" 