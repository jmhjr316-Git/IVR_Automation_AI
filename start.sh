#!/bin/bash
# Start the IVR Automation AI system

# Start the Amazon Q Session API
echo "Starting Amazon Q Session API..."
./api/start-api.sh &

# Wait for the API to start
echo "Waiting for API to start..."
sleep 5

# Run the IVR test
echo "Starting IVR Automation AI..."
./run-ivr-test.js "$@"
