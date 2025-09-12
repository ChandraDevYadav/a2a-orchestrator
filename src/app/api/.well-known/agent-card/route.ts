// Next.js API route for A2A agent card
// File: quiz-frontend/src/app/api/.well-known/agent-card/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const agentCard = {
    name: "Quiz Frontend Agent",
    description:
      "Interactive quiz frontend that provides user interface for quiz creation, display, and taking. Can orchestrate quiz generation with backend agents.",
    protocolVersion: "0.3.0",
    url: "http://localhost:3000",
    provider: {
      organization: "Agentic Labs",
      url: "https://agentic.example.com",
    },
    version: "1.0.0",
    documentationUrl: "https://agentic.example.com/docs/quiz-frontend",
    capabilities: {
      streaming: true,
      pushNotifications: true,
      stateTransitionHistory: true,
    },
    authentication: { schemes: [], credentials: null },
    defaultInputModes: ["application/json", "text/plain"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "create_quiz_interface",
        name: "Create Quiz Interface",
        description:
          "Provides user interface for creating quizzes from text content",
        action: "/api/actions/create_quiz_interface",
        tags: ["quiz", "ui", "interface", "creation"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        examples: [
          {
            input: { content: "Machine learning concepts", type: "text" },
            output: { interface: "quiz_creation_form", status: "ready" },
          },
        ],
      },
      {
        id: "display_quiz",
        name: "Display Quiz",
        description:
          "Renders quiz questions and answers in an interactive format",
        action: "/api/actions/display_quiz",
        tags: ["quiz", "ui", "display", "interactive"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        examples: [
          {
            input: { quiz_data: { questions: [] }, mode: "display" },
            output: { interface: "quiz_display", status: "rendered" },
          },
        ],
      },
      {
        id: "take_quiz",
        name: "Take Quiz",
        description: "Provides interactive quiz-taking interface with scoring",
        action: "/api/actions/take_quiz",
        tags: ["quiz", "ui", "interactive", "scoring"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        examples: [
          {
            input: { quiz_data: { questions: [] }, mode: "take" },
            output: { interface: "quiz_taker", status: "active" },
          },
        ],
      },
      {
        id: "orchestrate_quiz_generation",
        name: "Orchestrate Quiz Generation",
        description:
          "Coordinates with backend quiz generation agents to create quizzes",
        action: "/api/actions/orchestrate_quiz_generation",
        tags: ["quiz", "orchestration", "coordination", "backend"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        examples: [
          {
            input: {
              content: "AI and machine learning topics",
              target_agent: "quiz-backend",
            },
            output: { orchestration: "initiated", status: "coordinating" },
          },
        ],
      },
    ],
  };

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    },
  });
}
