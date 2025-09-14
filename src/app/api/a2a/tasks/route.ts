import { NextRequest, NextResponse } from "next/server";
import { getRealFrontendA2AServer } from "@/lib/a2a-server-real-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the real A2A server instance
    const a2aServer = getRealFrontendA2AServer();
    const requestHandler = a2aServer.getRequestHandler();

    // Create a mock Express request/response for the A2A SDK
    const mockReq = {
      method: "POST",
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      json: () => Promise.resolve(body),
    };

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => NextResponse.json(data, { status: code }),
        end: () => new NextResponse(null, { status: code }),
      }),
      json: (data: any) => NextResponse.json(data),
    };

    // Handle the A2A task submission using the SDK
    await requestHandler.handleTaskSubmission(mockReq as any, mockRes as any);

    return NextResponse.json({ success: true });
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

    // Create mock request/response for task status
    const mockReq = {
      method: "GET",
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      params: { taskId },
    };

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => NextResponse.json(data, { status: code }),
        end: () => new NextResponse(null, { status: code }),
      }),
      json: (data: any) => NextResponse.json(data),
    };

    // Handle the A2A task status using the SDK
    await requestHandler.handleTaskStatus(mockReq as any, mockRes as any);

    return NextResponse.json({ success: true });
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
