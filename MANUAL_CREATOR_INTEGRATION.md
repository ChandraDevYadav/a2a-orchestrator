# Manual Creator Integration

This document describes the integration of the manual-creator-agentic service with the existing quiz application orchestrator and frontend.

## Overview

The manual creator integration adds comprehensive manual generation capabilities to the existing quiz application, allowing users to create detailed educational manuals on any topic using AI.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Orchestrator   │    │ Manual Creator  │
│   (Next.js)     │◄──►│   Server         │◄──►│   Agent          │
│   Port: 3000    │    │   Port: 5000     │    │   Port: 4002     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Quiz Creator  │    │   A2A Protocol   │    │   OpenAI API    │
│   Agent         │    │   Communication  │    │   Integration   │
│   Port: 4001    │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Components Added

### 1. Frontend Components

#### ManualForm.tsx

- Form-based manual creation interface
- Topic and prompt input fields
- Progress tracking during generation
- Integration with orchestrator API

#### ManualDisplay.tsx

- Displays generated manual content
- Structured sections (introduction, content, conclusion, glossary)
- Download functionality for manual content
- Responsive design with proper formatting

#### ManualChat.tsx

- Interactive chat interface for manual creation
- Real-time conversation with AI assistant
- Manual generation through natural language
- Chat history management

### 2. Backend Integration

#### Orchestrator Server Updates

- Added manual-creator-agentic to known agents list
- New `orchestrateManualWorkflow` function
- Manual workflow endpoint: `/api/orchestrate-manual-workflow`
- Health monitoring for manual creator service
- Agent discovery includes manual creator

#### Orchestrator Service Updates

- `orchestrateManualWorkflow` method in NextJSOrchestratorService
- Manual creator agent profile configuration
- Workflow execution with chat integration
- Error handling and fallback mechanisms

### 3. API Routes

#### Updated Orchestrator Route

- Added `orchestrate-manual-workflow` action handler
- Integration with manual workflow orchestration
- Proper error handling and response formatting

## Features

### Manual Creation Methods

1. **Form-Based Creation**

   - Simple topic and prompt input
   - Structured manual generation
   - Progress tracking
   - Immediate display of results

2. **Chat-Based Creation**
   - Natural language interaction
   - Conversational manual creation
   - Real-time feedback
   - Chat history preservation

### Manual Structure

Generated manuals include:

- **Title**: Descriptive title for the manual
- **Introduction**: Purpose and learning objectives
- **Sections**: Multiple content sections with key points
- **Conclusion**: Summary and next steps
- **Glossary**: Key terms and definitions

### User Interface

- **Tab Navigation**: Switch between Quiz Creator and Manual Creator
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live progress and status updates
- **Download Support**: Export manuals as text files

## Setup Instructions

### 1. Prerequisites

Ensure all services are installed and configured:

- Node.js and npm
- Manual Creator Agent (port 4002)
- Quiz Creator Agent (port 4001)
- Orchestrator Server (port 5000)
- Frontend Application (port 3000)

### 2. Environment Variables

Make sure the following environment variables are set:

- `OPENAI_API_KEY`: Required for manual generation
- `NODE_ENV`: Development or production environment

### 3. Start Services

Use the provided startup script:

```bash
node start-manual-integration.js
```

Or start services individually:

```bash
# Terminal 1: Manual Creator Agent
cd manual-creator-agentic
npm run dev

# Terminal 2: Quiz Creator Agent
cd quiz-creator-agentic
npm run dev

# Terminal 3: Orchestrator Server
cd quiz-frontend
node orchestrator-server.js

# Terminal 4: Frontend Application
cd quiz-frontend
npm run dev
```

### 4. Test Integration

Run the integration test suite:

```bash
node test-manual-integration.js
```

## API Endpoints

### Orchestrator Endpoints

- `POST /api/orchestrate-manual-workflow`

  - Generates a manual using the manual-creator agent
  - Body: `{ topic: string, prompt?: string }`
  - Returns: Manual data with structured content

- `POST /api/discover-agents`

  - Discovers all available agents including manual creator
  - Returns: List of agents with status and capabilities

- `POST /api/monitor-system-health`
  - Monitors health of all services including manual creator
  - Returns: Health status of all services

### Manual Creator Endpoints

- `GET /.well-known/agent-card.json`

  - Returns agent card with capabilities and skills
  - Used for A2A protocol discovery

- `POST /api/actions/generate-manual`
  - Direct manual generation endpoint
  - Body: `{ topic: string, prompt?: string }`
  - Returns: Generated manual content

## Usage Examples

### Creating a Manual via Form

1. Navigate to the Manual Creator tab
2. Enter a topic (e.g., "React Hooks")
3. Optionally add a prompt for specific requirements
4. Click "Generate Manual"
5. View the generated manual in the center panel
6. Download the manual if needed

### Creating a Manual via Chat

1. Navigate to the Manual Creator tab
2. Use the chat interface to describe what manual you want
3. Example: "Create a comprehensive guide on JavaScript Promises"
4. The AI will generate the manual and display it
5. Continue the conversation to refine or expand the manual

## Troubleshooting

### Common Issues

1. **Manual Creator Not Found**

   - Check if manual-creator-agentic is running on port 4002
   - Verify agent card is accessible at `http://localhost:4002/.well-known/agent-card.json`

2. **Manual Generation Fails**

   - Check OpenAI API key configuration
   - Verify orchestrator can communicate with manual creator
   - Check network connectivity between services

3. **Frontend Not Loading Manuals**
   - Verify orchestrator API is responding
   - Check browser console for JavaScript errors
   - Ensure all required components are imported

### Debug Commands

```bash
# Check service health
curl http://localhost:4002/health
curl http://localhost:5000/health

# Test agent discovery
curl -X POST http://localhost:5000/api/discover-agents

# Test manual workflow
curl -X POST http://localhost:5000/api/orchestrate-manual-workflow \
  -H "Content-Type: application/json" \
  -d '{"topic": "Test Topic", "prompt": "Test prompt"}'
```

## Development Notes

### Adding New Features

1. **New Manual Types**: Extend the manual service to support different formats
2. **Enhanced UI**: Add more interactive elements to manual display
3. **Export Options**: Add PDF, HTML, or other export formats
4. **Collaboration**: Add sharing and collaboration features

### Performance Considerations

- Manual generation can take 10-30 seconds depending on complexity
- Consider implementing caching for frequently requested topics
- Monitor OpenAI API usage and costs
- Implement rate limiting for production use

## Security Considerations

- Validate all user inputs before sending to AI services
- Implement proper authentication for production use
- Monitor API usage to prevent abuse
- Sanitize generated content before display

## Future Enhancements

- **Template System**: Pre-defined manual templates for common topics
- **Multi-language Support**: Generate manuals in different languages
- **Version Control**: Track changes and versions of generated manuals
- **Integration with LMS**: Export to learning management systems
- **Analytics**: Track usage patterns and popular topics
