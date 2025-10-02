#!/bin/bash

# Deployment Test Script
# Tests both frontend and backend functionality after Vercel deployment

VERCEL_DOMAIN=${1:-"your-app.vercel.app"}
BASE_URL="https://$VERCEL_DOMAIN"
API_URL="$BASE_URL/api"

echo "🧪 Testing Kenbright GPT Deployment"
echo "=================================="
echo "Testing domain: $VERCEL_DOMAIN"
echo ""

# Test 1: Frontend accessibility
echo "🌐 Testing frontend accessibility..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend test failed (HTTP $FRONTEND_STATUS)"
fi

# Test 2: API health check
echo "🏥 Testing API health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/healthz")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed (HTTP $HEALTH_STATUS)"
fi

# Test 3: API root endpoint
echo "📡 Testing API root endpoint..."
ROOT_RESPONSE=$(curl -s "$API_URL/")
if echo "$ROOT_RESPONSE" | grep -q "Insurance Act Chatbot API"; then
    echo "✅ API root endpoint responding correctly"
else
    echo "❌ API root endpoint test failed"
fi

# Test 4: Chat endpoint (requires authentication in production)
echo "💬 Testing chat endpoint..."
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/ask" \
    -H "Content-Type: application/json" \
    -d '{"q":"What is IFRS-17?"}' \
    -w "%{http_code}")

if echo "$CHAT_RESPONSE" | grep -q "200"; then
    echo "✅ Chat endpoint is responding"
else
    echo "⚠️  Chat endpoint may require authentication (expected for production)"
fi

echo ""
echo "🔗 Test your deployment:"
echo "Frontend: $BASE_URL"
echo "API Docs: $API_URL/docs"
echo "Health:   $API_URL/healthz"
echo ""
echo "📝 Manual tests to perform:"
echo "1. Visit the frontend and try to sign up/login"
echo "2. Send a test message in the chat"
echo "3. Check that chat history is saved"
echo "4. Verify that intelligent chat titles are generated"