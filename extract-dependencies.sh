#!/bin/bash

# Extract dependencies from IVR Crawler project
# This script extracts the necessary files from the IVR Crawler project and copies them to the IVR Automation AI project

# Source directory
SRC_DIR="/home/j15558/Tests/IVR/Crawler"

# Destination directory
DEST_DIR="/home/j15558/ivr-q-navigator/lib"

# Create destination directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Files to copy
FILES=(
  "ivr_flow_tester.js"
  "ivr_state_tracker_fixed.js"
)

# Copy files
echo "Copying files from $SRC_DIR to $DEST_DIR..."
for file in "${FILES[@]}"; do
  if [ -f "$SRC_DIR/$file" ]; then
    cp "$SRC_DIR/$file" "$DEST_DIR/"
    echo "Copied $file"
  else
    echo "Warning: $file not found in $SRC_DIR"
  fi
done

# Update imports in ivr-integration.js
echo "Updating imports in ivr-integration.js..."
sed -i 's|require.*ivr_flow_tester.*|require("./lib/ivr_flow_tester");|g' /home/j15558/ivr-q-navigator/run-ivr-test.js

echo "Done! Dependencies have been extracted and imports updated."
