# Vercel Deployment Guide for Kenbright GPT

This guide will help you deploy your Kenbright GPT application to Vercel with both the Next.js frontend and FastAPI backend.

## Current Development Setup

Your local development uses:
- **Command**: `npm run dev:all` (from the `web` directory)
- **Frontend**: Next.js on `http://127.0.0.1:3001`
- **Backend**: FastAPI on `http://127.0.0.1:8000`
- **Integration**: Frontend connects to backend via proxy/API routes

## Prerequisites

1. **GitHub Repository**: Ensure your code is pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project**: Have your Supabase project ready with the database schema
4. **OpenAI API Key**: Have your OpenAI API key ready

## Step 1: Prepare Your Repository

Make sure these files are committed to your repository:
- `vercel.json` (deployment configuration)
- `api/index.py` (serverless function handler)
- `web/Dockerfile` (frontend Docker configuration)
- `.env.production` (environment variables template)
- Updated `requirements.txt` (with mangum dependency)
- Updated `web/next.config.ts` (with standalone output)

## Step 2: Test Local Development

Before deploying, ensure your local setup works:

```bash
cd web
npm run dev:all
```

This should start:
- Frontend at `http://127.0.0.1:3001`
- Backend at `http://127.0.0.1:8000`

## Step 3: Deploy to Vercel

### Option A: Automatic Deployment (Recommended)

1. **Connect GitHub to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your `rag-application` repository

2. **Configure Build Settings**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web` (for the frontend)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. **Configure Environment Variables**:
   In the Vercel dashboard, add these environment variables:

   ```bash
   # Frontend Environment Variables
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api

   # Backend Environment Variables (for serverless functions)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   PYTHONPATH=.
   ```

### Option B: Manual Deployment with Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project root**:
   ```bash
   cd "C:\Users\Robin Ochieng\OneDrive - Kenbright\Gig\AI Agents\Projects\RAG Application"
   vercel
   ```

## Step 3: Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add all the required environment variables:

### Frontend Variables (Available to browser):
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_API_URL`: Your Vercel app URL + `/api` (e.g., `https://kenbright-gpt.vercel.app/api`)

### Backend Variables (Server-side only):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (secret)
- `OPENAI_API_KEY`: Your OpenAI API key
- `PYTHONPATH`: Set to `.`

## Step 4: Update Supabase Configuration

Ensure your Supabase project has:

1. **Database Schema**: Run the SQL from `supabase-schema.sql`
2. **RLS Policies**: Ensure Row Level Security is configured
3. **Authentication**: Configure authentication providers if needed
4. **CORS**: Add your Vercel domain to allowed origins

## Step 5: Test Your Deployment

1. **Frontend Test**:
   - Visit your Vercel app URL (e.g., `https://kenbright-gpt.vercel.app`)
   - Test user registration/login
   - Verify the chat interface loads

2. **Backend API Test**:
   - Test the health endpoint: `https://your-app.vercel.app/api/healthz`
   - Test the chat endpoint: `https://your-app.vercel.app/api/ask`

3. **Integration Test**:
   - Send a message in the chat interface
   - Verify responses are generated and stored
   - Check that chat history works

## Step 6: Local Docker Testing (Optional)

To test the Docker setup locally:

```bash
# Build and run with docker-compose
docker-compose up --build

# Test frontend at http://localhost:3000
# Test backend at http://localhost:8000
```

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check environment variables are set correctly
   - Verify all dependencies are installed
   - Check build logs in Vercel dashboard

2. **API Connectivity Issues**:
   - Verify `NEXT_PUBLIC_API_URL` points to your Vercel domain
   - Check CORS settings
   - Ensure serverless functions are working

3. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check RLS policies allow your operations
   - Ensure database schema is applied

4. **Streaming Issues**:
   - Vercel has timeout limits for serverless functions (10 seconds for hobby, 15 minutes for pro)
   - Consider using Vercel's Edge Functions for better streaming performance

### Performance Optimization:

1. **Enable ISR (Incremental Static Regeneration)** for better performance
2. **Use Vercel Edge Functions** for the chat API if you need better streaming
3. **Optimize bundle size** by analyzing with `@next/bundle-analyzer`

## Monitoring and Maintenance

1. **Monitor Vercel Analytics** for performance insights
2. **Set up monitoring** for your Supabase database
3. **Monitor OpenAI API usage** and costs
4. **Set up alerts** for errors and performance issues

## Alternative: Using Docker on Other Platforms

If you prefer Docker deployment on other platforms:

- **Railway**: Supports Docker deployments with database add-ons
- **Render**: Docker support with automatic builds
- **DigitalOcean App Platform**: Docker support with scaling
- **AWS Fargate**: For enterprise-grade container deployment

Choose the platform that best fits your needs and budget.