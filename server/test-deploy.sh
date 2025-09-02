#!/bin/bash

echo "🧪 Testing deployment build process..."

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "📁 Checking build output..."
ls -la dist/

echo "🚀 Testing server start..."
timeout 10s npm start &
SERVER_PID=$!

sleep 5

echo "🔍 Testing health endpoint..."
curl -s http://localhost:5000/api/health || echo "❌ Health check failed"

echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo "✅ Deployment test completed!"
