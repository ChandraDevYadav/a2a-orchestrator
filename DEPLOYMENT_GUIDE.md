# A2A Quiz Application - Deployment Guide 🚀

## File Naming Convention for Deployment

### ✅ **Recommended File Structure**

```
quiz-frontend/
├── src/
│   ├── lib/
│   │   ├── a2a-client.ts          # Clean A2A client (production-ready)
│   │   ├── a2a-server.ts          # Clean A2A server (production-ready)
│   │   ├── orchestratorService.ts # Orchestration service
│   │   └── api-client.ts          # API client wrapper
│   ├── hooks/
│   │   └── use-a2a-server.ts      # A2A server hook
│   └── app/
│       └── api/
│           ├── .well-known/
│           │   └── agent-card/
│           │       └── route.ts    # Agent card endpoint
│           └── a2a/
│               └── tasks/
│                   └── route.ts    # A2A tasks endpoint
├── test-a2a-integration.js        # Integration test (clean naming)
├── agent-card.json                # Agent configuration
└── package.json                   # Dependencies
```

### ❌ **Files to Remove (Development Artifacts)**

Remove these files as they're no longer needed:

- `src/lib/a2a-client-real.ts` (replaced by `a2a-client.ts`)
- `src/lib/a2a-server-real.ts` (replaced by `a2a-server.ts`)
- `src/lib/a2a-server-real-sdk.ts` (replaced by `a2a-server.ts`)
- `test-real-a2a-integration.js` (replaced by `test-a2a-integration.js`)

## Production-Ready File Naming

### **Core A2A Files:**

- ✅ `a2a-client.ts` - A2A client implementation
- ✅ `a2a-server.ts` - A2A server implementation
- ✅ `test-a2a-integration.js` - Integration testing

### **Class Names:**

- ✅ `QuizA2AClient` - Main A2A client class
- ✅ `FrontendAgentExecutor` - A2A executor implementation
- ✅ `FrontendA2AServer` - A2A server wrapper

### **Function Names:**

- ✅ `startFrontendA2AServer()` - Server initialization
- ✅ `stopFrontendA2AServer()` - Server cleanup
- ✅ `getFrontendA2AServer()` - Server instance getter

## Deployment Checklist

### ✅ **Pre-Deployment**

1. **Clean File Structure**

   ```bash
   # Remove old development files
   rm src/lib/a2a-client-real.ts
   rm src/lib/a2a-server-real.ts
   rm src/lib/a2a-server-real-sdk.ts
   rm test-real-a2a-integration.js
   ```

2. **Verify Imports**

   - All imports should reference the clean file names
   - No references to "real" prefixed files
   - Consistent naming throughout the codebase

3. **Update Package.json**
   ```json
   {
     "scripts": {
       "test:a2a": "node test-a2a-integration.js",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

### ✅ **Environment Configuration**

1. **Environment Variables**

   ```env
   # Frontend
   NEXT_PUBLIC_API_URL=http://localhost:4001
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

   # Backend
   BACKEND_URL=http://localhost:4001
   FRONTEND_URL=http://localhost:3000
   ```

2. **Agent URLs**
   - Frontend Agent: `http://localhost:3000`
   - Backend Agent: `http://localhost:4001`
   - Agent Cards: `/.well-known/agent-card`

### ✅ **Deployment Steps**

1. **Build Frontend**

   ```bash
   cd quiz-frontend
   npm run build
   ```

2. **Build Backend**

   ```bash
   cd quiz-creator-agentic
   npm run build
   ```

3. **Test Integration**

   ```bash
   # Start both services
   npm run dev  # Frontend
   npm run dev  # Backend (in separate terminal)

   # Run integration test
   node test-a2a-integration.js
   ```

### ✅ **Production Deployment**

1. **Docker Deployment**

   ```dockerfile
   # Frontend Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Environment-Specific URLs**

   ```typescript
   // Production configuration
   const FRONTEND_URL = process.env.FRONTEND_URL || "https://your-domain.com";
   const BACKEND_URL = process.env.BACKEND_URL || "https://api.your-domain.com";
   ```

3. **Health Checks**
   - Frontend: `GET /api/health`
   - Backend: `GET /health`
   - Agent Cards: `GET /.well-known/agent-card`

## Benefits of Clean Naming

### 🎯 **Professional Standards**

- Consistent naming conventions
- No development artifacts in production
- Clear, descriptive file names
- Industry-standard patterns

### 🚀 **Deployment Ready**

- Production-optimized file structure
- Clean import paths
- Scalable architecture
- Maintainable codebase

### 🔧 **Maintenance**

- Easy to understand file purposes
- Consistent naming patterns
- Reduced cognitive load
- Better team collaboration

## File Naming Best Practices

### ✅ **Do:**

- Use descriptive, clear names
- Follow consistent conventions
- Remove development prefixes
- Use kebab-case for files
- Use PascalCase for classes

### ❌ **Don't:**

- Use temporary or "real" prefixes
- Mix naming conventions
- Include development artifacts
- Use unclear abbreviations
- Leave old files in production

## Conclusion

The application now has **production-ready file naming** with:

- ✅ Clean, consistent file structure
- ✅ Professional naming conventions
- ✅ No development artifacts
- ✅ Scalable architecture
- ✅ Deployment-ready configuration

This naming convention is suitable for production deployment and follows industry best practices for maintainable, professional applications.
