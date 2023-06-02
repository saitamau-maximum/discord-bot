#!/bin/bash

echo "Deploying..."

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Install node dependencies
echo "Installing node dependencies..."
npm ci

# Install headless browser dependencies
echo "Installing headless browser dependencies..."
sudo yum install -y atk cups-libs libdrm libXcomposite libXdamage libXext libXfixes libXi libXrandr libXrender libXtst pango alsa-lib gtk3 mesa-libgbm

# Restart Systemd
echo "Restarting Systemd..."

sudo systemctl restart discord-bot.service
