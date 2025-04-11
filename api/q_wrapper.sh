#!/bin/bash
# A simple wrapper for Amazon Q Developer CLI

# Check if a question was provided
if [ $# -lt 2 ]; then
    echo "Usage: ./q_wrapper.sh <profile> \"Your question here\""
    exit 1
fi

# Capture the profile and question from arguments
profile="$1"
question="${@:2}"

# Use the q chat command directly with the profile
output=$(q chat --profile "$profile" --accept-all "$question" 2>&1)

# Save the full output for debugging
echo "$output" > /tmp/q_wrapper_debug_output.txt

# Strip ANSI color codes
clean_output=$(echo "$output" | sed -e 's/\x1B\[[0-9;]*[mK]//g')

# Save the clean output for debugging
echo "$clean_output" > /tmp/q_wrapper_debug_clean.txt

# Extract the response (everything after the prompt)
response=$(echo "$clean_output" | sed -n '/'"$question"'/,$p' | sed '1d' | grep -v "^(To exit" | grep -v "^Human:" | grep -v "^> ")

# Save the response for debugging
echo "$response" > /tmp/q_wrapper_debug_response.txt

# Return the response
echo "$response"
