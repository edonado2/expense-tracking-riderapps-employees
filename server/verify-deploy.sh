#!/bin/bash

echo "🔍 Verifying deployment setup..."

echo "📁 Current directory: $(pwd)"
echo "📦 Package.json exists: $(test -f package.json && echo '✅' || echo '❌')"
echo "🔧 TypeScript config exists: $(test -f tsconfig.json && echo '✅' || echo '❌')"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "📁 Checking build output..."
if [ -d "dist" ]; then
    echo "✅ dist/ folder exists"
    ls -la dist/
    
    if [ -f "dist/index.js" ]; then
        echo "✅ dist/index.js exists"
        echo "📏 File size: $(wc -c < dist/index.js) bytes"
    else
        echo "❌ dist/index.js missing!"
    fi
else
    echo "❌ dist/ folder missing!"
fi

echo ""
echo "🚀 Testing server start..."
timeout 10s node dist/index.js &
SERVER_PID=$!

sleep 3

echo "🔍 Testing health endpoint..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

echo "🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "📋 Deployment files check:"
echo "  - render.yaml: $(test -f ../render.yaml && echo '✅' || echo '❌')"
echo "  - Procfile: $(test -f Procfile && echo '✅' || echo '❌')"
echo "  - .render-buildpacks: $(test -f .render-buildpacks && echo '✅' || echo '❌')"

echo ""
echo "🎯 Ready for deployment!"
