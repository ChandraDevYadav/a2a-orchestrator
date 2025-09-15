# A2A-JS Protocol with Orchestrator Integration

This project implements a complete A2A-JS protocol integration using an orchestrator pattern for agent-to-agent communication in a quiz generation system.

## 🏗️ Architecture Overview

```
┌─────────────────┐    A2A Protocol    ┌─────────────────┐
│   Frontend      │◄──────────────────►│   Orchestrator  │
│   (Next.js)     │                    │   (Express)     │
└─────────────────┘                    └─────────────────┘
         │                                       │
         │                              A2A Protocol
         │                                       ▼
         │                              ┌─────────────────┐
         │                              │   Backend       │
         │                              │   (Quiz Agent)  │
         │                              └─────────────────┘
         │
         ▼
┌─────────────────┐
│   Quiz UI       │
│   Components    │
└─────────────────┘
```

## 🚀 Key Features

### 1. **A2A-JS Protocol Integration**

- Complete implementation using `@a2a-js/sdk/client`
- Real agent-to-agent communication
- Task-based workflow execution
- Artifact-based data exchange

### 2. **Orchestrator Pattern**

- Centralized workflow management
- Agent discovery and health monitoring
- Load balancing and failover
- Circuit breaker pattern implementation

### 3. **Enhanced Error Handling**

- Graceful fallbacks at multiple levels
- Comprehensive error logging
- Retry mechanisms with exponential backoff
- Circuit breaker for failed agents

### 4. **Real-time Monitoring**

- Agent health checks via A2A protocol
- Workflow status tracking
- Performance metrics collection
- Chat history integration

## 📁 Project Structure

```
quiz-frontend/
├── orchestrator-server.js          # Standalone orchestrator with A2A
├── src/
│   ├── lib/
│   │   ├── orchestratorService.ts  # Enhanced orchestrator service
│   │   ├── orchestrator-client.ts  # Orchestrator HTTP client
│   │   ├── a2a-client-real.ts      # Real A2A client implementation
│   │   └── enhanced-api-client.ts  # API client with A2A integration
│   ├── components/
│   │   ├── OrchestratorStatus.tsx  # Real-time status monitoring
│   │   └── OrchestratorConfiguration.tsx # Configuration management
│   └── hooks/
│       └── use-orchestrator.ts      # React hook for orchestrator
└── test-a2a-orchestrator-integration.js # Comprehensive test suite
```

## 🔧 Configuration

### Environment Variables

```bash
# Orchestrator Configuration
ORCHESTRATOR_PORT=5000
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:5000

# Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:4001

# A2A Configuration
NEXT_PUBLIC_USE_A2A=true
NEXT_PUBLIC_USE_REAL_A2A=true
NEXT_PUBLIC_USE_ORCHESTRATOR=true
```

### Orchestrator Configuration

The orchestrator can be configured via the UI or environment variables:

- **Use Orchestrator**: Enable/disable orchestrator pattern
- **Use A2A Protocol**: Enable/disable A2A communication
- **Use Real A2A**: Use real A2A SDK vs simulated responses

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd quiz-frontend
npm install
```

### 2. Start the Orchestrator Server

```bash
# Start the standalone orchestrator server
node orchestrator-server.js
```

### 3. Start the Backend Agent

```bash
# Start the backend quiz agent (port 4001)
cd ../quiz-creator-agentic
npm start
```

### 4. Start the Frontend

```bash
# Start the Next.js frontend (port 3000)
npm run dev
```

### 5. Run Integration Tests

```bash
# Run comprehensive A2A-orchestrator integration tests
node test-a2a-orchestrator-integration.js
```

## 🔄 Workflow Execution

### Quiz Generation Workflow

1. **User Input**: User requests quiz generation via chat interface
2. **Orchestrator Selection**: Frontend determines to use orchestrator
3. **A2A Communication**: Orchestrator uses A2A protocol to communicate with backend
4. **Task Execution**: Backend agent executes quiz generation task
5. **Artifact Return**: Backend returns quiz data as A2A artifacts
6. **Response Processing**: Orchestrator processes and returns results
7. **UI Update**: Frontend displays generated quiz

### Agent Discovery Workflow

1. **Discovery Request**: Orchestrator initiates agent discovery
2. **A2A Card Retrieval**: Uses A2A SDK to get agent cards from known URLs
3. **Capability Mapping**: Maps agent capabilities and skills
4. **Status Update**: Updates agent status and health information
5. **Chat Integration**: Logs discovery results to chat history

## 🛠️ API Endpoints

### Orchestrator Endpoints

- `GET /health` - Health check
- `POST /api/discover-agents` - Discover available agents
- `POST /api/orchestrate-quiz-workflow` - Execute quiz workflow
- `POST /api/monitor-system-health` - Monitor system health
- `POST /api/execute-agent` - Execute agent with resilience
- `GET /api/chat-history` - Get chat history
- `GET /api/workflows` - Get all workflows
- `GET /api/agents` - Get all agents

### A2A Protocol Usage

All orchestrator endpoints use the A2A-JS SDK internally:

```javascript
// Example: Agent discovery using A2A
const a2aClient = await A2AClient.fromCardUrl(agentUrl);
const agentCard = await a2aClient.getAgentCard();

// Example: Task execution using A2A
const message = {
  kind: "message",
  messageId: uuidv4(),
  role: "user",
  parts: [{ kind: "text", text: JSON.stringify(taskData) }],
};

const response = await a2aClient.sendMessage({
  message,
  configuration: { blocking: true },
});
```

## 🔍 Monitoring and Debugging

### Real-time Status Monitoring

The `OrchestratorStatus` component provides real-time monitoring:

- **Connection Status**: Shows orchestrator connectivity
- **Agent Status**: Displays online/offline agents
- **Workflow Status**: Shows active workflows
- **Health Checks**: Real-time health monitoring

### Debug Logging

Comprehensive logging is available at multiple levels:

```javascript
// Orchestrator logs
console.log("🎯 Using A2A-enabled orchestrator for quiz generation...");
console.log("✅ A2A orchestrator workflow completed:", result);

// A2A client logs
console.log("A2A message sent, response:", response);
console.log("A2A task polling attempt:", taskResponse);
```

### Error Handling

Multi-level error handling with graceful fallbacks:

1. **Orchestrator Level**: Falls back to direct A2A
2. **A2A Level**: Falls back to REST API
3. **REST Level**: Falls back to mock data

## 🧪 Testing

### Integration Test Suite

The `test-a2a-orchestrator-integration.js` script provides comprehensive testing:

- **Orchestrator Health**: Tests orchestrator connectivity
- **Agent Discovery**: Tests A2A agent discovery
- **Quiz Workflow**: Tests complete quiz generation workflow
- **Direct A2A**: Tests direct A2A communication
- **End-to-End**: Tests complete integration flow

### Running Tests

```bash
# Run all integration tests
node test-a2a-orchestrator-integration.js

# Expected output:
# 🚀 Starting A2A-Orchestrator Integration Tests...
# ✅ Orchestrator Health: PASSED
# ✅ Agent Discovery: PASSED
# ✅ Quiz Workflow: PASSED
# ✅ Direct A2A: PASSED
# ✅ End-to-End: PASSED
# 🎉 All tests passed!
```

## 🔧 Troubleshooting

### Common Issues

1. **Orchestrator Connection Failed**

   - Check if orchestrator server is running on port 5000
   - Verify `ORCHESTRATOR_PORT` environment variable

2. **A2A Agent Discovery Failed**

   - Ensure backend agent is running on port 4001
   - Check agent card availability at `/.well-known/agent-card.json`

3. **Quiz Generation Timeout**
   - Check backend agent health
   - Verify A2A SDK configuration
   - Review orchestrator logs for errors

### Debug Commands

```bash
# Check orchestrator health
curl http://localhost:5000/health

# Test agent discovery
curl -X POST http://localhost:5000/api/discover-agents

# Test quiz workflow
curl -X POST http://localhost:5000/api/orchestrate-quiz-workflow \
  -H "Content-Type: application/json" \
  -d '{"query": "test quiz", "context": {"questionCount": 5}}'
```

## 📈 Performance Considerations

### Optimization Features

- **Circuit Breaker**: Prevents cascading failures
- **Load Balancing**: Distributes requests across agents
- **Caching**: Caches agent cards and capabilities
- **Connection Pooling**: Reuses A2A client connections
- **Timeout Management**: Configurable timeouts for different operations

### Monitoring Metrics

- **Response Times**: Track A2A communication latency
- **Success Rates**: Monitor task completion rates
- **Error Rates**: Track failure patterns
- **Agent Health**: Monitor agent availability

## 🔮 Future Enhancements

### Planned Features

1. **Dynamic Agent Registration**: Automatic agent discovery
2. **Workflow Templates**: Predefined workflow patterns
3. **Advanced Load Balancing**: Intelligent agent selection
4. **Distributed Tracing**: End-to-end request tracing
5. **Metrics Dashboard**: Real-time performance monitoring

### Extension Points

- **Custom Agents**: Add new agent types easily
- **Workflow Plugins**: Extend workflow capabilities
- **Protocol Adapters**: Support additional protocols
- **Storage Backends**: Multiple storage options

## 📚 Additional Resources

- [A2A-JS SDK Documentation](https://github.com/a2a-js/sdk)
- [Orchestrator Pattern](https://microservices.io/patterns/data/saga.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Agent-to-Agent Communication](https://en.wikipedia.org/wiki/Agent-to-agent_communication)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Run the integration test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
