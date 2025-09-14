import { NextRequest, NextResponse } from "next/server";
import agentCard from "../../../../agent-card.json";

export async function GET(request: NextRequest) {
  try {
    // Return the agent card with proper headers
    return NextResponse.json(agentCard, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Failed to serve agent card:", error);
    return NextResponse.json(
      { error: "Failed to serve agent card" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
