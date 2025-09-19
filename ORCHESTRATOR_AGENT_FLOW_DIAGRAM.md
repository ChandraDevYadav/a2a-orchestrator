# Orchestrator Agent Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORCHESTRATOR SYSTEM                                │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Orchestrator   │    │   Agents        │
│   (Next.js)     │◄──►│   Service        │◄──►│   Ecosystem     │
│   Port: 3000    │    │   Port: 5000     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Input    │    │   Decision       │    │   Quiz Agent    │
│   - Chat        │    │   Engine         │    │   Port: 4001    │
│   - Forms       │    │   - Classify     │    │                 │
│   - Requests    │    │   - Route        │    └─────────────────┘
└─────────────────┘    │   - Execute      │             │
                       └──────────────────┘             │
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   A2A Protocol   │    │ Manual Creator  │
                       │   Communication  │    │   Agent         │
                       │                  │    │   Port: 4002    │
                       └──────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   DeepSeek API   │    │   OpenAI API    │
                       │   Fallback       │    │   Integration   │
                       │   Port: External │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Request Flow Process

### 1. User Request Classification

```
User Input → Orchestrator → DeepSeek Classification
    ↓
┌─────────────────────────────────────────────────────────┐
│  Classification Results:                                │
│  • "quiz" → Route to Quiz Agent                        │
│  • "manual" → Route to Manual Creator Agent            │
│  • "chat" → Route to DeepSeek API                      │
└─────────────────────────────────────────────────────────┘
```

### 2. Agent Routing Logic

```
┌─────────────────────────────────────────────────────────┐
│  Orchestrator Decision Tree:                            │
│                                                         │
│  IF requestType === "quiz":                             │
│    ├── Try Quiz Agent (Port 4001)                      │
│    ├── Fallback to DeepSeek API                        │
│    └── Return Quiz Data                                │
│                                                         │
│  IF requestType === "manual":                           │
│    ├── Try Manual Creator Agent (Port 4002)           │
│    ├── Fallback to DeepSeek API                        │
│    └── Return Manual Data                              │
│                                                         │
│  IF requestType === "chat":                             │
│    ├── Route to DeepSeek API                           │
│    └── Return Chat Response                            │
└─────────────────────────────────────────────────────────┘
```

### 3. Agent Communication Flow

```
┌─────────────────────────────────────────────────────────┐
│  A2A Protocol Communication:                           │
│                                                         │
│  1. Agent Discovery:                                    │
│     ├── Scan ports 3000, 4001, 4002                    │
│     ├── Get agent-card.json from each                  │
│     └── Register available agents                      │
│                                                         │
│  2. Message Routing:                                   │
│     ├── Create A2A message with skillId                │
│     ├── Send to target agent                           │
│     ├── Wait for response                              │
│     └── Process and return result                      │
│                                                         │
│  3. Error Handling:                                    │
│     ├── Connection timeout                             │
│     ├── Agent unavailable                              │
│     └── Fallback to DeepSeek API                       │
└─────────────────────────────────────────────────────────┘
```

## Agent-Specific Flows

### Quiz Generation Flow

```
User: "Create a quiz about science"
    ↓
Orchestrator: Classify as "quiz"
    ↓
┌─────────────────────────────────────────────────────────┐
│  Quiz Agent Flow (Port 4001):                          │
│                                                         │
│  1. Receive A2A message with skillId: "generate_quiz" │
│  2. Process topic and requirements                     │
│  3. Call OpenAI API for quiz generation                │
│  4. Structure quiz data (questions, answers, etc.)     │
│  5. Return structured JSON response                    │
│                                                         │
│  Fallback: DeepSeek API generates quiz directly       │
└─────────────────────────────────────────────────────────┘
    ↓
Frontend: Display quiz in center panel
```

### Manual Generation Flow

```
User: "Create a manual about AI/ML"
    ↓
Orchestrator: Classify as "manual"
    ↓
┌─────────────────────────────────────────────────────────┐
│  Manual Creator Agent Flow (Port 4002):               │
│                                                         │
│  1. Receive A2A message with skillId: "generate_manual"│
│  2. Process topic and prompt                           │
│  3. Call OpenAI API for manual generation              │
│  4. Generate rich markdown content                     │
│  5. Structure manual data (sections, subsections)     │
│  6. Return structured JSON response                   │
│                                                         │
│  Fallback: DeepSeek API generates basic manual        │
└─────────────────────────────────────────────────────────┘
    ↓
Frontend: Parse markdown and display structured manual
```

## Error Handling & Fallbacks

```
┌─────────────────────────────────────────────────────────┐
│  Error Handling Strategy:                              │
│                                                         │
│  Primary Agent Unavailable:                            │
│  ├── Log error with details                            │
│  ├── Try alternative agent (if available)             │
│  ├── Fallback to DeepSeek API                          │
│  └── Return generic response                           │
│                                                         │
│  DeepSeek API Failure:                                 │
│  ├── Log error                                         │
│  ├── Return error message to user                     │
│  └── Suggest retry                                     │
│                                                         │
│  Network Issues:                                       │
│  ├── Implement retry logic                             │
│  ├── Circuit breaker pattern                          │
│  └── Graceful degradation                             │
└─────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Successful Manual Generation

```
1. User Input: "Create manual on React"
2. Orchestrator: Classify → "manual"
3. Route to Manual Creator Agent (Port 4002)
4. Agent: Generate rich markdown content
5. Orchestrator: Parse markdown → structured data
6. Frontend: Display sections, subsections, glossary
```

### Failed Agent Connection

```
1. User Input: "Create manual on React"
2. Orchestrator: Classify → "manual"
3. Try Manual Creator Agent (Port 4002) → FAILED
4. Fallback: DeepSeek API → Generate basic manual
5. Frontend: Display generic template
```

## Key Components

### Orchestrator Service (`orchestratorService.ts`)

- **Centralized decision making**
- **Agent discovery and management**
- **Request classification**
- **Fallback handling**

### Agent Cards (`.well-known/agent-card.json`)

- **Agent capabilities**
- **Available skills**
- **Communication endpoints**
- **Health status**

### A2A Protocol

- **Standardized communication**
- **Message routing**
- **Error handling**
- **Service discovery**

## Port Configuration

```
Port 3000: Next.js Frontend
Port 4001: Quiz Creator Agent
Port 4002: Manual Creator Agent
Port 5000: Orchestrator Server (alternative)
External: DeepSeek API (fallback)
External: OpenAI API (agent backend)
```
