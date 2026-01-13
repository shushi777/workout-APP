#!/bin/sh
# Railway entrypoint script
# This script ensures PORT variable is properly expanded

# Set default PORT if not provided by Railway
PORT=${PORT:-8080}

echo "Starting Gunicorn on port $PORT..."

# Execute gunicorn with proper port binding
exec gunicorn server:app \
    --bind "0.0.0.0:$PORT" \
    --workers 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
