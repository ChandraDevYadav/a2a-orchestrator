# 🎯 Render Deployment Guide

## Overview

Render is a good alternative to Vercel, especially if you need more control over the deployment process or want to deploy both frontend and backend on the same platform.

## Prerequisites

- GitHub repository with your code
- Render account (free tier available)

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub with the updated environment variables.

### 2. Create New Web Service

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select your `quiz-frontend` folder

### 3. Configure Build Settings

```
Build Command: npm run build
Start Command: npm run start
```

### 4. Environment Variables

Add these in Render dashboard → Environment:

```
NEXT_PUBLIC_API_URL=https://test-quiz-2.onrender.com
NEXT_PUBLIC_MANUAL_API_URL=https://test-manual-1.onrender.com
NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-app-name.onrender.com
NEXT_PUBLIC_QUIZ_AGENT_URL=https://test-quiz-2.onrender.com
NEXT_PUBLIC_MANUAL_AGENT_URL=https://test-manual-1.onrender.com
NODE_ENV=production
```

### 5. Deploy

Click "Create Web Service" and wait for deployment.

## ✅ Benefits of Render

- **Full Control**: More configuration options
- **Persistent Storage**: Better for apps with databases
- **Custom Domains**: Easy domain management
- **Auto-Deploy**: GitHub integration
- **Free Tier**: 750 hours/month
- **Docker Support**: Can use custom Dockerfiles

## ⚠️ Considerations

- **Cold Starts**: Slower than Vercel for serverless
- **Build Time**: Longer build times on free tier
- **Complexity**: More setup required
- **Next.js Optimization**: Not as optimized as Vercel

## 🔧 Advanced Configuration

### Custom Build Script

Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: quiz-frontend
    env: node
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://test-quiz-2.onrender.com
      - key: NEXT_PUBLIC_MANUAL_API_URL
        value: https://test-manual-1.onrender.com
```

### Custom Domain

1. Go to Settings → Custom Domains
2. Add your domain
3. Update DNS records
4. Update environment variables

## 📊 Monitoring

- **Logs**: View application logs
- **Metrics**: Basic performance metrics
- **Alerts**: Set up monitoring alerts

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**: Check Node.js version (use 18.x)
2. **Memory Issues**: Upgrade to paid plan if needed
3. **Timeout**: Increase build timeout in settings

### Debug Commands:

```bash
# Test build locally
npm run build

# Check environment variables
echo $NEXT_PUBLIC_API_URL
```

## 💰 Pricing Comparison

| Feature       | Render Free | Vercel Free |
| ------------- | ----------- | ----------- |
| Bandwidth     | 100GB       | 100GB       |
| Build Time    | 750 hours   | Unlimited   |
| Custom Domain | ✅          | ✅          |
| Auto-Deploy   | ✅          | ✅          |
| Cold Start    | Slower      | Faster      |

## 🎯 When to Choose Render

- Need persistent storage
- Want more control over deployment
- Deploying multiple services
- Budget constraints (longer free tier)
- Docker-based deployments

## 📱 Performance Tips

1. **Enable Compression**: Add gzip compression
2. **Optimize Images**: Use Next.js Image component
3. **Code Splitting**: Leverage Next.js automatic splitting
4. **Caching**: Configure proper cache headers
