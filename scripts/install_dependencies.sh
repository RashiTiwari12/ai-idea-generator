#!/bin/bash
set -e  # exit on error

echo "Installing dependencies..."

# Ensure ec2-user owns the app directory before installing
sudo chown -R ec2-user:ec2-user /home/ec2-user/ai-idea-generator

# Backend
cd /home/ec2-user/ai-idea-generator/backend
npm install

# Frontend
cd /home/ec2-user/ai-idea-generator/frontend
npm install
npm run build  # build frontend

echo "Dependencies installed and frontend built successfully"