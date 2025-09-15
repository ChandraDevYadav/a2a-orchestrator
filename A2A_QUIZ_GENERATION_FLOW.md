# A2A-JS Quiz Generation Flow Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           QUIZ GENERATION SYSTEM                                │
│                        (A2A-JS Protocol + Orchestrator)                         │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    HTTP/REST     ┌─────────────────┐    A2A Protocol    ┌─────────────────┐
│   Frontend      │◄─────────────────►│   Orchestrator  │◄─────────────────►│   Backend       │
│   (Next.js)     │                   │   (Express)    │                   │   (Quiz Agent)  │
│   Port: 3000    │                   │   Port: 5000   │                   │   Port: 4001    │
└─────────────────┘                   └─────────────────┘                   └─────────────────┘
         │                                       │                                       │
         │                                       │                                       │
         ▼                                       ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│   QuizChat      │                   │  A2A Client      │                   │  Agent Card     │
│   Component     │                   │  (@a2a-js/sdk)  │                   │  (.well-known)  │
└─────────────────┘                   └─────────────────┘                   └─────────────────┘
```

## Detailed Quiz Generation Flow

### Step 1: User Input

```
User Types: "Create a quiz about JavaScript"
    │
    ▼
┌─────────────────┐
│   QuizChat.tsx  │
│   - Detects quiz request
│   - Calls quizApiClient.generateQuiz()
└─────────────────┘
```

### Step 2: API Client Decision

```
┌─────────────────┐
│ enhanced-api-   │
│ client.ts       │
│                 │
│ if (useOrchestrator) {
│   → orchestratorClient.orchestrateQuizWorkflow()
│ } else if (useA2A) {
│   → realQuizA2AClient.generateQuiz()
│ } else {
│   → REST API fallback
│ }
└─────────────────┘
```

### Step 3: Orchestrator Processing

```
┌─────────────────┐
│ orchestrator-   │
│ server.js       │
│                 │
│ orchestrateQuizWorkflow() {
│   1. Extract topic & questionCount
│   2. Create A2A message
│   3. Send to backend via A2A
│   4. Poll for completion
│   5. Extract artifacts
│   6. Return quiz data
│ }
└─────────────────┘
```

### Step 4: A2A Protocol Communication

```
┌─────────────────┐                   ┌─────────────────┐
│ Orchestrator    │                   │ Backend Agent   │
│ A2A Client      │                   │ A2A Server      │
│                 │                   │                 │
│ const a2aClient = │◄────────────────►│ Agent Card      │
│   A2AClient.    │                   │ Endpoint        │
│   fromCardUrl() │                   │                 │
│                 │                   │                 │
│ const message = {                   │                 │
│   kind: "message",                   │                 │
│   messageId: "quiz-123",            │                 │
│   role: "user",                     │                 │
│   parts: [{                         │                 │
│     kind: "text",                   │                 │
│     text: JSON.stringify({          │                 │
│       skillId: "generate-quiz",      │                 │
│       input: {                      │                 │
│         topic: "JavaScript",        │                 │
│         difficulty: "medium",        │                 │
│         questionCount: 20           │                 │
│       }                             │                 │
│     })                              │                 │
│   }]                                │                 │
│ }                                   │                 │
│                                     │                 │
│ const response = await              │                 │
│   a2aClient.sendMessage({           │                 │
│     message,                        │                 │
│     configuration: {                │                 │
│       blocking: true                │                 │
│     }                               │                 │
│   })                                │                 │
└─────────────────┘                   └─────────────────┘
```

### Step 5: Task Execution & Polling

```
┌─────────────────┐                   ┌─────────────────┐
│ Orchestrator    │                   │ Backend Agent   │
│                 │                   │                 │
│ // Poll for task completion         │                 │
│ let attempts = 0;                   │                 │
│ while (task.status.state ===        │                 │
│   "running" && attempts < 30) {     │                 │
│                                     │                 │
│   await new Promise(resolve =>       │                 │
│     setTimeout(resolve, 1000));     │                 │
│   attempts++;                       │                 │
│                                     │                 │
│   const taskResponse = await        │                 │
│     a2aClient.getTask({             │                 │
│       id: task.id                   │                 │
│     });                             │                 │
│                                     │                 │
│   if (taskResponse.task) {          │                 │
│     completedTask = taskResponse.   │                 │
│       task;                         │                 │
│   }                                 │                 │
│ }                                   │                 │
└─────────────────┘                   └─────────────────┘
```

### Step 6: Artifact Processing

```
┌─────────────────┐
│ Orchestrator    │
│                 │
│ if (completedTask.status.state === "completed" &&
│     completedTask.artifacts) {
│
│   const quizArtifact = completedTask.artifacts.find(
│     artifact => artifact.name === "quiz.json"
│   );
│
│   if (quizArtifact && quizArtifact.parts) {
│     const quizData = JSON.parse(
│       quizArtifact.parts[0].text
│     );
│
│     return {
│       workflowId: "workflow-123",
│       status: "completed",
│       result: {
│         message: "Quiz generated successfully",
│         data: quizData
│       }
│     };
│   }
│ }
└─────────────────┘
```

### Step 7: Response Flow Back

```
┌─────────────────┐    HTTP Response    ┌─────────────────┐    State Update    ┌─────────────────┐
│ Backend Agent   │◄───────────────────►│ Orchestrator    │◄──────────────────►│ Frontend        │
│                 │                     │                 │                    │                 │
│ Returns:        │                     │ Returns:        │                    │ Updates:        │
│ - Task artifacts│                     │ - Processed data │                    │ - Quiz state    │
│ - Quiz JSON     │                     │ - Workflow ID   │                    │ - UI display    │
│ - Status        │                     │ - Status        │                    │ - Chat history  │
└─────────────────┘                     └─────────────────┘                    └─────────────────┘
```

## Complete Data Flow Sequence

```
1. User Input
   └── "Create a quiz about JavaScript"
       │
       ▼

2. Frontend Processing
   └── QuizChat.tsx detects quiz request
       │
       ▼

3. API Client Decision
   └── enhanced-api-client.ts
       ├── Check useOrchestrator flag
       ├── If true: → orchestratorClient.orchestrateQuizWorkflow()
       ├── If false: → realQuizA2AClient.generateQuiz()
       └── Fallback: → REST API
       │
       ▼

4. Orchestrator Server
   └── orchestrator-server.js
       ├── Extract topic and questionCount
       ├── Create A2A message with skillId
       ├── Send to backend via A2A protocol
       ├── Poll for task completion
       ├── Extract quiz artifacts
       └── Return processed data
       │
       ▼

5. A2A Protocol Communication
   └── @a2a-js/sdk/client
       ├── A2AClient.fromCardUrl("http://localhost:4001")
       ├── Create message with quiz parameters
       ├── Send message with blocking: true
       ├── Poll task status every 1 second
       ├── Extract artifacts when completed
       └── Parse quiz data from artifacts
       │
       ▼

6. Backend Agent Processing
   └── quiz-creator-agentic (Port 4001)
       ├── Receive A2A message
       ├── Parse skillId and input
       ├── Generate quiz questions
       ├── Create artifacts with quiz data
       └── Return task with artifacts
       │
       ▼

7. Response Processing
   └── Orchestrator
       ├── Extract quiz.json artifact
       ├── Parse quiz data
       ├── Format response
       └── Return to frontend
       │
       ▼

8. Frontend Display
   └── React Components
       ├── Update quiz state
       ├── Display QuizDisplay component
       ├── Show QuizDataGrid
       └── Update chat history
```

## Key Components & Their Roles

### Frontend Layer

- **QuizChat.tsx**: Detects quiz requests, manages chat UI
- **enhanced-api-client.ts**: Decides between orchestrator/A2A/REST
- **QuizDisplay.tsx**: Renders generated quiz
- **QuizDataGrid.tsx**: Shows quiz in table format

### Orchestrator Layer

- **orchestrator-server.js**: Main orchestrator with A2A integration
- **orchestrator-client.ts**: HTTP client for orchestrator communication
- **orchestratorService.ts**: Enhanced service with A2A task execution

### A2A Protocol Layer

- **@a2a-js/sdk/client**: Official A2A SDK
- **a2a-client-real.ts**: Real A2A client implementation
- **Agent Cards**: /.well-known/agent-card.json endpoints

### Backend Layer

- **quiz-creator-agentic**: Quiz generation agent
- **Agent Card**: Exposes capabilities and skills
- **A2A Server**: Handles A2A protocol communication

## Error Handling & Fallbacks

```
Primary Path: Frontend → Orchestrator → A2A → Backend
    │
    ├── Orchestrator fails?
    │   └── Fallback: Direct A2A → Backend
    │
    ├── A2A fails?
    │   └── Fallback: REST API → Backend
    │
    └── Backend fails?
        └── Fallback: Mock quiz data
```

## Configuration Flags

```javascript
// Enhanced API Client Configuration
{
  useOrchestrator: true,    // Use orchestrator pattern
  useA2A: true,            // Use A2A protocol
  useRealA2A: true         // Use real A2A SDK
}
```

This complete flow ensures robust quiz generation using the A2A-JS protocol through the orchestrator pattern, with multiple fallback mechanisms for reliability.
