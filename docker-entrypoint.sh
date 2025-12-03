#!/bin/sh
set -e

# Generate runtime configuration from environment variables
# This allows the React app to use runtime configuration instead of build-time env vars

CONFIG_FILE="/usr/share/nginx/html/config.js"

# Default values
API_URL="${REACT_APP_API_URL:-http://localhost:8000}"

# Generate the config.js file
cat > "$CONFIG_FILE" << EOF
// Runtime configuration - generated at container startup
// Do not modify this file directly, use environment variables instead
window.__RUNTIME_CONFIG__ = {
  REACT_APP_API_URL: "${API_URL}"
};
EOF

echo "Runtime config generated with API_URL: ${API_URL}"

# Start nginx
exec nginx -g "daemon off;"

