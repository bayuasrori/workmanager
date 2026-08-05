#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/drizzle-kit/bin.cjs push --force

echo "Starting server..."
exec node build
