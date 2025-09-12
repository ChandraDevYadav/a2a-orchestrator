// Next.js API route for A2A health check
// File: quiz-frontend/src/app/api/health/route.ts

import { NextResponse } from "next/server";

export async function GET() {
  const healthStatus = {
    status: "ok",
    agent: "quiz-frontend-agent",
    a2a: true,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    capabilities: ["streaming", "pushNotifications", "stateTransitionHistory"],
    skills: [
      "create_quiz_interface",
      "display_quiz",
      "take_quiz",
      "orchestrate_quiz_generation",
    ],
  };

  return NextResponse.json(healthStatus, {
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
