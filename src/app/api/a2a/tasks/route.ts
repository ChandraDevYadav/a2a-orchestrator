import { NextRequest, NextResponse } from "next/server";
import { getRealFrontendA2AServer } from "@/lib/a2a-server-real-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the real A2A server instance
    const a2aServer = getRealFrontendA2AServer();
    const requestHandler = a2aServer.getRequestHandler();

    // Use the correct A2A SDK method for sending messages
    const result = await requestHandler.sendMessage({
      message: body.message,
      configuration: body.configuration || { blocking: true },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("A2A task submission failed:", error);
    return NextResponse.json(
      { error: "Failed to submit task" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // Get the real A2A server instance
    const a2aServer = getRealFrontendA2AServer();
    const requestHandler = a2aServer.getRequestHandler();

    // Use the correct A2A SDK method for getting task status
    const task = await requestHandler.getTask({
      id: taskId,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("A2A task status failed:", error);
    return NextResponse.json(
      { error: "Failed to get task status" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
