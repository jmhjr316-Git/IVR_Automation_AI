#!/bin/bash

# Setup GitHub repository for IVR Automation AI
# This script sets up the GitHub repository and pushes the code

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git and try again."
    exit 1
fi

# Set GitHub repository URL
GITHUB_REPO="git@github.com:jmhjr316-Git/IVR_Automation_AI.git"

# Check if the repository is already set up
if git remote -v | grep -q "$GITHUB_REPO"; then
    echo "GitHub repository is already set up."
else
    echo "Setting up GitHub repository..."
    git remote add origin "$GITHUB_REPO"
fi

# Push to GitHub
echo "Pushing code to GitHub..."
git push -u origin master

echo "Done! The code has been pushed to GitHub."
