#!/bin/bash
# Enhanced wrapper for Amazon Q Developer CLI that includes conversation history
# Specifically formatted for IVR navigation use case

# Check if required arguments are provided
if [ $# -lt 3 ]; then
    echo "Usage: ./q_wrapper_with_history.sh <profile> <history_file> \"Your question here\""
    exit 1
fi

# Capture the arguments
profile="$1"
history_file="$2"
question="${@:3}"

# Format the current question in IVR format if it's not already
if [[ "$question" != *"the IVR says"* ]] && [[ "$question" != *"The IVR says"* ]]; then
    formatted_question="The IVR says \"$question\" what next?"
else
    formatted_question="$question"
fi

# Check if history file exists
if [ -f "$history_file" ]; then
    # Read conversation history
    history_content=$(cat "$history_file")
    
    # Construct the full prompt with history
    full_prompt="Previous IVR navigation:\n\n$history_content\n\nHuman: $formatted_question\n\nProvide ONLY the key or option to press. Do not explain your reasoning. Just give the digit, letter, or exact word to respond with."
    
    # Check prompt length - if too long, truncate history
    prompt_length=${#full_prompt}
    if [ $prompt_length -gt 8000 ]; then
        echo "Warning: Prompt length ($prompt_length chars) exceeds recommended limit. Truncating history." >&2
        # Use just the last part of the history to keep under limit
        history_lines=$(echo "$history_content" | wc -l)
        history_to_keep=$((history_lines / 2))
        truncated_history=$(echo "$history_content" | tail -n $history_to_keep)
        full_prompt="Previous IVR navigation (truncated):\n\n$truncated_history\n\nHuman: $formatted_question\n\nProvide ONLY the key or option to press. Do not explain your reasoning. Just give the digit, letter, or exact word to respond with."
    fi
else
    # No history file, just use the formatted question
    full_prompt="Human: $formatted_question\n\nProvide ONLY the key or option to press. Do not explain your reasoning. Just give the digit, letter, or exact word to respond with."
fi

# Save the full prompt for debugging
echo "$full_prompt" > /tmp/q_wrapper_full_prompt.txt

# Use the q chat command with the full prompt
output=$(q chat --profile "$profile" --accept-all "$full_prompt" 2>&1)

# Save the full output for debugging
echo "$output" > /tmp/q_wrapper_debug_output.txt

# Strip ANSI color codes
clean_output=$(echo "$output" | sed -e 's/\x1B\[[0-9;]*[mK]//g')

# Save the clean output for debugging
echo "$clean_output" > /tmp/q_wrapper_debug_clean.txt

# Extract the response (everything after the prompt)
# This is trickier with history, so we'll look for patterns
if echo "$clean_output" | grep -q "Amazon Q:"; then
    # Extract the last "Amazon Q:" response
    response=$(echo "$clean_output" | sed -n '/Amazon Q:/,$p' | sed '1s/^Amazon Q://' | grep -v "^(To exit" | grep -v "^Human:" | grep -v "^> ")
else
    # Fallback extraction method
    response=$(echo "$clean_output" | grep -v "^(To exit" | grep -v "^Human:" | grep -v "^> " | tail -n +2)
fi

# Save the response for debugging
echo "$response" > /tmp/q_wrapper_debug_response.txt

# Return the response
echo "$response"
