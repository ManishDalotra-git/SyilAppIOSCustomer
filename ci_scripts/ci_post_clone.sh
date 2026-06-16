#!/bin/sh

echo "Starting CI setup..."

# Install node modules
npm install

# Go to iOS folder
cd ios

# Install pods
pod install --repo-update

echo "CI setup completed"