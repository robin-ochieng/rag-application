#!/bin/bash

# Vercel Deployment Setup Script
# This script helps you set up environment variables for Vercel deployment

echo "🚀 Kenbright GPT - Vercel Deployment Setup"
echo "=========================================="
echo ""

# Check if user is logged into Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "📝 This script will help you set up environment variables for Vercel deployment."
echo ""

# Get project information
read -p "Enter your Vercel project name (or press Enter to auto-detect): " PROJECT_NAME

if [ -z "$PROJECT_NAME" ]; then
    echo "🔍 Auto-detecting project name from vercel.json..."
    PROJECT_NAME=$(basename "$(pwd)")
fi

echo "🏗️  Setting up environment variables for project: $PROJECT_NAME"
echo ""

# Supabase configuration
echo "🗄️  Supabase Configuration:"
read -p "Enter your Supabase URL: " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
read -s -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
echo ""

# OpenAI configuration
echo ""
echo "🤖 OpenAI Configuration:"
read -s -p "Enter your OpenAI API Key: " OPENAI_API_KEY
echo ""

# Generate the Vercel domain URL
echo ""
read -p "Enter your Vercel app domain (e.g., kenbright-gpt.vercel.app): " VERCEL_DOMAIN

if [ -z "$VERCEL_DOMAIN" ]; then
    VERCEL_DOMAIN="$PROJECT_NAME.vercel.app"
fi

API_URL="https://$VERCEL_DOMAIN/api"

echo ""
echo "🔧 Setting environment variables..."

# Set environment variables using Vercel CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY" production
vercel env add NEXT_PUBLIC_API_URL "$API_URL" production
vercel env add SUPABASE_URL "$SUPABASE_URL" production
vercel env add SUPABASE_SERVICE_ROLE_KEY "$SUPABASE_SERVICE_ROLE_KEY" production
vercel env add OPENAI_API_KEY "$OPENAI_API_KEY" production
vercel env add PYTHONPATH "." production

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "🚀 Ready to deploy! Run:"
echo "   vercel --prod"
echo ""
echo "📝 Your app will be available at: https://$VERCEL_DOMAIN"