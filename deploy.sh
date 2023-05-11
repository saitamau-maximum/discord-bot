#!/bin/bash

echo "Deploying..."

# Install node dependencies
echo "Installing node dependencies..."
npm ci

# Restart Systemd
echo "Restarting Systemd..."

sudo systemctl restart discord-bot.service
