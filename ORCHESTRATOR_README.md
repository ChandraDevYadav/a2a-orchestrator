# Quiz Application with Separate Orchestrator

This application now runs the orchestrator on a separate port (5000) for better separation of concerns.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Orchestrator  │    │   Backend       │
│   Port: 3000    │◄──►│   Port: 5000    │◄──►│   Port: 4001    │
│   (Next.js)     │    │   (Express)     │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Option 1: Run Everything Together

```bash
npm run dev:all
```

### Option 2: Run Services Separately

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Orchestrator
npm run dev:orchestrator

# Terminal 3 - Backend (in quiz-creator-agentic directory)
cd ../quiz-creator-agentic
npm run dev
```

### Option 3: Use Concurrently

```bash
npm run dev:simple
```

## Available Scripts

- `npm run dev` - Start frontend only (port 3000)
- `npm run dev:orchestrator` - Start orchestrator only (port 5000)
- `npm run dev:all` - Start both frontend and orchestrator
- `npm run dev:simple` - Start both using concurrently
- `npm run start:orchestrator` - Start orchestrator in production mode

## Orchestrator Endpoints

- **Health Check**: `GET http://localhost:5000/health`
- **Discover Agents**: `POST http://localhost:5000/api/discover-agents`
- **Orchestrate Workflow**: `POST http://localhost:5000/api/orchestrate-quiz-workflow`
- **Monitor Health**: `POST http://localhost:5000/api/monitor-system-health`
- **Get Agents**: `GET http://localhost:5000/api/agents`
- **Get Workflows**: `GET http://localhost:5000/api/workflows`
- **Execute Agent**: `POST http://localhost:5000/api/execute-agent`

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:5000
ORCHESTRATOR_PORT=5000
```

## Testing the Orchestrator

```bash
# Health check
curl http://localhost:5000/health

# Get all agents
curl http://localhost:5000/api/agents

# Discover agents
curl -X POST http://localhost:5000/api/discover-agents -H "Content-Type: application/json" -d "{}"
```

## Benefits

✅ **Separation of Concerns**: Orchestrator logic isolated from frontend
✅ **Scalability**: Can scale orchestrator independently  
✅ **Monitoring**: Easier to monitor orchestrator performance
✅ **Deployment**: Can deploy orchestrator separately
✅ **Circuit Breaker**: Better resilience patterns
✅ **Load Balancing**: Can load balance orchestrator instances

## Next Steps

1. **Integrate with Frontend**: Update frontend to use orchestrator client
2. **Add Real A2A Logic**: Replace simple mock with actual orchestrator service
3. **Add Monitoring**: Implement proper health checks and metrics
4. **Add Authentication**: Secure orchestrator endpoints
5. **Add Load Balancing**: Scale orchestrator instances
