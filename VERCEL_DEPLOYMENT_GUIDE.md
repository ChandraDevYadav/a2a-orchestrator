# 🚀 Vercel Deployment Guide

## Quick Start (Recommended)

### 1. Prepare Your App

Your app is already configured for Vercel! The hardcoded URLs have been updated to use environment variables.

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to your project
cd quiz-frontend

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: quiz-frontend (or your preferred name)
# - Directory: ./
# - Override settings? No
```

#### Option B: GitHub Integration (Recommended for continuous deployment)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js settings

### 3. Configure Environment Variables

In your Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_API_URL=https://test-quiz-2.onrender.com
NEXT_PUBLIC_MANUAL_API_URL=https://test-manual-1.onrender.com
NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_QUIZ_AGENT_URL=https://test-quiz-2.onrender.com
NEXT_PUBLIC_MANUAL_AGENT_URL=https://test-manual-1.onrender.com
NODE_ENV=production
```

### 4. Deploy

- If using CLI: `vercel --prod`
- If using GitHub: Push to main branch (auto-deploys)

## ✅ Benefits of Vercel

- **Zero Configuration**: Works out of the box
- **Automatic HTTPS**: SSL certificates included
- **Global CDN**: Fast loading worldwide
- **Preview Deployments**: Every PR gets a preview URL
- **Analytics**: Built-in performance monitoring
- **Free Tier**: 100GB bandwidth/month
- **Edge Functions**: Serverless functions at the edge

## 🔧 Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain

## 📊 Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: View serverless function logs
- **Deployment History**: Track all deployments

## 🚨 Troubleshooting

### Common Issues:

1. **Build Errors**: Check `next.config.js` and TypeScript errors
2. **Environment Variables**: Ensure all `NEXT_PUBLIC_` variables are set
3. **API Calls**: Verify backend URLs are accessible from Vercel

### Debug Commands:

```bash
# Check build locally
npm run build

# Test production build
npm run start

# Check environment variables
vercel env ls
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Backend URLs updated to production
- [ ] Custom domain configured (if needed)
- [ ] Analytics enabled
- [ ] Error monitoring set up
- [ ] Performance optimized

## 📱 Mobile Optimization

Vercel automatically optimizes for mobile:

- Image optimization
- Font optimization
- Code splitting
- Lazy loading

Your app will be mobile-ready out of the box!
