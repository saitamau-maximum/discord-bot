#!/bin/bash

echo "Deploying..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install node dependencies
echo "Installing node dependencies..."
npm ci

# Build
echo "Building..."
npm run build

# Restart Systemd
echo "Restarting Systemd..."

sudo systemctl restart discord-bot.service
