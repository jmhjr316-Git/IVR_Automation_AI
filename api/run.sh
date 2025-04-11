#!/bin/bash
# Start the Amazon Q Session API

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Check if Amazon Q CLI is installed
if ! command -v q &> /dev/null; then
    echo "Error: Amazon Q CLI is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting Amazon Q Session API..."
node server.js
