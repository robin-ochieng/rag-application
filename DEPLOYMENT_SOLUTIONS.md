# Kenbright GPT Deployment Solutions

## The Problem: Serverless Function Size Limit

Vercel serverless functions have a 250MB limit, but your full ML stack (LangChain, Pinecone, OpenAI, etc.) exceeds this limit.

## Solution Options

### Option 1: Hybrid Deployment (Recommended)

Deploy frontend to Vercel, backend to a different platform that supports larger applications.

#### Frontend: Vercel (Current Setup)
- ✅ Fast global CDN
- ✅ Automatic scaling
- ✅ Simple deployment
- ✅ Great for Next.js

#### Backend: Railway/Render/DigitalOcean
- ✅ No size limits
- ✅ Full ML stack support
- ✅ Docker support
- ✅ Persistent storage

### Option 2: Lightweight Vercel API (Current Implementation)

Use the simplified API we just created as a proxy or for basic functionality.

#### How it works:
1. Frontend deployed to Vercel
2. Lightweight API on Vercel (basic endpoints)
3. Heavy ML processing on external service
4. API proxy pattern

### Option 3: Full Platform Migration

Move everything to a platform that supports larger applications.

## Recommended Deployment Strategy

### Step 1: Deploy Frontend to Vercel

Your frontend is ready and will work perfectly on Vercel.

```bash
# Deploy frontend to Vercel
# 1. Connect GitHub repo to Vercel
# 2. Set environment variables
# 3. Deploy
```

### Step 2: Deploy Backend to Railway (Recommended)

Railway is perfect for your ML backend:

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub**: Same repo, different service
3. **Configure Environment**: 
   ```
   PORT=8000
   OPENAI_API_KEY=your_key
   PINECONE_API_KEY=your_key
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```
4. **Deploy**: Railway will automatically detect and deploy your Python app

### Step 3: Update Frontend Configuration

Update your Vercel environment variables:

```
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

## Platform Comparison

| Platform | Size Limit | ML Support | Pricing | Deployment |
|----------|------------|------------|---------|------------|
| **Vercel** | 250MB | ❌ Limited | Free tier | GitHub |
| **Railway** | No limit | ✅ Full | $5/month | GitHub |
| **Render** | No limit | ✅ Full | Free tier | GitHub |
| **DigitalOcean** | No limit | ✅ Full | $5/month | Docker |
| **Fly.io** | No limit | ✅ Full | Pay-per-use | Docker |

## Quick Railway Deployment

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `rag-application` repository
5. Railway will detect your Python app automatically
6. Set environment variables in Railway dashboard
7. Deploy!

Your app will be available at: `https://your-app.railway.app`

## Environment Variables for Railway

Set these in your Railway project:

```
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_API_KEY2=your_backup_pinecone_key
SUPABASE_URL=https://tuopbrdeatmoldwakhrb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
LANGSMITH_API_KEY=your_langsmith_key (optional)
TAVILY_API_KEY=your_tavily_key (optional)
PORT=8000
```

## Testing the Deployment

1. **Frontend Test**: Visit your Vercel URL
2. **Backend Test**: Visit your Railway URL + `/healthz`
3. **Integration Test**: Send a message in your chat interface

## Alternative: Render Deployment

If you prefer Render:

1. Go to https://render.com
2. Connect GitHub
3. Create new "Web Service"
4. Select your repo
5. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app_fastapi:app --host 0.0.0.0 --port $PORT`
6. Set environment variables
7. Deploy

## Cost Comparison

- **Vercel (Frontend)**: Free
- **Railway (Backend)**: ~$5/month
- **Total**: ~$5/month for production-ready deployment

This gives you the best of both worlds: fast frontend delivery via Vercel's CDN and full ML capabilities on Railway!